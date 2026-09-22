import { Request, Response } from 'express';
import supplierService from '../services/supplier-service.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../validation/supplier-validation.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../dto/supplier-dto.js';

class SupplierController {
  async list(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    try {
      const suppliers = await supplierService.list(req.companyId);
      return res.json(suppliers);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async create(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const parsed = createSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const supplier = await supplierService.create(
        req.companyId,
        parsed.data as CreateSupplierDTO,
      );
      return res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    const parsed = updateSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const supplier = await supplierService.update(
        req.companyId,
        id,
        parsed.data as UpdateSupplierDTO,
      );
      return res.json(supplier);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async remove(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    try {
      const supplier = await supplierService.remove(req.companyId, id);
      return res.json(supplier);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new SupplierController();
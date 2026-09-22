import { Request, Response } from 'express';
import productService from '../services/product-service.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validation/product-validation.js';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryDTO,
} from '../dto/product-dto.js';

class ProductController {
  async list(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const parsed = productQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const result = await productService.list(req.companyId, parsed.data as ProductQueryDTO);
      return res.json(result);
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

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const product = await productService.create(req.companyId, parsed.data as CreateProductDTO);
      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    try {
      const product = await productService.getById(req.companyId, id);
      return res.json(product);
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
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const product = await productService.update(
        req.companyId,
        id,
        parsed.data as UpdateProductDTO,
      );
      return res.json(product);
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
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    try {
      const product = await productService.remove(req.companyId, id);
      return res.json(product);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new ProductController();
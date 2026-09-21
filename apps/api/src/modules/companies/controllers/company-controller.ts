import { Request, Response } from 'express';
import companyService from '../services/company-service.js';
import { updateCompanySchema } from '../validation/company-validation.js';
import { UpdateCompanyDTO } from '../dto/company-dto.js';

class CompanyController {
  async getMine(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    try {
      const company = await companyService.getById(req.companyId);
      return res.json(company);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.companyId || id !== req.companyId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const parsed = updateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const company = await companyService.update(id, parsed.data as UpdateCompanyDTO);
      return res.json(company);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async inactivate(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.companyId || id !== req.companyId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    try {
      const company = await companyService.inactivate(id);
      return res.json(company);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new CompanyController();

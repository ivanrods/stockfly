import { Request, Response } from 'express';
import categoryService from '../services/category-service.js';
import { createCategorySchema, updateCategorySchema } from '../validation/category-validation.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dto/category-dto.js';

class CategoryController {
  async list(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    try {
      const categories = await categoryService.list(req.companyId);
      return res.json(categories);
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

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const category = await categoryService.create(
        req.companyId,
        parsed.data as CreateCategoryDTO,
      );
      return res.status(201).json(category);
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
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    try {
      const category = await categoryService.update(
        req.companyId,
        id,
        parsed.data as UpdateCategoryDTO,
      );
      return res.json(category);
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
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    try {
      const category = await categoryService.remove(req.companyId, id);
      return res.json(category);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new CategoryController();

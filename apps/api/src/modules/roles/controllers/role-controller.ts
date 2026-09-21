import { Request, Response } from 'express';
import roleService from '../services/role-service.js';

class RoleController {
  async list(_req: Request, res: Response) {
    try {
      const roles = await roleService.list();
      return res.json(roles);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new RoleController();

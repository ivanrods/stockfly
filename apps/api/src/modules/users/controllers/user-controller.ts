import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/user-service.js';
import { createUserSchema, updateUserRoleSchema } from '../validation/user-validation.js';
import { CreateUserDTO, UpdateUserRoleDTO } from '../dto/user-dto.js';

interface TokenPayload extends jwt.JwtPayload {
  id: string;
}

class UserController {
  async getMe(req: Request, res: Response) {
    const userId = (req.user as TokenPayload | undefined)?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    try {
      const user = await userService.getById(userId);
      const { password: _password, ...publicUser } = user.toJSON();
      return res.json(publicUser);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async list(req: Request, res: Response) {
    if (!req.companyId) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    try {
      const users = await userService.listByCompany(req.companyId);
      return res.json(users);
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

    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const data = parsed.data as CreateUserDTO;

    try {
      const user = await userService.create({ ...data, companyId: req.companyId });
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateRole(req: Request, res: Response) {
    const { id } = req.params;
    const actorId = (req.user as TokenPayload | undefined)?.id;

    if (!req.companyId || !actorId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (typeof id !== 'string') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const parsed = updateUserRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const { role } = parsed.data as UpdateUserRoleDTO;

    try {
      const user = await userService.updateRole(id, req.companyId, role, actorId);
      return res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new UserController();

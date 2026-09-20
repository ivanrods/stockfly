import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/user-service.js';

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
}

export default new UserController();
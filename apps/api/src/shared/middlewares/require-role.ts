import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../database/models/user-model.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
}

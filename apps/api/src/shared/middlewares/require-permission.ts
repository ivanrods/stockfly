import { Request, Response, NextFunction } from 'express';
import { Role } from '../database/models/role-model.js';
import { Permission } from '../database/models/permission-model.js';

export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    try {
      const role = await Role.findOne({
        where: { name: req.role },
        include: [{ model: Permission, as: 'permissions' }],
      });

      const hasPermission = role?.permissions?.some((permission) =>
        permissions.includes(permission.name),
      );

      if (!hasPermission) {
        return res.status(403).json({ message: 'Permissão insuficiente' });
      }

      next();
    } catch {
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

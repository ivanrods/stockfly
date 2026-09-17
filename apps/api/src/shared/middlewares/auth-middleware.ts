import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import { UserRole } from '../database/models/user-model.js';

interface TokenPayload extends jwt.JwtPayload {
  id: string;
  companyId?: string | null;
  role?: UserRole;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, jwtConfig.secret!) as TokenPayload;
    req.user = decoded;
    req.companyId = decoded.companyId ?? undefined;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
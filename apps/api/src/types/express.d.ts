import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
      companyId?: string;
      role?: 'admin' | 'manager' | 'operator' | 'viewer';
    }
  }
}

export {};

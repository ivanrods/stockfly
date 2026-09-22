import type { TokenPair } from './auth-types';
import type { Company } from '@/features/companies/types/company-types';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
  cnpj?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
  role: UserRole;
}

export interface RegisterResponse extends TokenPair {
  message: string;
  user: User;
  company: Company;
}

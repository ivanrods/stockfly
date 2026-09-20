import type { User } from './register-types';
import type { TokenPair } from './auth-types';
import type { Company } from '@/features/companies/types/company-types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends TokenPair {
  user: User;
  company: Company | null;
}
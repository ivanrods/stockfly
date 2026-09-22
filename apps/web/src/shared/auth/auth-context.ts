import { createContext } from 'react';
import type { Company } from '@/features/companies/types/company-types';
import type { User } from '@/features/auth/types/register-types';

export interface AuthContextValue {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, company: Company | null) => void;
  clearSession: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

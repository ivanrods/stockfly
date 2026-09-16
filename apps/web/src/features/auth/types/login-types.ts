import type { User } from './register-types';
import type { TokenPair } from './auth-types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends TokenPair {
  user: User;
}
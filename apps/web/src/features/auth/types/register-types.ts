import type { TokenPair } from './auth-types';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RegisterResponse extends TokenPair {
  message: string;
  user: User;
}

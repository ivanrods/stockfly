import { useState } from 'react';
import { login as loginService } from '../services/login-service';
import type { LoginRequest, LoginResponse } from '../types/login-types';
import { ApiError } from '@/shared/api/http-client';
import { setTokens } from '@/shared/auth/token-storage';
import { useAuth } from '@/shared/auth/use-auth';

interface UseLoginReturn {
  login: (data: LoginRequest) => Promise<LoginResponse>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const { setSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(data: LoginRequest): Promise<LoginResponse> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginService(data);
      setTokens(result);
      setSession(result.user, result.company);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao fazer login';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}

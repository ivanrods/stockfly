import { useState } from 'react';
import { register as registerService } from '../services/register-service';
import type { RegisterRequest, RegisterResponse } from '../types/register-types';
import { ApiError } from '@/shared/api/http-client';

interface UseRegisterReturn {
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(data: RegisterRequest): Promise<RegisterResponse> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerService(data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao criar conta';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, error };
}

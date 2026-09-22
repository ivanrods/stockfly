import { useState } from 'react';
import { updateCompany } from '../services/company-service';
import type { UpdateCompanyRequest } from '../types/company-types';
import { ApiError } from '@/shared/api/http-client';
import { useAuth } from '@/shared/auth/use-auth';

interface UseUpdateCompanyReturn {
  update: (id: string, data: UpdateCompanyRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useUpdateCompany(): UseUpdateCompanyReturn {
  const { user, setSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function update(id: string, data: UpdateCompanyRequest): Promise<void> {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await updateCompany(id, data);
      setSuccess(true);
      if (user) {
        setSession(user, updated);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar os dados';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return { update, isLoading, error, success };
}

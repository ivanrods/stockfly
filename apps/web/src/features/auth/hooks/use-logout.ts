import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/use-auth';

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useLogout(): UseLogoutReturn {
  const navigate = useNavigate();
  const { logout: logoutSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function logout(): Promise<void> {
    setIsLoading(true);

    try {
      await logoutSession();
    } finally {
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  }

  return { logout, isLoading };
}
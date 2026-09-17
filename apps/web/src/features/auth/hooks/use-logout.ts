import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as logoutService } from '../services/logout-service';
import { clearTokens, getRefreshToken } from '@/shared/auth/token-storage';

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useLogout(): UseLogoutReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function logout(): Promise<void> {
    setIsLoading(true);

    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await logoutService(refreshToken);
      }
    } catch {
      // logout local independe da resposta da API
    } finally {
      clearTokens();
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  }

  return { logout, isLoading };
}

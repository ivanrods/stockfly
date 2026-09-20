import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Company } from '@/features/companies/types/company-types';
import type { User } from '@/features/auth/types/register-types';
import { logout as requestLogout } from '@/features/auth/services/logout-service';
import { getCurrentUser } from '@/features/auth/services/current-user-service';
import { getMyCompany } from '@/features/companies/services/company-service';
import { decodeJwtPayload } from './jwt';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from './token-storage';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken || !refreshToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const payload = decodeJwtPayload(accessToken);
      if (!payload) {
        clearTokens();
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const [restoredUser, restoredCompany] = await Promise.all([
          getCurrentUser(),
          payload.companyId ? getMyCompany() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setUser(restoredUser);
        setCompany(restoredCompany);
      } catch {
        if (cancelled) return;
        clearTokens();
        setUser(null);
        setCompany(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setSession = useCallback((nextUser: User, nextCompany: Company | null) => {
    setUser(nextUser);
    setCompany(nextCompany);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setCompany(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await requestLogout(refreshToken);
      } catch {
        // o logout local independe da resposta da API
      }
    }
    clearTokens();
    setUser(null);
    setCompany(null);
  }, []);

  const isAuthenticated = user !== null;

  const value = useMemo<AuthContextValue>(
    () => ({ user, company, isAuthenticated, isLoading, setSession, clearSession, logout }),
    [user, company, isAuthenticated, isLoading, setSession, clearSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './auth-provider';
import { useAuth } from './use-auth';
import { setTokens, clearTokens, getAccessToken } from './token-storage';
import type { User } from '@/features/auth/types/register-types';
import type { Company } from '@/features/companies/types/company-types';
import type { ReactNode } from 'react';

const { getCurrentUserMock, getMyCompanyMock, logoutMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getMyCompanyMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock('@/features/auth/services/current-user-service', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/features/companies/services/company-service', () => ({
  getMyCompany: getMyCompanyMock,
}));

vi.mock('@/features/auth/services/logout-service', () => ({
  logout: logoutMock,
}));

const user: User = {
  id: 'u-1',
  name: 'João',
  email: 'joao@email.com',
  companyId: 'c-1',
  role: 'admin',
};

const company: Company = {
  id: 'c-1',
  name: 'Empresa LTDA',
  cnpj: '12345678000190',
  phone: null,
  email: null,
  status: 'active',
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

function createToken(payload: object): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.assinatura`;
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
  });

  it('fica não autenticado e finaliza o loading sem tokens', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(getMyCompanyMock).not.toHaveBeenCalled();
  });

  it('limpa o token inválido e fica não autenticado', async () => {
    setTokens({ accessToken: 'token-invalido', refreshToken: 'refresh-1' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('restaura a sessão buscando usuário e empresa', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(getMyCompanyMock).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(result.current.company).toEqual(company);
  });

  it('não busca empresa quando o payload não tem companyId', async () => {
    const token = createToken({ id: 'u-1', role: 'viewer' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue({ ...user, companyId: null, role: 'viewer' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(getMyCompanyMock).not.toHaveBeenCalled();
    expect(result.current.company).toBeNull();
  });

  it('limpa tokens e sessão quando a restauração falha', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockRejectedValue(new Error('erro'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('setSession e clearSession atualizam a sessão', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setSession(user, company);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(result.current.company).toEqual(company);

    act(() => {
      result.current.clearSession();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.company).toBeNull();
  });

  it('logout revoga o refresh token e limpa a sessão local', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutMock).toHaveBeenCalledWith('refresh-1');
    expect(getAccessToken()).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.company).toBeNull();
  });

  it('logout ignora falha do serviço e limpa a sessão local', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);
    logoutMock.mockRejectedValue(new Error('erro'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(getAccessToken()).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
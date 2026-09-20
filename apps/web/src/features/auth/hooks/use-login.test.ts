import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ApiError } from '@/shared/api/http-client';
import { clearTokens, getAccessToken, getRefreshToken } from '@/shared/auth/token-storage';

const { loginServiceMock } = vi.hoisted(() => ({
  loginServiceMock: vi.fn(),
}));

vi.mock('../services/login-service', () => ({
  login: loginServiceMock,
}));

import { useLogin } from './use-login';
import type { LoginResponse } from '../types/login-types';

const response: LoginResponse = {
  user: {
    id: 'user-1',
    name: 'João',
    email: 'joao@email.com',
    companyId: 'company-1',
    role: 'admin',
  },
  company: {
    id: 'company-1',
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
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
  });

  it('alterna isLoading durante a requisição e retorna o resultado', async () => {
    loginServiceMock.mockResolvedValue(response);
    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<LoginResponse>;
    act(() => {
      promise = result.current.login({ email: 'joao@email.com', password: '12345678' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
  });

  it('define error quando o serviço lança ApiError e relança a exceção', async () => {
    loginServiceMock.mockRejectedValue(new ApiError('Senha inválida', 401));
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await expect(
        result.current.login({ email: 'joao@email.com', password: 'senha-errada' }),
      ).rejects.toThrow('Senha inválida');
    });

    expect(result.current.error).toBe('Senha inválida');
    expect(result.current.isLoading).toBe(false);
  });

  it('define error genérico quando o serviço lança erro desconhecido', async () => {
    loginServiceMock.mockRejectedValue(new Error('erro interno'));
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current
        .login({ email: 'joao@email.com', password: '12345678' })
        .catch(() => undefined);
    });

    expect(result.current.error).toBe('Erro ao fazer login');
  });

  it('limpa o erro ao iniciar uma nova requisição', async () => {
    loginServiceMock.mockRejectedValueOnce(new ApiError('Usuário não encontrado', 401));
    loginServiceMock.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current
        .login({ email: 'joao@email.com', password: '12345678' })
        .catch(() => undefined);
    });
    expect(result.current.error).toBe('Usuário não encontrado');

    await act(async () => {
      await result.current.login({ email: 'joao@email.com', password: '12345678' });
    });

    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

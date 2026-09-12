import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ApiError } from '@/shared/api/http-client';

const { registerServiceMock } = vi.hoisted(() => ({
  registerServiceMock: vi.fn(),
}));

vi.mock('../services/register-service', () => ({
  register: registerServiceMock,
}));

import { useRegister } from './use-register';
import type { RegisterResponse } from '../types/register-types';

const response: RegisterResponse = {
  message: 'Usuário criado com sucesso',
  user: { id: 'user-1', name: 'João', email: 'joao@email.com' },
  token: 'token-falso',
};

describe('useRegister', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna o resultado e alterna isLoading durante a requisição', async () => {
    registerServiceMock.mockResolvedValue(response);
    const { result } = renderHook(() => useRegister());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<RegisterResponse>;
    act(() => {
      promise = result.current.register({
        name: 'João',
        email: 'joao@email.com',
        password: '12345678',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('recebe o resultado quando o registro é bem-sucedido', async () => {
    registerServiceMock.mockResolvedValue(response);
    const { result } = renderHook(() => useRegister());

    let received: RegisterResponse | undefined;
    await act(async () => {
      received = await result.current.register({
        name: 'João',
        email: 'joao@email.com',
        password: '12345678',
      });
    });

    expect(received).toEqual(response);
  });

  it('define error quando o serviço lança ApiError e relança a exceção', async () => {
    registerServiceMock.mockRejectedValue(new ApiError('E-mail já está em uso', 400));
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await expect(
        result.current.register({
          name: 'João',
          email: 'joao@email.com',
          password: '12345678',
        }),
      ).rejects.toThrow('E-mail já está em uso');
    });

    expect(result.current.error).toBe('E-mail já está em uso');
    expect(result.current.isLoading).toBe(false);
  });

  it('define erro genérico quando o serviço lança erro desconhecido', async () => {
    registerServiceMock.mockRejectedValue(new Error('erro interno'));
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current
        .register({ name: 'João', email: 'joao@email.com', password: '12345678' })
        .catch(() => undefined);
    });

    expect(result.current.error).toBe('Erro ao criar conta');
  });

  it('limpa o erro ao iniciar uma nova requisição', async () => {
    registerServiceMock.mockRejectedValueOnce(new ApiError('E-mail já está em uso', 400));
    registerServiceMock.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current
        .register({ name: 'João', email: 'joao@email.com', password: '12345678' })
        .catch(() => undefined);
    });
    expect(result.current.error).toBe('E-mail já está em uso');

    await act(async () => {
      await result.current.register({
        name: 'João',
        email: 'joao@email.com',
        password: '12345678',
      });
    });

    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

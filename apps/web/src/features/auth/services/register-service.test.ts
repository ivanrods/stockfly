import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { post: postMock },
  ApiError: class ApiError extends Error {},
}));

import { register } from './register-service';
import type { RegisterResponse } from '../types/register-types';

describe('register-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama POST /auth/register com os dados fornecidos', async () => {
    const data = { name: 'João', email: 'joao@email.com', password: '12345678' };
    const response: RegisterResponse = {
      message: 'Usuário criado com sucesso',
      user: { id: 'user-1', name: 'João', email: 'joao@email.com' },
      token: 'token-falso',
    };
    postMock.mockResolvedValue({ data: response });

    const result = await register(data);

    expect(postMock).toHaveBeenCalledWith('/auth/register', data);
    expect(result).toEqual(response);
  });
});
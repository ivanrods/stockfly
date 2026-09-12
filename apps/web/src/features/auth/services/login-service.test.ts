import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { post: postMock },
  ApiError: class ApiError extends Error {},
}));

import { login } from './login-service';
import type { LoginResponse } from '../types/login-types';

describe('login-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama POST /auth/login com as credenciais fornecidas', async () => {
    const data = { email: 'joao@email.com', password: '12345678' };
    const response: LoginResponse = {
      user: { id: 'user-1', name: 'João', email: 'joao@email.com' },
      token: 'token-falso',
    };
    postMock.mockResolvedValue({ data: response });

    const result = await login(data);

    expect(postMock).toHaveBeenCalledWith('/auth/login', data);
    expect(result).toEqual(response);
  });
});

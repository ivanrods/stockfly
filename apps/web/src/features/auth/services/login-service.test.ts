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
    postMock.mockResolvedValue({ data: response });

    const result = await login(data);

    expect(postMock).toHaveBeenCalledWith('/auth/login', data);
    expect(result).toEqual(response);
  });
});

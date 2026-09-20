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
    const data = {
      name: 'João',
      email: 'joao@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
      cnpj: '12345678000190',
    };
    const response: RegisterResponse = {
      message: 'Usuário criado com sucesso',
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

    const result = await register(data);

    expect(postMock).toHaveBeenCalledWith('/auth/register', data);
    expect(result).toEqual(response);
  });
});

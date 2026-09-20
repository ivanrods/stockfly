import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { get: getMock },
  ApiError: class ApiError extends Error {},
}));

import { getCurrentUser } from './current-user-service';
import type { User } from '../types/register-types';

describe('current-user-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama GET /users/me e retorna o usuário', async () => {
    const user: User = {
      id: 'u-1',
      name: 'João',
      email: 'joao@email.com',
      companyId: 'c-1',
      role: 'admin',
    };
    getMock.mockResolvedValue({ data: user });

    const result = await getCurrentUser();

    expect(getMock).toHaveBeenCalledWith('/users/me');
    expect(result).toEqual(user);
  });
});
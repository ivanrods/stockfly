import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

vi.mock('../repository/user-repository.js', () => ({
  default: { findById: findByIdMock },
}));

import userService from './user-service.js';

const user = { id: 'u-1', name: 'João', email: 'joao@email.com' };

describe('UserService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getById retorna o usuário quando existe', async () => {
    findByIdMock.mockResolvedValue(user);
    await expect(userService.getById('u-1')).resolves.toEqual(user);
    expect(findByIdMock).toHaveBeenCalledWith('u-1');
  });

  it('getById lança erro quando não existe', async () => {
    findByIdMock.mockResolvedValue(null);
    await expect(userService.getById('x')).rejects.toThrow('Usuário não encontrado');
  });
});
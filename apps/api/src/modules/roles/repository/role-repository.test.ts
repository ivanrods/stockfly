import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findAllMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/role-model.js', () => ({
  Role: { findAll: findAllMock },
}));

import roleRepository from './role-repository.js';

const roles = [{ id: 'r-1', name: 'admin' }];

describe('RoleRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findAll chama Role.findAll ordenado por nome', async () => {
    findAllMock.mockResolvedValue(roles);
    await expect(roleRepository.findAll()).resolves.toEqual(roles);
    expect(findAllMock).toHaveBeenCalledWith({ order: [['name', 'ASC']] });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
}));

vi.mock('../repository/role-repository.js', () => ({
  default: { findAll: listMock },
}));

import roleService from './role-service.js';

describe('RoleService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list retorna os papéis do repositório', async () => {
    const roles = [{ id: 'r-1', name: 'admin' }];
    listMock.mockResolvedValue(roles);
    await expect(roleService.list()).resolves.toEqual(roles);
    expect(listMock).toHaveBeenCalledOnce();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByPkMock } = vi.hoisted(() => ({
  findByPkMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/user-model.js', () => ({
  User: { findByPk: findByPkMock },
}));

import userRepository from './user-repository.js';

const user = { id: 'u-1', name: 'João', email: 'joao@email.com' };

describe('UserRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findById chama User.findByPk', async () => {
    findByPkMock.mockResolvedValue(user);
    await userRepository.findById('u-1');
    expect(findByPkMock).toHaveBeenCalledWith('u-1');
  });
});
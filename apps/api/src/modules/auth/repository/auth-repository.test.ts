import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from 'sequelize';

const {
  userFindOneMock,
  userFindByPkMock,
  userCreateMock,
  refreshCreateMock,
  refreshFindOneMock,
  destroyMock,
} = vi.hoisted(() => ({
  userFindOneMock: vi.fn(),
  userFindByPkMock: vi.fn(),
  userCreateMock: vi.fn(),
  refreshCreateMock: vi.fn(),
  refreshFindOneMock: vi.fn(),
  destroyMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/user-model.js', () => ({
  User: { findOne: userFindOneMock, findByPk: userFindByPkMock, create: userCreateMock },
}));

vi.mock('../../../shared/database/models/refresh-token-model.js', () => ({
  RefreshToken: { create: refreshCreateMock, findOne: refreshFindOneMock, destroy: destroyMock },
}));

import authRepository from './auth-repository.js';

describe('AuthRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findByEmail chama User.findOne com o email', async () => {
    userFindOneMock.mockResolvedValue({ id: '1' });

    await authRepository.findByEmail('a@b.com');

    expect(userFindOneMock).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('findById chama User.findByPk com o id', async () => {
    userFindByPkMock.mockResolvedValue({ id: '1' });

    await authRepository.findById('1');

    expect(userFindByPkMock).toHaveBeenCalledWith('1');
  });

  it('create chama User.create com os dados e sem transação', async () => {
    const data = {
      email: 'a@b.com',
      password: 'hash',
      name: 'João',
      companyId: 'c-1',
      role: 'admin' as const,
    };
    userCreateMock.mockResolvedValue({ id: '1' });

    await authRepository.create(data);

    expect(userCreateMock).toHaveBeenCalledWith(data, undefined);
  });

  it('create repassa a transação para User.create', async () => {
    const data = {
      email: 'a@b.com',
      password: 'hash',
      name: 'João',
      companyId: 'c-1',
      role: 'admin' as const,
    };
    const transaction = { id: 'tx' } as unknown as Transaction;
    userCreateMock.mockResolvedValue({ id: '1' });

    await authRepository.create(data, transaction);

    expect(userCreateMock).toHaveBeenCalledWith(data, { transaction });
  });

  it('createRefreshToken chama RefreshToken.create com os dados', async () => {
    const data = { token: 'rt', userId: '1', expiresAt: new Date() };

    await authRepository.createRefreshToken(data);

    expect(refreshCreateMock).toHaveBeenCalledWith(data);
  });

  it('findRefreshToken chama RefreshToken.findOne com o token', async () => {
    refreshFindOneMock.mockResolvedValue({ id: '1' });

    await authRepository.findRefreshToken('rt');

    expect(refreshFindOneMock).toHaveBeenCalledWith({ where: { token: 'rt' } });
  });

  it('deleteRefreshToken chama RefreshToken.destroy com o token', async () => {
    await authRepository.deleteRefreshToken('rt');

    expect(destroyMock).toHaveBeenCalledWith({ where: { token: 'rt' } });
  });

  it('deleteRefreshTokensByUserId chama RefreshToken.destroy com o userId', async () => {
    await authRepository.deleteRefreshTokensByUserId('user-id');

    expect(destroyMock).toHaveBeenCalledWith({ where: { userId: 'user-id' } });
  });
});

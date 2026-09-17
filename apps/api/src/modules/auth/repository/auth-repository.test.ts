import { beforeEach, describe, expect, it, vi } from 'vitest';

const { userFindOneMock, userCreateMock, refreshCreateMock, refreshFindOneMock, destroyMock } =
  vi.hoisted(() => ({
    userFindOneMock: vi.fn(),
    userCreateMock: vi.fn(),
    refreshCreateMock: vi.fn(),
    refreshFindOneMock: vi.fn(),
    destroyMock: vi.fn(),
  }));

vi.mock('../../../shared/database/models/user-model.js', () => ({
  User: { findOne: userFindOneMock, create: userCreateMock },
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

  it('create chama User.create com os dados', async () => {
    const data = { email: 'a@b.com', password: 'hash', name: 'João' };
    userCreateMock.mockResolvedValue({ id: '1' });

    await authRepository.create(data);

    expect(userCreateMock).toHaveBeenCalledWith(data);
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

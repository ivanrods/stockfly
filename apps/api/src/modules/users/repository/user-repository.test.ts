import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByPkMock, findOneMock, findAllMock, createMock } = vi.hoisted(() => ({
  findByPkMock: vi.fn(),
  findOneMock: vi.fn(),
  findAllMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/user-model.js', () => ({
  User: {
    findByPk: findByPkMock,
    findOne: findOneMock,
    findAll: findAllMock,
    create: createMock,
  },
}));

import userRepository from './user-repository.js';

const user = { id: 'u-1', name: 'João', email: 'joao@email.com' };
const updatedUser = { id: 'u-1', role: 'manager', update: vi.fn() };

describe('UserRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findById chama User.findByPk', async () => {
    findByPkMock.mockResolvedValue(user);
    await userRepository.findById('u-1');
    expect(findByPkMock).toHaveBeenCalledWith('u-1');
  });

  it('findByEmail chama User.findOne com o email', async () => {
    findOneMock.mockResolvedValue(user);
    await userRepository.findByEmail('joao@email.com');
    expect(findOneMock).toHaveBeenCalledWith({ where: { email: 'joao@email.com' } });
  });

  it('findByCompany chama User.findAll com companyId e ordenação', async () => {
    findAllMock.mockResolvedValue([user]);
    await userRepository.findByCompany('c-1');
    expect(findAllMock).toHaveBeenCalledWith({
      where: { companyId: 'c-1' },
      order: [['createdAt', 'DESC']],
    });
  });

  it('create chama User.create com os dados', async () => {
    createMock.mockResolvedValue(user);
    await userRepository.create({
      name: 'João',
      email: 'joao@email.com',
      password: 'hash',
      role: 'viewer',
      companyId: 'c-1',
    });
    expect(createMock).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      password: 'hash',
      role: 'viewer',
      companyId: 'c-1',
    });
  });

  it('updateRole retorna null quando o usuário não existe', async () => {
    findByPkMock.mockResolvedValue(null);
    await expect(userRepository.updateRole('x', 'manager')).resolves.toBeNull();
  });

  it('updateRole atualiza o papel do usuário', async () => {
    findByPkMock.mockResolvedValue(updatedUser);
    updatedUser.update.mockResolvedValue(updatedUser);

    const result = await userRepository.updateRole('u-1', 'manager');

    expect(updatedUser.update).toHaveBeenCalledWith({ role: 'manager' });
    expect(result).toBe(updatedUser);
  });
});

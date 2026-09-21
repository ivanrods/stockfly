import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByIdMock, findByEmailMock, findByCompanyMock, createMock, updateRoleMock } = vi.hoisted(
  () => ({
    findByIdMock: vi.fn(),
    findByEmailMock: vi.fn(),
    findByCompanyMock: vi.fn(),
    createMock: vi.fn(),
    updateRoleMock: vi.fn(),
  }),
);

vi.mock('../repository/user-repository.js', () => ({
  default: {
    findById: findByIdMock,
    findByEmail: findByEmailMock,
    findByCompany: findByCompanyMock,
    create: createMock,
    updateRole: updateRoleMock,
  },
}));

import bcrypt from 'bcrypt';
import userService from './user-service.js';

const user = { id: 'u-1', name: 'João', email: 'joao@email.com' };
const userJson = {
  id: 'u-1',
  name: 'João',
  email: 'joao@email.com',
  password: 'hash',
  companyId: 'c-1',
  role: 'viewer',
};

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

  it('listByCompany retorna usuários sem senha', async () => {
    findByCompanyMock.mockResolvedValue([
      { toJSON: () => userJson },
      { toJSON: () => ({ ...userJson, id: 'u-2', email: 'maria@email.com' }) },
    ]);

    const result = await userService.listByCompany('c-1');

    expect(findByCompanyMock).toHaveBeenCalledWith('c-1');
    expect(result).toEqual([
      { id: 'u-1', name: 'João', email: 'joao@email.com', companyId: 'c-1', role: 'viewer' },
      { id: 'u-2', name: 'João', email: 'maria@email.com', companyId: 'c-1', role: 'viewer' },
    ]);
  });

  it('create lança erro se o e-mail já está em uso', async () => {
    findByEmailMock.mockResolvedValue({ id: 'u-1' });
    await expect(
      userService.create({
        name: 'João',
        email: 'joao@email.com',
        password: '12345678',
        role: 'viewer',
        companyId: 'c-1',
      }),
    ).rejects.toThrow('E-mail já está em uso');
  });

  it('create hasheia a senha e retorna usuário público', async () => {
    findByEmailMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ toJSON: () => userJson });
    const bcryptHashSpy = vi.spyOn(bcrypt, 'hash');

    const result = await userService.create({
      name: 'João',
      email: 'joao@email.com',
      password: '12345678',
      role: 'viewer',
      companyId: 'c-1',
    });

    expect(createMock).toHaveBeenCalled();
    const created = createMock.mock.calls[0]![0] as { password: string };
    expect(created.password).not.toBe('12345678');
    expect(bcryptHashSpy).toHaveBeenCalledWith('12345678', 10);
    expect((result as { password?: string }).password).toBeUndefined();
    expect(result).toEqual({
      id: 'u-1',
      name: 'João',
      email: 'joao@email.com',
      companyId: 'c-1',
      role: 'viewer',
    });
  });

  it('updateRole lança erro se o usuário não existe', async () => {
    findByIdMock.mockResolvedValue(null);
    await expect(userService.updateRole('x', 'c-1', 'manager', 'u-2')).rejects.toThrow(
      'Usuário não encontrado',
    );
  });

  it('updateRole lança erro se o usuário é de outra empresa', async () => {
    findByIdMock.mockResolvedValue({ ...userJson, companyId: 'outra' });
    await expect(userService.updateRole('u-1', 'c-1', 'manager', 'u-2')).rejects.toThrow(
      'Usuário não pertence à sua empresa',
    );
  });

  it('updateRole lança erro ao alterar o próprio papel', async () => {
    findByIdMock.mockResolvedValue(userJson);
    await expect(userService.updateRole('u-1', 'c-1', 'manager', 'u-1')).rejects.toThrow(
      'Você não pode alterar o próprio papel',
    );
  });

  it('updateRole retorna usuário público com papel atualizado', async () => {
    findByIdMock.mockResolvedValue(userJson);
    updateRoleMock.mockResolvedValue({
      toJSON: () => ({ ...userJson, role: 'manager' }),
    });

    const result = await userService.updateRole('u-1', 'c-1', 'manager', 'u-2');

    expect(updateRoleMock).toHaveBeenCalledWith('u-1', 'manager');
    expect(result).toEqual({
      id: 'u-1',
      name: 'João',
      email: 'joao@email.com',
      companyId: 'c-1',
      role: 'manager',
    });
  });
});

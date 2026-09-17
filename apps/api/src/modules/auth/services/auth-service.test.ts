import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole } from '../../../shared/database/models/user-model.js';
import type { RefreshToken } from '../../../shared/database/models/refresh-token-model.js';
import type { Company } from '../../../shared/database/models/company-model.js';

const {
  findByEmailMock,
  findByIdMock,
  createMock,
  hashMock,
  compareMock,
  signMock,
  createRefreshTokenMock,
  findRefreshTokenMock,
  deleteRefreshTokenMock,
  companyCreateMock,
  companyFindByPkMock,
  transactionMock,
} = vi.hoisted(() => ({
  findByEmailMock: vi.fn<(email: string) => Promise<User | null>>(),
  findByIdMock: vi.fn<(id: string) => Promise<User | null>>(),
  createMock: vi.fn<
    (
      data: { email: string; password: string; name: string; companyId: string; role: UserRole },
      transaction?: unknown,
    ) => Promise<User>
  >(),
  hashMock: vi.fn(async (_password: string, _saltRounds: number) => 'senha-hasheada'),
  compareMock: vi.fn(async (_password: string, _hash: string) => true),
  signMock: vi.fn(() => 'token-falso'),
  createRefreshTokenMock: vi.fn(async () => undefined),
  findRefreshTokenMock: vi.fn<(token: string) => Promise<RefreshToken | null>>(async () => null),
  deleteRefreshTokenMock: vi.fn(async () => 1),
  companyCreateMock: vi.fn(async (_data: unknown, _opts?: unknown) => makeCompany()),
  companyFindByPkMock: vi.fn<(id: string) => Promise<Company | null>>(async () => null),
  transactionMock: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ id: 'tx' })),
}));

vi.mock('../repository/auth-repository.js', () => ({
  default: {
    findByEmail: findByEmailMock,
    findById: findByIdMock,
    create: createMock,
    createRefreshToken: createRefreshTokenMock,
    findRefreshToken: findRefreshTokenMock,
    deleteRefreshToken: deleteRefreshTokenMock,
  },
}));
vi.mock('bcrypt', () => ({ default: { hash: hashMock, compare: compareMock } }));
vi.mock('jsonwebtoken', () => ({ default: { sign: signMock } }));
vi.mock('../../../shared/config/database.js', () => ({
  sequelize: { transaction: transactionMock },
}));
vi.mock('../../../shared/database/models/company-model.js', () => ({
  Company: { create: companyCreateMock, findByPk: companyFindByPkMock },
}));

import authService from './auth-service.js';

function makeUser() {
  return {
    id: 'user-id',
    email: 'user@email.com',
    name: 'João',
    password: 'senha-hasheada',
    companyId: null,
    role: 'viewer',
    toJSON() {
      return { ...this };
    },
  } as unknown as User;
}

function makeCompany() {
  return {
    id: 'company-id',
    name: 'Empresa LTDA',
    cnpj: null,
    phone: null,
    email: null,
    status: 'active',
    toJSON() {
      return { ...this };
    },
  } as unknown as Company;
}

const user = makeUser();
const company = makeCompany();
const userInCompany = { ...user, companyId: company.id, role: 'admin' } as unknown as User;

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cria empresa e usuário admin em transação e retorna user + company + tokens', async () => {
    findByEmailMock.mockResolvedValue(null);
    createMock.mockResolvedValue(userInCompany);

    const result = await authService.register({
      email: user.email,
      password: '12345678',
      name: user.name,
      companyName: company.name,
      cnpj: null,
      companyPhone: null,
      companyEmail: null,
    });

    expect(hashMock).toHaveBeenCalledWith('12345678', 10);
    expect(transactionMock).toHaveBeenCalled();
    expect(companyCreateMock).toHaveBeenCalledWith(
      { name: company.name, cnpj: null, phone: null, email: null },
      { transaction: { id: 'tx' } },
    );
    expect(createMock).toHaveBeenCalledWith(
      {
        email: user.email,
        password: 'senha-hasheada',
        name: user.name,
        companyId: company.id,
        role: 'admin',
      },
      { id: 'tx' },
    );
    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id, companyId: company.id, role: 'admin' }),
      expect.anything(),
      expect.anything(),
    );
    expect(createRefreshTokenMock).toHaveBeenCalled();
    expect(result.user.password).toBeUndefined();
    expect(result.company.name).toBe(company.name);
    expect(result.accessToken).toBe('token-falso');
    expect(result.refreshToken).toBeTruthy();
  });

  it('lança erro se o email já está em uso', async () => {
    findByEmailMock.mockResolvedValue(user);

    await expect(
      authService.register({
        email: user.email,
        password: '12345678',
        name: user.name,
        companyName: company.name,
        cnpj: null,
        companyPhone: null,
        companyEmail: null,
      }),
    ).rejects.toThrow('E-mail já está em uso');

    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loga com sucesso e retorna user sem senha + tokens', async () => {
    findByEmailMock.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    const result = await authService.login(user.email, '12345678');

    expect(compareMock).toHaveBeenCalledWith('12345678', user.password);
    expect(result.user.password).toBeUndefined();
    expect(result.company).toBeNull();
    expect(companyFindByPkMock).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('token-falso');
    expect(result.refreshToken).toBeTruthy();
  });

  it('loga e retorna a empresa quando o usuário pertence a uma', async () => {
    findByEmailMock.mockResolvedValue(userInCompany);
    compareMock.mockResolvedValue(true);
    companyFindByPkMock.mockResolvedValue(company);

    const result = await authService.login(user.email, '12345678');

    expect(companyFindByPkMock).toHaveBeenCalledWith(company.id);
    expect(result.company).toMatchObject({ id: company.id, name: company.name });
  });

  it('lança erro se o usuário não existe', async () => {
    findByEmailMock.mockResolvedValue(null);

    await expect(authService.login('naoexiste@email.com', '12345678')).rejects.toThrow(
      'Usuário não encontrado',
    );
  });

  it('lança erro se a senha está errada', async () => {
    findByEmailMock.mockResolvedValue(user);
    compareMock.mockResolvedValue(false);

    await expect(authService.login(user.email, 'senha-errada')).rejects.toThrow('Senha inválida');
  });
});

describe('AuthService.refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renova os tokens e revoga o refresh token antigo', async () => {
    const stored = {
      id: 'refresh-id',
      token: 'refresh-token-antigo',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as unknown as RefreshToken;
    findRefreshTokenMock.mockResolvedValue(stored);
    findByIdMock.mockResolvedValue(user);

    const result = await authService.refresh('refresh-token-antigo');

    expect(findByIdMock).toHaveBeenCalledWith(user.id);
    expect(deleteRefreshTokenMock).toHaveBeenCalledWith('refresh-token-antigo');
    expect(createRefreshTokenMock).toHaveBeenCalled();
    expect(result.accessToken).toBe('token-falso');
    expect(result.refreshToken).toBeTruthy();
  });

  it('lança erro se o token não existe', async () => {
    findRefreshTokenMock.mockResolvedValue(null);

    await expect(authService.refresh('token-inexistente')).rejects.toThrow(
      'Refresh token inválido',
    );
  });

  it('lança erro e revoga se o token está expirado', async () => {
    const stored = {
      id: 'refresh-id',
      token: 'refresh-token-expirado',
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
    } as unknown as RefreshToken;
    findRefreshTokenMock.mockResolvedValue(stored);

    await expect(authService.refresh('refresh-token-expirado')).rejects.toThrow(
      'Refresh token expirado',
    );
    expect(deleteRefreshTokenMock).toHaveBeenCalledWith('refresh-token-expirado');
  });
});

describe('AuthService.logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revoga o refresh token', async () => {
    await authService.logout('refresh-token');

    expect(deleteRefreshTokenMock).toHaveBeenCalledWith('refresh-token');
  });
});

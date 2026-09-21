import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

const { getByIdMock, listByCompanyMock, createMock, updateRoleMock } = vi.hoisted(() => ({
  getByIdMock: vi.fn(),
  listByCompanyMock: vi.fn(),
  createMock: vi.fn(),
  updateRoleMock: vi.fn(),
}));

vi.mock('../services/user-service.js', () => ({
  default: {
    getById: getByIdMock,
    listByCompany: listByCompanyMock,
    create: createMock,
    updateRole: updateRoleMock,
  },
}));

import userController from './user-controller.js';

interface FakeReq extends Request {
  user?: string | JwtPayload;
  companyId?: string;
}

function makeReq(overrides: Partial<FakeReq> = {}): FakeReq {
  return { body: {}, params: {}, ...overrides } as FakeReq;
}

interface FakeRes extends Response {
  statusCode: number;
  body: unknown;
  status(code: number): this;
  json(data: unknown): this;
}

function makeRes(): FakeRes {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      if (this.statusCode === 0) this.statusCode = 200;
      this.body = data;
      return this;
    },
  };
  return res as FakeRes;
}

const userJson = {
  id: 'u-1',
  name: 'João',
  email: 'joao@email.com',
  password: 'hash',
  companyId: 'c-1',
  role: 'admin',
};

describe('UserController.getMe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 sem usuário autenticado no token', async () => {
    const res = makeRes();
    await userController.getMe(makeReq(), res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Usuário não autenticado' });
  });

  it('retorna 200 com o usuário sem a senha', async () => {
    getByIdMock.mockResolvedValue({ toJSON: () => userJson });
    const res = makeRes();
    await userController.getMe(makeReq({ user: { id: 'u-1' } }), res);
    expect(getByIdMock).toHaveBeenCalledWith('u-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 'u-1',
      name: 'João',
      email: 'joao@email.com',
      companyId: 'c-1',
      role: 'admin',
    });
    expect((res.body as { password?: string }).password).toBeUndefined();
  });

  it('retorna 404 quando o serviço lança Error', async () => {
    getByIdMock.mockRejectedValue(new Error('Usuário não encontrado'));
    const res = makeRes();
    await userController.getMe(makeReq({ user: { id: 'u-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    getByIdMock.mockRejectedValue('boom');
    const res = makeRes();
    await userController.getMe(makeReq({ user: { id: 'u-1' } }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('UserController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await userController.list(makeReq(), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Empresa não encontrada' });
  });

  it('retorna 200 com os usuários da empresa', async () => {
    listByCompanyMock.mockResolvedValue([{ ...userJson, password: undefined }]);
    const res = makeRes();
    await userController.list(makeReq({ companyId: 'c-1' }), res);
    expect(listByCompanyMock).toHaveBeenCalledWith('c-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { id: 'u-1', name: 'João', email: 'joao@email.com', companyId: 'c-1', role: 'admin' },
    ]);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    listByCompanyMock.mockRejectedValue(new Error('Falha'));
    const res = makeRes();
    await userController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    listByCompanyMock.mockRejectedValue('boom');
    const res = makeRes();
    await userController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('UserController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await userController.create(makeReq(), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await userController.create(
      makeReq({ companyId: 'c-1', body: { name: '', email: 'x', password: '123' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 201 e cria o usuário na empresa', async () => {
    createMock.mockResolvedValue({ ...userJson, password: undefined });
    const res = makeRes();
    await userController.create(
      makeReq({
        companyId: 'c-1',
        body: {
          name: 'João',
          email: 'joao@email.com',
          password: '12345678',
          role: 'viewer',
        },
      }),
      res,
    );
    expect(createMock).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      password: '12345678',
      role: 'viewer',
      companyId: 'c-1',
    });
    expect(res.statusCode).toBe(201);
    expect((res.body as { password?: string }).password).toBeUndefined();
  });

  it('retorna 400 quando o e-mail já está em uso', async () => {
    createMock.mockRejectedValue(new Error('E-mail já está em uso'));
    const res = makeRes();
    await userController.create(
      makeReq({
        companyId: 'c-1',
        body: {
          name: 'João',
          email: 'joao@email.com',
          password: '12345678',
          role: 'viewer',
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'E-mail já está em uso' });
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    createMock.mockRejectedValue('boom');
    const res = makeRes();
    await userController.create(
      makeReq({
        companyId: 'c-1',
        body: { name: 'João', email: 'joao@email.com', password: '12345678' },
      }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe('UserController.updateRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 sem companyId ou usuário do token', async () => {
    const res = makeRes();
    await userController.updateRole(makeReq({ params: { id: 'u-1' } }), res);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 404 quando o id não é uma string', async () => {
    const res = makeRes();
    await userController.updateRole(makeReq({ companyId: 'c-1', user: { id: 'u-2' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await userController.updateRole(
      makeReq({
        params: { id: 'u-1' },
        companyId: 'c-1',
        user: { id: 'u-2' },
        body: { role: 'nope' },
      }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 e altera o papel', async () => {
    updateRoleMock.mockResolvedValue({ ...userJson, role: 'manager', password: undefined });
    const res = makeRes();
    await userController.updateRole(
      makeReq({
        params: { id: 'u-1' },
        companyId: 'c-1',
        user: { id: 'u-2' },
        body: { role: 'manager' },
      }),
      res,
    );
    expect(updateRoleMock).toHaveBeenCalledWith('u-1', 'c-1', 'manager', 'u-2');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 'u-1',
      name: 'João',
      email: 'joao@email.com',
      companyId: 'c-1',
      role: 'manager',
    });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    updateRoleMock.mockRejectedValue(new Error('Você não pode alterar o próprio papel'));
    const res = makeRes();
    await userController.updateRole(
      makeReq({
        params: { id: 'u-1' },
        companyId: 'c-1',
        user: { id: 'u-1' },
        body: { role: 'admin' },
      }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });
});

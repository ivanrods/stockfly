import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

const { getByIdMock } = vi.hoisted(() => ({
  getByIdMock: vi.fn(),
}));

vi.mock('../services/user-service.js', () => ({
  default: { getById: getByIdMock },
}));

import userController from './user-controller.js';

interface FakeReq extends Request {
  user?: string | JwtPayload;
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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(() => ({ id: 'user-id' })),
}));

vi.mock('jsonwebtoken', () => ({ default: { verify: verifyMock } }));

import { authMiddleware } from './auth-middleware.js';

function makeReq(headers: { authorization?: string } = {}) {
  return { headers } as Request;
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
      this.body = data;
      return this;
    },
  };
  return res as FakeRes;
}

function makeNext() {
  return vi.fn() as NextFunction;
}

describe('authMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 se não há header Authorization', () => {
    const res = makeRes();
    const next = makeNext();

    authMiddleware(makeReq(), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se o header não usa Bearer', () => {
    const res = makeRes();
    const next = makeNext();

    authMiddleware(makeReq({ authorization: 'Basic abc' }), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se o token é inválido ou expirado', () => {
    verifyMock.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const res = makeRes();
    const next = makeNext();

    const req = makeReq({ authorization: 'Bearer token-invalido' });
    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: 'Token inválido ou expirado',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next() e injeta o usuário quando o token é válido', () => {
    verifyMock.mockReturnValue({ id: 'user-id' });

    const res = makeRes();
    const next = makeNext();

    const req = makeReq({ authorization: 'Bearer token-valido' });
    authMiddleware(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith('token-valido', process.env.JWT_SECRET);
    expect(req.user).toEqual({ id: 'user-id' });
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });
});
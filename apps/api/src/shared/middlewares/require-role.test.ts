import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../database/models/user-model.js';

import { requireRole } from './require-role.js';

interface FakeReq extends Request {
  role?: UserRole;
}

function makeReq(role?: UserRole): FakeReq {
  return { role } as FakeReq;
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

describe('requireRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama next() quando o papel está na lista permitida', () => {
    const req = makeReq('admin');
    const res = makeRes();
    const next = makeNext();

    const middleware = requireRole('admin', 'manager');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });

  it('retorna 403 quando não há papel no req', () => {
    const res = makeRes();
    const next = makeNext();

    const middleware = requireRole('admin');
    middleware(makeReq(), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o papel não está na lista permitida', () => {
    const res = makeRes();
    const next = makeNext();

    const middleware = requireRole('admin');
    middleware(makeReq('viewer'), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });
});

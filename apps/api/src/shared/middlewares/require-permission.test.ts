import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../database/models/user-model.js';

const { findOneMock } = vi.hoisted(() => ({
  findOneMock: vi.fn(),
}));

vi.mock('../database/models/role-model.js', () => ({
  Role: { findOne: findOneMock },
}));

vi.mock('../database/models/permission-model.js', () => ({
  Permission: {},
}));

import { requirePermission } from './require-permission.js';

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

describe('requirePermission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 quando não há papel no req', async () => {
    const res = makeRes();
    const next = makeNext();

    const middleware = requirePermission('products:read');
    await middleware(makeReq(), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o papel não possui a permissão', async () => {
    findOneMock.mockResolvedValue({
      name: 'viewer',
      permissions: [{ name: 'products:read' }],
    });

    const res = makeRes();
    const next = makeNext();

    const middleware = requirePermission('stock:create');
    await middleware(makeReq('viewer'), res, next);

    expect(findOneMock).toHaveBeenCalledWith({
      where: { name: 'viewer' },
      include: [{ model: {}, as: 'permissions' }],
    });
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Permissão insuficiente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o papel não existe', async () => {
    findOneMock.mockResolvedValue(null);

    const res = makeRes();
    const next = makeNext();

    const middleware = requirePermission('products:read');
    await middleware(makeReq('viewer'), res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next() quando o papel possui a permissão', async () => {
    findOneMock.mockResolvedValue({
      name: 'admin',
      permissions: [{ name: 'products:read' }, { name: 'stock:create' }],
    });

    const res = makeRes();
    const next = makeNext();

    const middleware = requirePermission('stock:create');
    await middleware(makeReq('admin'), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });

  it('retorna 500 quando a consulta ao banco falha', async () => {
    findOneMock.mockRejectedValue(new Error('db down'));

    const res = makeRes();
    const next = makeNext();

    const middleware = requirePermission('products:read');
    await middleware(makeReq('admin'), res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno do servidor' });
    expect(next).not.toHaveBeenCalled();
  });
});

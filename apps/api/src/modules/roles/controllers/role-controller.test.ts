import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const { listMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
}));

vi.mock('../services/role-service.js', () => ({
  default: { list: listMock },
}));

import roleController from './role-controller.js';

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

const roles = [{ id: 'r-1', name: 'admin', description: 'Acesso total' }];

describe('RoleController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 com a lista de papéis', async () => {
    listMock.mockResolvedValue(roles);
    const res = makeRes();
    await roleController.list({} as Request, res);
    expect(listMock).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(roles);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    listMock.mockRejectedValue(new Error('Falha'));
    const res = makeRes();
    await roleController.list({} as Request, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Falha' });
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    listMock.mockRejectedValue('boom');
    const res = makeRes();
    await roleController.list({} as Request, res);
    expect(res.statusCode).toBe(500);
  });
});

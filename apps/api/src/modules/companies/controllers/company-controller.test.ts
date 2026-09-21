import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { UserRole } from '../../../shared/database/models/user-model.js';

const { getByIdMock, updateMock, inactivateMock } = vi.hoisted(() => ({
  getByIdMock: vi.fn(),
  updateMock: vi.fn(),
  inactivateMock: vi.fn(),
}));

vi.mock('../services/company-service.js', () => ({
  default: {
    getById: getByIdMock,
    create: vi.fn(),
    update: updateMock,
    inactivate: inactivateMock,
  },
}));

import companyController from './company-controller.js';

const company = { id: 'c-1', name: 'Empresa', status: 'active' };

interface FakeReq extends Request {
  companyId?: string;
  role?: UserRole;
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

describe('CompanyController.getMine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await companyController.getMine(makeReq(), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Empresa não encontrada' });
  });

  it('retorna 200 com a empresa do usuário', async () => {
    getByIdMock.mockResolvedValue(company);
    const res = makeRes();
    await companyController.getMine(makeReq({ companyId: 'c-1' }), res);
    expect(getByIdMock).toHaveBeenCalledWith('c-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(company);
  });

  it('retorna 404 quando o serviço lança Error', async () => {
    getByIdMock.mockRejectedValue(new Error('Empresa não encontrada'));
    const res = makeRes();
    await companyController.getMine(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    getByIdMock.mockRejectedValue('boom');
    const res = makeRes();
    await companyController.getMine(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('CompanyController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 quando id difere do companyId', async () => {
    const res = makeRes();
    await companyController.update(
      makeReq({ params: { id: 'outro' }, companyId: 'c-1', role: 'admin' }),
      res,
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado' });
  });

  it('retorna 403 quando não há companyId', async () => {
    const res = makeRes();
    await companyController.update(makeReq({ params: { id: 'c-1' }, role: 'admin' }), res);
    expect(res.statusCode).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await companyController.update(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin', body: { name: '' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 e atualiza a empresa', async () => {
    updateMock.mockResolvedValue({ ...company, phone: '123' });
    const res = makeRes();
    await companyController.update(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin', body: { phone: '123' } }),
      res,
    );
    expect(updateMock).toHaveBeenCalledWith('c-1', { phone: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...company, phone: '123' });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    updateMock.mockRejectedValue(new Error('Empresa não encontrada'));
    const res = makeRes();
    await companyController.update(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin', body: { phone: '123' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    updateMock.mockRejectedValue('boom');
    const res = makeRes();
    await companyController.update(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin', body: { phone: '123' } }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe('CompanyController.inactivate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 quando id difere do companyId', async () => {
    const res = makeRes();
    await companyController.inactivate(
      makeReq({ params: { id: 'outro' }, companyId: 'c-1', role: 'admin' }),
      res,
    );
    expect(res.statusCode).toBe(403);
  });

  it('retorna 200 e inativa a empresa', async () => {
    inactivateMock.mockResolvedValue({ ...company, status: 'inactive' });
    const res = makeRes();
    await companyController.inactivate(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin' }),
      res,
    );
    expect(inactivateMock).toHaveBeenCalledWith('c-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...company, status: 'inactive' });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    inactivateMock.mockRejectedValue(new Error('Empresa não encontrada'));
    const res = makeRes();
    await companyController.inactivate(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin' }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    inactivateMock.mockRejectedValue('boom');
    const res = makeRes();
    await companyController.inactivate(
      makeReq({ params: { id: 'c-1' }, companyId: 'c-1', role: 'admin' }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

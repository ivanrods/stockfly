import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { UserRole } from '../../../shared/database/models/user-model.js';

const { listMock, createMock, updateMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../services/supplier-service.js', () => ({
  default: {
    list: listMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  },
}));

import supplierController from './supplier-controller.js';

const supplier = { id: 'sup-1', companyId: 'c-1', name: 'Tech Distribuidora', email: null };

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

describe('SupplierController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await supplierController.list(makeReq(), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Empresa não encontrada' });
  });

  it('retorna 200 com os fornecedores da empresa', async () => {
    listMock.mockResolvedValue([supplier]);
    const res = makeRes();
    await supplierController.list(makeReq({ companyId: 'c-1' }), res);
    expect(listMock).toHaveBeenCalledWith('c-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([supplier]);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    listMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await supplierController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    listMock.mockRejectedValue('boom');
    const res = makeRes();
    await supplierController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('SupplierController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await supplierController.create(makeReq(), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await supplierController.create(makeReq({ companyId: 'c-1', body: { name: '' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 com e-mail inválido', async () => {
    const res = makeRes();
    await supplierController.create(
      makeReq({ companyId: 'c-1', body: { name: 'Tech', email: 'invalido' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 201 e cria o fornecedor', async () => {
    createMock.mockResolvedValue(supplier);
    const res = makeRes();
    await supplierController.create(
      makeReq({ companyId: 'c-1', body: { name: 'Tech Distribuidora', email: '' } }),
      res,
    );
    expect(createMock).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({ name: 'Tech Distribuidora', email: null }),
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(supplier);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    createMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await supplierController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    createMock.mockRejectedValue('boom');
    const res = makeRes();
    await supplierController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('SupplierController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await supplierController.update(makeReq({ params: { id: 'sup-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 com id inválido', async () => {
    const res = makeRes();
    await supplierController.update(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Fornecedor não encontrado' });
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await supplierController.update(
      makeReq({ params: { id: 'sup-1' }, companyId: 'c-1', body: { name: '' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 e atualiza o fornecedor', async () => {
    updateMock.mockResolvedValue({ ...supplier, phone: '123' });
    const res = makeRes();
    await supplierController.update(
      makeReq({ params: { id: 'sup-1' }, companyId: 'c-1', body: { phone: '123' } }),
      res,
    );
    expect(updateMock).toHaveBeenCalledWith('c-1', 'sup-1', { phone: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...supplier, phone: '123' });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    updateMock.mockRejectedValue(new Error('Fornecedor não encontrado'));
    const res = makeRes();
    await supplierController.update(
      makeReq({ params: { id: 'sup-1' }, companyId: 'c-1', body: { phone: '123' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    updateMock.mockRejectedValue('boom');
    const res = makeRes();
    await supplierController.update(
      makeReq({ params: { id: 'sup-1' }, companyId: 'c-1', body: { phone: '123' } }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe('SupplierController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await supplierController.remove(makeReq({ params: { id: 'sup-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 com id inválido', async () => {
    const res = makeRes();
    await supplierController.remove(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 200 e remove o fornecedor', async () => {
    removeMock.mockResolvedValue(supplier);
    const res = makeRes();
    await supplierController.remove(makeReq({ params: { id: 'sup-1' }, companyId: 'c-1' }), res);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'sup-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(supplier);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    removeMock.mockRejectedValue(new Error('Fornecedor não encontrado'));
    const res = makeRes();
    await supplierController.remove(makeReq({ params: { id: 'sup-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    removeMock.mockRejectedValue('boom');
    const res = makeRes();
    await supplierController.remove(makeReq({ params: { id: 'sup-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

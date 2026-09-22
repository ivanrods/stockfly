import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { UserRole } from '../../../shared/database/models/user-model.js';

const { listMock, getByIdMock, createMock, updateMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  getByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../services/product-service.js', () => ({
  default: {
    list: listMock,
    getById: getByIdMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  },
}));

import productController from './product-controller.js';

const product = { id: 'p-1', companyId: 'c-1', name: 'Notebook' };
const page = { data: [product], total: 1, page: 1, limit: 20, totalPages: 1 };

interface FakeReq extends Request {
  companyId?: string;
  role?: UserRole;
}

function makeReq(overrides: Partial<FakeReq> = {}): FakeReq {
  return { body: {}, params: {}, query: {}, ...overrides } as FakeReq;
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

describe('ProductController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await productController.list(makeReq(), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Empresa não encontrada' });
  });

  it('retorna 400 com query inválida', async () => {
    const res = makeRes();
    await productController.list(
      makeReq({ companyId: 'c-1', query: { page: 'abc', limit: '20' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 com a lista paginada', async () => {
    listMock.mockResolvedValue(page);
    const res = makeRes();
    await productController.list(
      makeReq({ companyId: 'c-1', query: { page: '1', limit: '20' } }),
      res,
    );
    expect(listMock).toHaveBeenCalledWith('c-1', expect.objectContaining({ page: 1, limit: 20 }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(page);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    listMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await productController.list(makeReq({ companyId: 'c-1', query: {} }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    listMock.mockRejectedValue('boom');
    const res = makeRes();
    await productController.list(makeReq({ companyId: 'c-1', query: {} }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('ProductController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await productController.create(makeReq(), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await productController.create(makeReq({ companyId: 'c-1', body: { name: '' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 201 e cria o produto', async () => {
    createMock.mockResolvedValue(product);
    const res = makeRes();
    await productController.create(
      makeReq({ companyId: 'c-1', body: { name: 'Notebook', quantity: 0 } }),
      res,
    );
    expect(createMock).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({ name: 'Notebook', quantity: 0 }),
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(product);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    createMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await productController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    createMock.mockRejectedValue('boom');
    const res = makeRes();
    await productController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('ProductController.getById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await productController.getById(makeReq({ params: { id: 'p-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 com id inválido', async () => {
    const res = makeRes();
    await productController.getById(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Produto não encontrado' });
  });

  it('retorna 200 com o produto', async () => {
    getByIdMock.mockResolvedValue(product);
    const res = makeRes();
    await productController.getById(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(getByIdMock).toHaveBeenCalledWith('c-1', 'p-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(product);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    getByIdMock.mockRejectedValue(new Error('Produto não encontrado'));
    const res = makeRes();
    await productController.getById(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    getByIdMock.mockRejectedValue('boom');
    const res = makeRes();
    await productController.getById(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('ProductController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await productController.update(makeReq({ params: { id: 'p-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 com id inválido', async () => {
    const res = makeRes();
    await productController.update(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await productController.update(
      makeReq({ params: { id: 'p-1' }, companyId: 'c-1', body: { name: '' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 e atualiza o produto', async () => {
    updateMock.mockResolvedValue({ ...product, name: 'Ultrabook' });
    const res = makeRes();
    await productController.update(
      makeReq({ params: { id: 'p-1' }, companyId: 'c-1', body: { name: 'Ultrabook' } }),
      res,
    );
    expect(updateMock).toHaveBeenCalledWith('c-1', 'p-1', { name: 'Ultrabook' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...product, name: 'Ultrabook' });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    updateMock.mockRejectedValue(new Error('Produto não encontrado'));
    const res = makeRes();
    await productController.update(
      makeReq({ params: { id: 'p-1' }, companyId: 'c-1', body: { name: 'X' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    updateMock.mockRejectedValue('boom');
    const res = makeRes();
    await productController.update(
      makeReq({ params: { id: 'p-1' }, companyId: 'c-1', body: { name: 'X' } }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe('ProductController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await productController.remove(makeReq({ params: { id: 'p-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 com id inválido', async () => {
    const res = makeRes();
    await productController.remove(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 200 e remove o produto', async () => {
    removeMock.mockResolvedValue(product);
    const res = makeRes();
    await productController.remove(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'p-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(product);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    removeMock.mockRejectedValue(new Error('Produto não encontrado'));
    const res = makeRes();
    await productController.remove(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    removeMock.mockRejectedValue('boom');
    const res = makeRes();
    await productController.remove(makeReq({ params: { id: 'p-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});
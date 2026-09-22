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

vi.mock('../services/category-service.js', () => ({
  default: {
    list: listMock,
    getById: getByIdMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  },
}));

import categoryController from './category-controller.js';

const category = { id: 'cat-1', companyId: 'c-1', name: 'Informática', description: null };

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

describe('CategoryController.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await categoryController.list(makeReq(), res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Empresa não encontrada' });
  });

  it('retorna 200 com as categorias da empresa', async () => {
    listMock.mockResolvedValue([category]);
    const res = makeRes();
    await categoryController.list(makeReq({ companyId: 'c-1' }), res);
    expect(listMock).toHaveBeenCalledWith('c-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([category]);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    listMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await categoryController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    listMock.mockRejectedValue('boom');
    const res = makeRes();
    await categoryController.list(makeReq({ companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('CategoryController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await categoryController.create(makeReq(), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await categoryController.create(makeReq({ companyId: 'c-1', body: { name: '' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 201 e cria a categoria', async () => {
    createMock.mockResolvedValue(category);
    const res = makeRes();
    await categoryController.create(
      makeReq({ companyId: 'c-1', body: { name: 'Informática', description: '' } }),
      res,
    );
    expect(createMock).toHaveBeenCalledWith('c-1', { name: 'Informática', description: null });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(category);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    createMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await categoryController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    createMock.mockRejectedValue('boom');
    const res = makeRes();
    await categoryController.create(makeReq({ companyId: 'c-1', body: { name: 'X' } }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('CategoryController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await categoryController.update(makeReq({ params: { id: 'cat-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 400 com body inválido', async () => {
    const res = makeRes();
    await categoryController.update(
      makeReq({ params: { id: 'cat-1' }, companyId: 'c-1', body: { name: '' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 e atualiza a categoria', async () => {
    updateMock.mockResolvedValue({ ...category, name: 'Gamer' });
    const res = makeRes();
    await categoryController.update(
      makeReq({ params: { id: 'cat-1' }, companyId: 'c-1', body: { name: 'Gamer' } }),
      res,
    );
    expect(updateMock).toHaveBeenCalledWith('c-1', 'cat-1', { name: 'Gamer' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...category, name: 'Gamer' });
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    updateMock.mockRejectedValue(new Error('Categoria não encontrada'));
    const res = makeRes();
    await categoryController.update(
      makeReq({ params: { id: 'cat-1' }, companyId: 'c-1', body: { name: 'Gamer' } }),
      res,
    );
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    updateMock.mockRejectedValue('boom');
    const res = makeRes();
    await categoryController.update(
      makeReq({ params: { id: 'cat-1' }, companyId: 'c-1', body: { name: 'Gamer' } }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe('CategoryController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 sem companyId', async () => {
    const res = makeRes();
    await categoryController.remove(makeReq({ params: { id: 'cat-1' } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 200 e remove a categoria', async () => {
    removeMock.mockResolvedValue(category);
    const res = makeRes();
    await categoryController.remove(makeReq({ params: { id: 'cat-1' }, companyId: 'c-1' }), res);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'cat-1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(category);
  });

  it('retorna 400 quando o serviço lança Error', async () => {
    removeMock.mockRejectedValue(new Error('Categoria não encontrada'));
    const res = makeRes();
    await categoryController.remove(makeReq({ params: { id: 'cat-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 500 quando o serviço lança algo que não é Error', async () => {
    removeMock.mockRejectedValue('boom');
    const res = makeRes();
    await categoryController.remove(makeReq({ params: { id: 'cat-1' }, companyId: 'c-1' }), res);
    expect(res.statusCode).toBe(500);
  });
});

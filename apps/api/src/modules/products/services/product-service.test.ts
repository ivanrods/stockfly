import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock, getByIdMock, createMock, updateMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  getByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../repository/product-repository.js', () => ({
  default: {
    findAll: listMock,
    findById: getByIdMock,
    create: createMock,
    update: updateMock,
    softDelete: removeMock,
  },
}));

import productService from './product-service.js';
import type { CreateProductDTO, ProductQueryDTO } from '../dto/product-dto.js';

const product = { id: 'p-1', companyId: 'c-1', name: 'Notebook' };
const createData = { name: 'Notebook', quantity: 0, minStock: 0, status: 'active' } as CreateProductDTO;
const query: ProductQueryDTO = { page: 1, limit: 20, lowStock: undefined };

describe('ProductService.list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('monta resposta paginada', async () => {
    listMock.mockResolvedValue({ rows: [product], count: 5 });
    const result = await productService.list('c-1', { ...query, page: 2, limit: 2 });
    expect(listMock).toHaveBeenCalledWith({ companyId: 'c-1', ...query, page: 2, limit: 2 });
    expect(result).toEqual({
      data: [product],
      total: 5,
      page: 2,
      limit: 2,
      totalPages: Math.ceil(5 / 2),
    });
  });

  it('retorna totalPages 0 quando não há registros', async () => {
    listMock.mockResolvedValue({ rows: [], count: 0 });
    const result = await productService.list('c-1', query);
    expect(result.totalPages).toBe(0);
  });
});

describe('ProductService.getById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna o produto quando existe', async () => {
    getByIdMock.mockResolvedValue(product);
    await expect(productService.getById('c-1', 'p-1')).resolves.toEqual(product);
    expect(getByIdMock).toHaveBeenCalledWith('c-1', 'p-1');
  });

  it('lança erro quando não existe', async () => {
    getByIdMock.mockResolvedValue(null);
    await expect(productService.getById('c-1', 'x')).rejects.toThrow('Produto não encontrado');
  });
});

describe('ProductService.create', () => {
  it('delega ao repository', async () => {
    createMock.mockResolvedValue(product);
    await expect(productService.create('c-1', createData)).resolves.toEqual(product);
    expect(createMock).toHaveBeenCalledWith('c-1', createData);
  });
});

describe('ProductService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna o produto atualizado', async () => {
    updateMock.mockResolvedValue({ ...product, name: 'Ultrabook' });
    const result = await productService.update('c-1', 'p-1', { name: 'Ultrabook' });
    expect(result.name).toBe('Ultrabook');
    expect(updateMock).toHaveBeenCalledWith('c-1', 'p-1', { name: 'Ultrabook' });
  });

  it('lança erro quando não existe', async () => {
    updateMock.mockResolvedValue(null);
    await expect(productService.update('c-1', 'x', {})).rejects.toThrow('Produto não encontrado');
  });
});

describe('ProductService.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delega ao repository', async () => {
    removeMock.mockResolvedValue(product);
    await expect(productService.remove('c-1', 'p-1')).resolves.toEqual(product);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'p-1');
  });

  it('lança erro quando não existe', async () => {
    removeMock.mockResolvedValue(null);
    await expect(productService.remove('c-1', 'x')).rejects.toThrow('Produto não encontrado');
  });
});
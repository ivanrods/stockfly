import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Op } from 'sequelize';

const { findAndCountAllMock, findOneMock, createMock } = vi.hoisted(() => ({
  findAndCountAllMock: vi.fn(),
  findOneMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/product-model.js', () => ({
  Product: { findAndCountAll: findAndCountAllMock, findOne: findOneMock, create: createMock },
}));

vi.mock('../../../shared/config/database.js', () => ({
  sequelize: { literal: (value: string) => ({ literal: value }) },
}));

vi.mock('../../../shared/database/models/category-model.js', () => ({
  Category: {},
}));

vi.mock('../../../shared/database/models/supplier-model.js', () => ({
  Supplier: {},
}));

import productRepository from './product-repository.js';
import type { CreateProductDTO, ProductQueryDTO } from '../dto/product-dto.js';

const product = {
  id: 'p-1',
  companyId: 'c-1',
  name: 'Notebook',
  sku: 'NB-001',
  quantity: 2,
  minStock: 5,
};

const baseQuery: ProductQueryDTO & { companyId: string } = {
  companyId: 'c-1',
  page: 1,
  limit: 20,
  lowStock: undefined,
};

const createData = {
  name: 'Notebook',
  quantity: 0,
  minStock: 0,
  status: 'active',
} as CreateProductDTO;

describe('ProductRepository.findAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama findAndCountAll com paginação e includes', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [product], count: 1 });
    const result = await productRepository.findAll(baseQuery);
    expect(findAndCountAllMock).toHaveBeenCalledWith({
      where: { companyId: 'c-1' },
      offset: 0,
      limit: 20,
      order: [['name', 'ASC']],
      include: [
        { model: {}, as: 'category', attributes: ['id', 'name'] },
        { model: {}, as: 'supplier', attributes: ['id', 'name'] },
      ],
      distinct: true,
    });
    expect(result).toEqual({ rows: [product], count: 1 });
  });

  it('aplica filtro de busca por nome/sku/barcode (q)', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });
    await productRepository.findAll({ ...baseQuery, q: 'note' });
    const { where } = findAndCountAllMock.mock.calls[0]![0];
    expect(where).toEqual({
      companyId: 'c-1',
      [Op.or]: [
        { name: { [Op.iLike]: '%note%' } },
        { sku: { [Op.iLike]: '%note%' } },
        { barcode: { [Op.iLike]: '%note%' } },
      ],
    });
  });

  it('aplica filtros de categoria, fornecedor e status', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });
    await productRepository.findAll({
      ...baseQuery,
      categoryId: 'cat-1',
      supplierId: 'sup-1',
      status: 'active',
    });
    const { where } = findAndCountAllMock.mock.calls[0]![0];
    expect(where).toEqual({
      companyId: 'c-1',
      categoryId: 'cat-1',
      supplierId: 'sup-1',
      status: 'active',
    });
  });

  it('aplica literal de estoque baixo quando lowStock é true', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });
    await productRepository.findAll({ ...baseQuery, lowStock: true });
    const { where } = findAndCountAllMock.mock.calls[0]![0];
    expect(where).toEqual({
      companyId: 'c-1',
      [Op.and]: { literal: '"Product"."quantity" <= "Product"."min_stock"' },
    });
  });

  it('calcula offset pela página', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });
    await productRepository.findAll({ ...baseQuery, page: 3, limit: 10 });
    const { offset } = findAndCountAllMock.mock.calls[0]![0];
    expect(offset).toBe(20);
  });
});

describe('ProductRepository.findById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra por companyId e id scroll com includes', async () => {
    findOneMock.mockResolvedValue(product);
    const result = await productRepository.findById('c-1', 'p-1');
    expect(findOneMock).toHaveBeenCalledWith({
      where: { companyId: 'c-1', id: 'p-1' },
      include: [
        { model: {}, as: 'category', attributes: ['id', 'name'] },
        { model: {}, as: 'supplier', attributes: ['id', 'name'] },
      ],
    });
    expect(result).toEqual(product);
  });
});

describe('ProductRepository.create', () => {
  it('injeta companyId nos dados', async () => {
    createMock.mockResolvedValue(product);
    await productRepository.create('c-1', createData);
    expect(createMock).toHaveBeenCalledWith({ ...createData, companyId: 'c-1' });
  });
});

describe('ProductRepository.update/softDelete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('update atualiza o produto quando encontrado', async () => {
    const fake = {
      ...product,
      update: vi.fn().mockResolvedValue({ ...product, name: 'Ultrabook' }),
    };
    findOneMock.mockResolvedValue(fake);
    const result = await productRepository.update('c-1', 'p-1', { name: 'Ultrabook' });
    expect(fake.update).toHaveBeenCalledWith({ name: 'Ultrabook' });
    expect(result).toEqual({ ...product, name: 'Ultrabook' });
  });

  it('update retorna null quando o produto não existe', async () => {
    findOneMock.mockResolvedValue(null);
    expect(await productRepository.update('c-1', 'x', {})).toBeNull();
  });

  it('softDelete destroi o produto quando encontrado', async () => {
    const destroyMock = vi.fn().mockResolvedValue(undefined);
    const fake = { ...product, destroy: destroyMock };
    findOneMock.mockResolvedValue(fake);
    const result = await productRepository.softDelete('c-1', 'p-1');
    expect(destroyMock).toHaveBeenCalled();
    expect(result).toEqual(fake);
  });

  it('softDelete retorna null quando o produto não existe', async () => {
    findOneMock.mockResolvedValue(null);
    expect(await productRepository.softDelete('c-1', 'x')).toBeNull();
  });
});

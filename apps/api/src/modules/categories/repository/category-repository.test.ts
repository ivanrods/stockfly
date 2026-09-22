import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findAllMock, findOneMock, createMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
  findOneMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/category-model.js', () => ({
  Category: { findAll: findAllMock, findOne: findOneMock, create: createMock },
}));

import categoryRepository from './category-repository.js';
import type { CreateCategoryDTO } from '../dto/category-dto.js';

const category = { id: 'cat-1', companyId: 'c-1', name: 'Informática', description: null };

describe('CategoryRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findAllByCompany filtra por companyId e ordena por nome', async () => {
    findAllMock.mockResolvedValue([category]);
    const result = await categoryRepository.findAllByCompany('c-1');
    expect(findAllMock).toHaveBeenCalledWith({
      where: { companyId: 'c-1' },
      order: [['name', 'ASC']],
    });
    expect(result).toEqual([category]);
  });

  it('findById filtra por companyId e id', async () => {
    findOneMock.mockResolvedValue(category);
    const result = await categoryRepository.findById('c-1', 'cat-1');
    expect(findOneMock).toHaveBeenCalledWith({ where: { companyId: 'c-1', id: 'cat-1' } });
    expect(result).toEqual(category);
  });

  it('create injeta companyId nos dados', async () => {
    createMock.mockResolvedValue(category);
    const data = { name: 'Informática', description: null } as CreateCategoryDTO;
    await categoryRepository.create('c-1', data);
    expect(createMock).toHaveBeenCalledWith({ ...data, companyId: 'c-1' });
  });

  it('update atualiza a categoria quando encontrada', async () => {
    const fake = { ...category, update: vi.fn().mockResolvedValue({ ...category, name: 'Gamer' }) };
    findOneMock.mockResolvedValue(fake);
    const result = await categoryRepository.update('c-1', 'cat-1', { name: 'Gamer' });
    expect(fake.update).toHaveBeenCalledWith({ name: 'Gamer' });
    expect(result).toEqual({ ...category, name: 'Gamer' });
  });

  it('update retorna null quando a categoria não existe', async () => {
    findOneMock.mockResolvedValue(null);
    const result = await categoryRepository.update('c-1', 'x', { name: 'Gamer' });
    expect(result).toBeNull();
  });

  it('softDelete destroi a categoria quando encontrada', async () => {
    const destroyMock = vi.fn().mockResolvedValue(undefined);
    const fake = { ...category, destroy: destroyMock };
    findOneMock.mockResolvedValue(fake);
    const result = await categoryRepository.softDelete('c-1', 'cat-1');
    expect(destroyMock).toHaveBeenCalled();
    expect(result).toEqual(fake);
  });

  it('softDelete retorna null quando a categoria não existe', async () => {
    findOneMock.mockResolvedValue(null);
    expect(await categoryRepository.softDelete('c-1', 'x')).toBeNull();
  });
});
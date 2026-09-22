import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock, getByIdMock, createMock, updateMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  getByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../repository/category-repository.js', () => ({
  default: {
    findAllByCompany: listMock,
    findById: getByIdMock,
    create: createMock,
    update: updateMock,
    softDelete: removeMock,
  },
}));

import categoryService from './category-service.js';
import type { CreateCategoryDTO } from '../dto/category-dto.js';

const category = { id: 'cat-1', companyId: 'c-1', name: 'Informática', description: null };
const createData = { name: 'Informática', description: null } as CreateCategoryDTO;

describe('CategoryService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list delega ao repository', async () => {
    listMock.mockResolvedValue([category]);
    await expect(categoryService.list('c-1')).resolves.toEqual([category]);
    expect(listMock).toHaveBeenCalledWith('c-1');
  });

  it('getById retorna a categoria quando existe', async () => {
    getByIdMock.mockResolvedValue(category);
    await expect(categoryService.getById('c-1', 'cat-1')).resolves.toEqual(category);
    expect(getByIdMock).toHaveBeenCalledWith('c-1', 'cat-1');
  });

  it('getById lança erro quando não existe', async () => {
    getByIdMock.mockResolvedValue(null);
    await expect(categoryService.getById('c-1', 'x')).rejects.toThrow('Categoria não encontrada');
  });

  it('create delega ao repository', async () => {
    createMock.mockResolvedValue(category);
    await expect(categoryService.create('c-1', createData)).resolves.toEqual(category);
    expect(createMock).toHaveBeenCalledWith('c-1', createData);
  });

  it('update retorna a categoria atualizada', async () => {
    updateMock.mockResolvedValue({ ...category, name: 'Gamer' });
    const result = await categoryService.update('c-1', 'cat-1', { name: 'Gamer' });
    expect(result.name).toBe('Gamer');
    expect(updateMock).toHaveBeenCalledWith('c-1', 'cat-1', { name: 'Gamer' });
  });

  it('update lança erro quando não existe', async () => {
    updateMock.mockResolvedValue(null);
    await expect(categoryService.update('c-1', 'x', {})).rejects.toThrow('Categoria não encontrada');
  });

  it('remove delega ao repository', async () => {
    removeMock.mockResolvedValue(category);
    await expect(categoryService.remove('c-1', 'cat-1')).resolves.toEqual(category);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'cat-1');
  });

  it('remove lança erro quando não existe', async () => {
    removeMock.mockResolvedValue(null);
    await expect(categoryService.remove('c-1', 'x')).rejects.toThrow('Categoria não encontrada');
  });
});
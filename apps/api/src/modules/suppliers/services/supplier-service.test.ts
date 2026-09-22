import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock, getByIdMock, createMock, updateMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  getByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('../repository/supplier-repository.js', () => ({
  default: {
    findAllByCompany: listMock,
    findById: getByIdMock,
    create: createMock,
    update: updateMock,
    softDelete: removeMock,
  },
}));

import supplierService from './supplier-service.js';
import type { CreateSupplierDTO } from '../dto/supplier-dto.js';

const supplier = { id: 'sup-1', companyId: 'c-1', name: 'Tech Distribuidora', email: null };
const createData = { name: 'Tech Distribuidora', email: null } as CreateSupplierDTO;

describe('SupplierService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list delega ao repository', async () => {
    listMock.mockResolvedValue([supplier]);
    await expect(supplierService.list('c-1')).resolves.toEqual([supplier]);
    expect(listMock).toHaveBeenCalledWith('c-1');
  });

  it('getById retorna o fornecedor quando existe', async () => {
    getByIdMock.mockResolvedValue(supplier);
    await expect(supplierService.getById('c-1', 'sup-1')).resolves.toEqual(supplier);
    expect(getByIdMock).toHaveBeenCalledWith('c-1', 'sup-1');
  });

  it('getById lança erro quando não existe', async () => {
    getByIdMock.mockResolvedValue(null);
    await expect(supplierService.getById('c-1', 'x')).rejects.toThrow('Fornecedor não encontrado');
  });

  it('create delega ao repository', async () => {
    createMock.mockResolvedValue(supplier);
    await expect(supplierService.create('c-1', createData)).resolves.toEqual(supplier);
    expect(createMock).toHaveBeenCalledWith('c-1', createData);
  });

  it('update retorna o fornecedor atualizado', async () => {
    updateMock.mockResolvedValue({ ...supplier, phone: '123' });
    const result = await supplierService.update('c-1', 'sup-1', { phone: '123' });
    expect(result.phone).toBe('123');
    expect(updateMock).toHaveBeenCalledWith('c-1', 'sup-1', { phone: '123' });
  });

  it('update lança erro quando não existe', async () => {
    updateMock.mockResolvedValue(null);
    await expect(supplierService.update('c-1', 'x', {})).rejects.toThrow('Fornecedor não encontrado');
  });

  it('remove delega ao repository', async () => {
    removeMock.mockResolvedValue(supplier);
    await expect(supplierService.remove('c-1', 'sup-1')).resolves.toEqual(supplier);
    expect(removeMock).toHaveBeenCalledWith('c-1', 'sup-1');
  });

  it('remove lança erro quando não existe', async () => {
    removeMock.mockResolvedValue(null);
    await expect(supplierService.remove('c-1', 'x')).rejects.toThrow('Fornecedor não encontrado');
  });
});
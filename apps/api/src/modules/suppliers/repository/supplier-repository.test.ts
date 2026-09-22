import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findAllMock, findOneMock, createMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
  findOneMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/supplier-model.js', () => ({
  Supplier: { findAll: findAllMock, findOne: findOneMock, create: createMock },
}));

import supplierRepository from './supplier-repository.js';
import type { CreateSupplierDTO } from '../dto/supplier-dto.js';

const supplier = { id: 'sup-1', companyId: 'c-1', name: 'Tech Distribuidora', email: null };

describe('SupplierRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findAllByCompany filtra por companyId e ordena por nome', async () => {
    findAllMock.mockResolvedValue([supplier]);
    const result = await supplierRepository.findAllByCompany('c-1');
    expect(findAllMock).toHaveBeenCalledWith({
      where: { companyId: 'c-1' },
      order: [['name', 'ASC']],
    });
    expect(result).toEqual([supplier]);
  });

  it('findById filtra por companyId e id', async () => {
    findOneMock.mockResolvedValue(supplier);
    const result = await supplierRepository.findById('c-1', 'sup-1');
    expect(findOneMock).toHaveBeenCalledWith({ where: { companyId: 'c-1', id: 'sup-1' } });
    expect(result).toEqual(supplier);
  });

  it('create injeta companyId nos dados', async () => {
    createMock.mockResolvedValue(supplier);
    const data = { name: 'Tech Distribuidora', email: null } as CreateSupplierDTO;
    await supplierRepository.create('c-1', data);
    expect(createMock).toHaveBeenCalledWith({ ...data, companyId: 'c-1' });
  });

  it('update atualiza o fornecedor quando encontrado', async () => {
    const fake = { ...supplier, update: vi.fn().mockResolvedValue({ ...supplier, phone: '123' }) };
    findOneMock.mockResolvedValue(fake);
    const result = await supplierRepository.update('c-1', 'sup-1', { phone: '123' });
    expect(fake.update).toHaveBeenCalledWith({ phone: '123' });
    expect(result).toEqual({ ...supplier, phone: '123' });
  });

  it('update retorna null quando o fornecedor não existe', async () => {
    findOneMock.mockResolvedValue(null);
    const result = await supplierRepository.update('c-1', 'x', { phone: '123' });
    expect(result).toBeNull();
  });

  it('softDelete destroi o fornecedor quando encontrado', async () => {
    const destroyMock = vi.fn().mockResolvedValue(undefined);
    const fake = { ...supplier, destroy: destroyMock };
    findOneMock.mockResolvedValue(fake);
    const result = await supplierRepository.softDelete('c-1', 'sup-1');
    expect(destroyMock).toHaveBeenCalled();
    expect(result).toEqual(fake);
  });

  it('softDelete retorna null quando o fornecedor não existe', async () => {
    findOneMock.mockResolvedValue(null);
    expect(await supplierRepository.softDelete('c-1', 'x')).toBeNull();
  });
});

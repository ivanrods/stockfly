import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByIdMock, createMock, updateMock, inactivateMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  inactivateMock: vi.fn(),
}));

vi.mock('../repository/company-repository.js', () => ({
  default: {
    findById: findByIdMock,
    create: createMock,
    update: updateMock,
    inactivate: inactivateMock,
  },
}));

import companyService from './company-service.js';
import type { CreateCompanyDTO } from '../dto/company-dto.js';

const company = { id: 'c-1', name: 'Empresa', status: 'active' };
const createData = { name: 'Empresa', cnpj: null, phone: null, email: null, street: null, number: null, complement: null, neighborhood: null, city: null, state: null, zipCode: null } as CreateCompanyDTO;

describe('CompanyService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getById retorna a empresa quando existe', async () => {
    findByIdMock.mockResolvedValue(company);
    await expect(companyService.getById('c-1')).resolves.toEqual(company);
    expect(findByIdMock).toHaveBeenCalledWith('c-1');
  });

  it('getById lança erro quando não existe', async () => {
    findByIdMock.mockResolvedValue(null);
    await expect(companyService.getById('x')).rejects.toThrow('Empresa não encontrada');
  });

  it('create delega ao repository', async () => {
    createMock.mockResolvedValue(company);
    await expect(companyService.create(createData)).resolves.toEqual(company);
    expect(createMock).toHaveBeenCalledWith(createData);
  });

  it('update retorna a empresa atualizada', async () => {
    updateMock.mockResolvedValue({ ...company, phone: '123' });
    const result = await companyService.update('c-1', { phone: '123' });
    expect(result.phone).toBe('123');
    expect(updateMock).toHaveBeenCalledWith('c-1', { phone: '123' });
  });

  it('update lança erro quando a empresa não existe', async () => {
    updateMock.mockResolvedValue(null);
    await expect(companyService.update('x', {})).rejects.toThrow('Empresa não encontrada');
  });

  it('inactivate retorna a empresa inativa', async () => {
    inactivateMock.mockResolvedValue({ ...company, status: 'inactive' });
    const result = await companyService.inactivate('c-1');
    expect(result.status).toBe('inactive');
    expect(inactivateMock).toHaveBeenCalledWith('c-1');
  });

  it('inactivate lança erro quando a empresa não existe', async () => {
    inactivateMock.mockResolvedValue(null);
    await expect(companyService.inactivate('x')).rejects.toThrow('Empresa não encontrada');
  });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByPkMock, createMock } = vi.hoisted(() => ({
  findByPkMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('../../../shared/database/models/company-model.js', () => ({
  Company: { findByPk: findByPkMock, create: createMock },
}));

import companyRepository from './company-repository.js';
import type { CreateCompanyDTO } from '../dto/company-dto.js';

const company = { id: 'c-1', name: 'Empresa', status: 'active' };
const createData = { name: 'Empresa', cnpj: null, phone: null, email: null, street: null, number: null, complement: null, neighborhood: null, city: null, state: null, zipCode: null } as CreateCompanyDTO;

describe('CompanyRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findById chama Company.findByPk', async () => {
    findByPkMock.mockResolvedValue(company);
    await companyRepository.findById('c-1');
    expect(findByPkMock).toHaveBeenCalledWith('c-1');
  });

  it('create chama Company.create com os dados', async () => {
    createMock.mockResolvedValue(company);
    await companyRepository.create(createData);
    expect(createMock).toHaveBeenCalledWith(createData);
  });

  it('update atualiza a empresa quando encontrada', async () => {
    const fake = { ...company, update: vi.fn().mockResolvedValue({ ...company, phone: '123' }) };
    findByPkMock.mockResolvedValue(fake);
    const result = await companyRepository.update('c-1', { phone: '123' });
    expect(findByPkMock).toHaveBeenCalledWith('c-1');
    expect(fake.update).toHaveBeenCalledWith({ phone: '123' });
    expect(result).toEqual({ ...company, phone: '123' });
  });

  it('update retorna null quando a empresa não existe', async () => {
    findByPkMock.mockResolvedValue(null);
    const result = await companyRepository.update('x', {});
    expect(result).toBeNull();
  });

  it('inactivate define status inactive', async () => {
    const fake = { ...company, update: vi.fn().mockResolvedValue({ ...company, status: 'inactive' }) };
    findByPkMock.mockResolvedValue(fake);
    const result = await companyRepository.inactivate('c-1');
    expect(fake.update).toHaveBeenCalledWith({ status: 'inactive' });
    expect(result).toEqual({ ...company, status: 'inactive' });
  });

  it('inactivate retorna null quando não encontrada', async () => {
    findByPkMock.mockResolvedValue(null);
    expect(await companyRepository.inactivate('x')).toBeNull();
  });
});
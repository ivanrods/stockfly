import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { get: getMock, put: putMock },
  ApiError: class ApiError extends Error {},
}));

import { getMyCompany, updateCompany } from './company-service';
import type { Company } from '../types/company-types';

const company: Company = {
  id: 'c-1',
  name: 'Empresa LTDA',
  cnpj: '12345678000190',
  phone: null,
  email: null,
  status: 'active',
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('company-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama GET /companies/me e retorna a empresa', async () => {
    getMock.mockResolvedValue({ data: company });

    const result = await getMyCompany();

    expect(getMock).toHaveBeenCalledWith('/companies/me');
    expect(result).toEqual(company);
  });

  it('chama PUT /companies/:id e retorna a empresa atualizada', async () => {
    const updatedCompany: Company = {
      ...company,
      phone: '(11) 99999-9999',
      city: 'São Paulo',
      state: 'SP',
    };
    putMock.mockResolvedValue({ data: updatedCompany });

    const result = await updateCompany('c-1', {
      phone: '(11) 99999-9999',
      city: 'São Paulo',
      state: 'SP',
    });

    expect(putMock).toHaveBeenCalledWith('/companies/c-1', {
      phone: '(11) 99999-9999',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(result).toEqual(updatedCompany);
  });
});

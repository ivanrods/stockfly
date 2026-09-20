import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { get: getMock },
  ApiError: class ApiError extends Error {},
}));

import { getMyCompany } from './company-service';
import type { Company } from '../types/company-types';

describe('company-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama GET /companies/me e retorna a empresa', async () => {
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
    getMock.mockResolvedValue({ data: company });

    const result = await getMyCompany();

    expect(getMock).toHaveBeenCalledWith('/companies/me');
    expect(result).toEqual(company);
  });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { updateCompanyMock, setSessionMock } = vi.hoisted(() => ({
  updateCompanyMock: vi.fn(),
  setSessionMock: vi.fn(),
}));

vi.mock('../services/company-service', () => ({
  updateCompany: updateCompanyMock,
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'u-1', name: 'João', email: 'joao@email.com', companyId: 'c-1', role: 'admin' },
    setSession: setSessionMock,
  }),
}));

import { useUpdateCompany } from './use-update-company';
import { ApiError } from '@/shared/api/http-client';
import type { Company } from '../types/company-types';

const company: Company = {
  id: 'c-1',
  name: 'Empresa LTDA',
  cnpj: '12345678000190',
  phone: '(11) 99999-9999',
  email: null,
  status: 'active',
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: 'São Paulo',
  state: 'SP',
  zipCode: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('useUpdateCompany', () => {
  beforeEach(() => vi.clearAllMocks());

  it('atualiza a empresa e reflete no setSession', async () => {
    updateCompanyMock.mockResolvedValue(company);
    const { result } = renderHook(() => useUpdateCompany());

    await act(async () => {
      await result.current.update('c-1', {
        phone: '(11) 99999-9999',
        city: 'São Paulo',
        state: 'SP',
      });
    });

    expect(updateCompanyMock).toHaveBeenCalledWith('c-1', {
      phone: '(11) 99999-9999',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(setSessionMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-1' }), company);
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('captura erro da API e não atualiza a sessão', async () => {
    updateCompanyMock.mockRejectedValue(
      new ApiError('Apenas administradores podem alterar a empresa', 403),
    );
    const { result } = renderHook(() => useUpdateCompany());

    await act(async () => {
      await result.current.update('c-1', { name: 'Outra Empresa' });
    });

    expect(result.current.error).toBe('Apenas administradores podem alterar a empresa');
    expect(result.current.success).toBe(false);
    expect(setSessionMock).not.toHaveBeenCalled();
  });

  it('captura erro genérico', async () => {
    updateCompanyMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useUpdateCompany());

    await act(async () => {
      await result.current.update('c-1', { name: 'Outra Empresa' });
    });

    expect(result.current.error).toBe('Erro ao salvar os dados');
  });

  it('alterna isLoading durante a atualização', async () => {
    let resolveUpdate!: (value: Company) => void;
    updateCompanyMock.mockImplementation(
      () => new Promise<Company>((resolve) => (resolveUpdate = resolve)),
    );
    const { result } = renderHook(() => useUpdateCompany());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.update('c-1', { name: 'Empresa LTDA' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveUpdate(company);
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanySettingsPage from './company-settings-page';
import type { Company } from '../types/company-types';

const { state, updateMock } = vi.hoisted(() => ({
  state: {
    company: null as Company | null,
    isLoading: false,
    error: null as string | null,
    success: false,
  },
  updateMock: vi.fn(),
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({ company: state.company }),
}));

vi.mock('../hooks/use-update-company', () => ({
  useUpdateCompany: () => ({
    update: updateMock,
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
  }),
}));

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

describe('CompanySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.company = company;
    state.isLoading = false;
    state.error = null;
    state.success = false;
  });

  it('renderiza o formulário preenchido com os dados da empresa', () => {
    render(<CompanySettingsPage />);

    expect(screen.getByText('Configurações da Empresa')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Empresa LTDA');
    expect(screen.getByRole('textbox', { name: 'CNPJ' })).toHaveValue('12345678000190');
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
  });

  it('envia os dados editados ao salvar', async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue(undefined);
    render(<CompanySettingsPage />);

    const type = async (label: string, value: string) => {
      const field = screen.getByRole('textbox', { name: label }) as HTMLInputElement;
      await user.clear(field);
      await user.type(field, value);
    };

    await type('Nome', 'Nova Empresa LTDA');
    await type('CNPJ', '12345678000190');
    await type('Telefone', '(11) 99999-9999');
    await type('E-mail', 'contato@empresa.com');
    await type('Logradouro', 'Av. Paulista');
    await type('Número', '1000');
    await type('Complemento', 'Sala 1');
    await type('Bairro', 'Bela Vista');
    await type('Cidade', 'São Paulo');
    await type('UF', 'SP');
    await type('CEP', '01310-100');
    await user.click(screen.getByRole('button', { name: /Salvar/i }));

    expect(updateMock).toHaveBeenCalledWith('c-1', {
      name: 'Nova Empresa LTDA',
      cnpj: '12345678000190',
      phone: '(11) 99999-9999',
      email: 'contato@empresa.com',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 1',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    });
  }, 15000);

  it('exibe mensagem de erro vinda do hook', () => {
    state.error = 'Apenas administradores podem alterar a empresa';
    render(<CompanySettingsPage />);

    expect(screen.getByText('Apenas administradores podem alterar a empresa')).toBeInTheDocument();
  });

  it('exibe mensagem de sucesso vinda do hook', () => {
    state.success = true;
    render(<CompanySettingsPage />);

    expect(screen.getByText('Dados salvos com sucesso')).toBeInTheDocument();
  });

  it('desabilita o botão enquanto salva', () => {
    state.isLoading = true;
    render(<CompanySettingsPage />);

    expect(screen.getByRole('button', { name: /Salvando/i })).toBeDisabled();
  });

  it('mostra aviso quando não há empresa', () => {
    state.company = null;
    render(<CompanySettingsPage />);

    expect(screen.getByText('Empresa não encontrada')).toBeInTheDocument();
  });
});
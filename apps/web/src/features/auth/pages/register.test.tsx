import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegisterResponse } from '../types/register-types';

const mockState = vi.hoisted(() => ({
  registerMock: vi.fn(),
  navigateMock: vi.fn(),
  isLoading: false,
  error: null as string | null,
}));

vi.mock('../hooks/use-register', () => ({
  useRegister: () => ({
    register: mockState.registerMock,
    isLoading: mockState.isLoading,
    error: mockState.error,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockState.navigateMock,
}));

import Register from './register-page';

const response: RegisterResponse = {
  message: 'Usuário criado com sucesso',
  user: {
    id: 'user-1',
    name: 'João',
    email: 'joao@email.com',
    companyId: 'company-1',
    role: 'admin',
  },
  company: {
    id: 'company-1',
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
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isLoading = false;
    mockState.error = null;
  });

  it('renderiza os campos do formulário', () => {
    render(<Register />);

    expect(screen.getByRole('textbox', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome da empresa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Conta/i })).toBeInTheDocument();
  });

  it('submete o formulário chamando register() com os dados preenchidos', async () => {
    const user = userEvent.setup();
    mockState.registerMock.mockResolvedValue(response);
    render(<Register />);

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'João');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.type(screen.getByRole('textbox', { name: 'Nome da empresa' }), 'Empresa LTDA');
    await user.click(screen.getByRole('button', { name: /Criar Conta/i }));

    expect(mockState.registerMock).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
    });
  });

  it('exibe a mensagem de sucesso e redireciona para / após o registro', async () => {
    const user = userEvent.setup();
    mockState.registerMock.mockResolvedValue(response);
    render(<Register />);

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'João');
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.type(screen.getByRole('textbox', { name: 'Nome da empresa' }), 'Empresa LTDA');
    await user.click(screen.getByRole('button', { name: /Criar Conta/i }));

    expect(await screen.findByText('Usuário criado com sucesso')).toBeInTheDocument();
    expect(mockState.navigateMock).toHaveBeenCalledWith('/');
  });

  it('exibe mensagem de erro vinda do hook', () => {
    mockState.error = 'E-mail já está em uso';
    render(<Register />);

    expect(screen.getByText('E-mail já está em uso')).toBeInTheDocument();
  });

  it('desabilita o botão e mostra loading quando isLoading', () => {
    mockState.isLoading = true;
    render(<Register />);

    expect(screen.getByRole('button', { name: /Criando conta/i })).toBeDisabled();
  });
});

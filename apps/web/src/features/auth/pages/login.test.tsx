import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LoginResponse } from '../types/login-types';

const mockState = vi.hoisted(() => ({
  loginMock: vi.fn(),
  navigateMock: vi.fn(),
  isLoading: false,
  error: null as string | null,
}));

vi.mock('../hooks/use-login', () => ({
  useLogin: () => ({
    login: mockState.loginMock,
    isLoading: mockState.isLoading,
    error: mockState.error,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockState.navigateMock,
}));

import Login from './login-page';

const response: LoginResponse = {
  user: { id: 'user-1', name: 'João', email: 'joao@email.com' },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isLoading = false;
    mockState.error = null;
  });

  it('renderiza os campos do formulário', () => {
    render(<Login />);

    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('submete o formulário chamando login() com as credenciais preenchidas', async () => {
    const user = userEvent.setup();
    mockState.loginMock.mockResolvedValue(response);
    render(<Login />);

    await user.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(mockState.loginMock).toHaveBeenCalledWith({
      email: 'joao@email.com',
      password: '12345678',
    });
  });

  it('exibe a mensagem de sucesso e redireciona para / após o login', async () => {
    const user = userEvent.setup();
    mockState.loginMock.mockResolvedValue(response);
    render(<Login />);

    await user.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText('Bem-vindo, João!')).toBeInTheDocument();
    expect(mockState.navigateMock).toHaveBeenCalledWith('/');
  });

  it('exibe mensagem de erro vinda do hook', () => {
    mockState.error = 'Senha inválida';
    render(<Login />);

    expect(screen.getByText('Senha inválida')).toBeInTheDocument();
  });

  it('desabilita o botão e mostra loading quando isLoading', () => {
    mockState.isLoading = true;
    render(<Login />);

    expect(screen.getByRole('button', { name: /Entrando/i })).toBeDisabled();
  });
});

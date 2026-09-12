import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegisterResponse } from '../types/register-types';

const mockState = vi.hoisted(() => ({
  registerMock: vi.fn(),
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

import Register from './register-page';

const response: RegisterResponse = {
  message: 'Usuário criado com sucesso',
  user: { id: 'user-1', name: 'João', email: 'joao@email.com' },
  token: 'token-falso',
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isLoading = false;
    mockState.error = null;
  });

  it('renderiza os campos do formulário', () => {
    render(<Register />);

    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Conta/i })).toBeInTheDocument();
  });

  it('submete o formulário chamando register() com os dados preenchidos', async () => {
    const user = userEvent.setup();
    mockState.registerMock.mockResolvedValue(response);
    render(<Register />);

    await user.type(screen.getByLabelText(/Nome/i), 'João');
    await user.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.click(screen.getByRole('button', { name: /Criar Conta/i }));

    expect(mockState.registerMock).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@email.com',
      password: '12345678',
    });
  });

  it('exibe a mensagem de sucesso após o registro', async () => {
    const user = userEvent.setup();
    mockState.registerMock.mockResolvedValue(response);
    render(<Register />);

    await user.type(screen.getByLabelText(/Nome/i), 'João');
    await user.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345678');
    await user.click(screen.getByRole('button', { name: /Criar Conta/i }));

    expect(await screen.findByText('Usuário criado com sucesso')).toBeInTheDocument();
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

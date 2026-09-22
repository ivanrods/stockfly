import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { setTokens, clearTokens } from '@/shared/auth/token-storage';
import type { User } from '@/features/auth/types/register-types';
import type { Company } from '@/features/companies/types/company-types';

const { getCurrentUserMock, getMyCompanyMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getMyCompanyMock: vi.fn(),
}));

vi.mock('@/features/auth/services/current-user-service', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/features/companies/services/company-service', () => ({
  getMyCompany: getMyCompanyMock,
}));

const user: User = {
  id: 'u-1',
  name: 'João',
  email: 'joao@email.com',
  companyId: 'c-1',
  role: 'admin',
};

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

function createToken(payload: object): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.assinatura`;
}

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
  });

  it('redireciona a rota raiz para /login sem sessão', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('renderiza a página de registro em /register sem sessão', async () => {
    renderApp('/register');

    expect(await screen.findByRole('heading', { name: /Criar Conta/i })).toBeInTheDocument();
  });

  it('redireciona /login para a home quando já autenticado', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);

    renderApp('/login');

    expect(await screen.findByRole('heading', { name: /Início/i })).toBeInTheDocument();
  });

  it('protege a home e mostra os dados do usuário autenticado', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);

    renderApp('/');

    expect(await screen.findByText('Bem-vindo, João!')).toBeInTheDocument();
    expect(screen.getAllByText('Empresa LTDA').length).toBeGreaterThan(0);
  });

  it('renderiza as configurações da empresa autenticado', async () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });
    setTokens({ accessToken: token, refreshToken: 'refresh-1' });
    getCurrentUserMock.mockResolvedValue(user);
    getMyCompanyMock.mockResolvedValue(company);

    renderApp('/settings');

    expect(await screen.findByText('Configurações da Empresa')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Empresa LTDA');
  });
});

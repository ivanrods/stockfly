import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './main-layout';
import type { User } from '@/features/auth/types/register-types';
import type { Company } from '@/features/companies/types/company-types';

const { useAuthValue, logoutMock } = vi.hoisted(() => ({
  useAuthValue: {
    user: null as User | null,
    company: null as Company | null,
  },
  logoutMock: vi.fn(),
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => useAuthValue,
}));

vi.mock('@/features/auth/hooks/use-logout', () => ({
  useLogout: () => ({ logout: logoutMock, isLoading: false }),
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

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>conteúdo da página</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra o nome da empresa, o usuário e o conteúdo via Outlet', () => {
    useAuthValue.user = user;
    useAuthValue.company = company;

    renderLayout();

    expect(screen.getByText('Empresa LTDA')).toBeInTheDocument();
    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('conteúdo da página')).toBeInTheDocument();
  });

  it('usa o fallback StockFly sem empresa', () => {
    useAuthValue.user = user;
    useAuthValue.company = null;

    renderLayout();

    expect(screen.getByText('StockFly')).toBeInTheDocument();
  });

  it('possui link para as configurações da empresa', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: /Configurações/i })).toHaveAttribute('href', '/settings');
  });

  it('faz logout ao clicar em Sair', async () => {
    logoutMock.mockResolvedValue(undefined);
    const userEventLocal = userEvent.setup();

    renderLayout();

    await userEventLocal.click(screen.getByRole('button', { name: /Sair/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
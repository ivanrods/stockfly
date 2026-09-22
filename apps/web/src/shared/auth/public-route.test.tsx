import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicRoute from './public-route';

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock('./use-auth', () => ({
  useAuth: () => useAuthMock(),
}));

function renderPublic({
  isAuthenticated,
  isLoading,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  useAuthMock.mockReturnValue({ isAuthenticated, isLoading });
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>Formulario de login</div>
            </PublicRoute>
          }
        />
        <Route path="/" element={<div>Pagina inicial</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza o conteúdo quando não autenticado', () => {
    renderPublic({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText('Formulario de login')).toBeInTheDocument();
  });

  it('redireciona para / quando autenticado', () => {
    renderPublic({ isAuthenticated: true, isLoading: false });

    expect(screen.getByText('Pagina inicial')).toBeInTheDocument();
  });

  it('mostra loading enquanto restaura a sessão', () => {
    const { container } = renderPublic({ isAuthenticated: false, isLoading: true });

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});

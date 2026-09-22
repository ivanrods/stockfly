import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './protected-route';

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock('./use-auth', () => ({
  useAuth: () => useAuthMock(),
}));

function renderProtected({
  isAuthenticated,
  isLoading,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  useAuthMock.mockReturnValue({ isAuthenticated, isLoading });
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Conteudo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Pagina de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza o conteúdo quando autenticado', () => {
    renderProtected({ isAuthenticated: true, isLoading: false });

    expect(screen.getByText('Conteudo protegido')).toBeInTheDocument();
  });

  it('redireciona para /login quando não autenticado', () => {
    renderProtected({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText('Pagina de login')).toBeInTheDocument();
  });

  it('mostra loading enquanto restaura a sessão', () => {
    const { container } = renderProtected({ isAuthenticated: false, isLoading: true });

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});

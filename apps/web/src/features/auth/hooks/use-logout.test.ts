import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { logoutSessionMock, navigateMock } = vi.hoisted(() => ({
  logoutSessionMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({ logout: logoutSessionMock }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

import { useLogout } from './use-logout';

describe('useLogout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delega o logout ao contexto e navega para /login', async () => {
    logoutSessionMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutSessionMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('navega mesmo se o logout do contexto falhar', async () => {
    logoutSessionMock.mockRejectedValue(new Error('erro'));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout().catch(() => undefined);
    });

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('alterna isLoading durante o logout', async () => {
    let resolveLogout!: () => void;
    logoutSessionMock.mockImplementation(
      () => new Promise<void>((resolve) => (resolveLogout = resolve)),
    );
    const { result } = renderHook(() => useLogout());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.logout();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveLogout();
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/shared/auth/token-storage';

const { logoutServiceMock, navigateMock } = vi.hoisted(() => ({
  logoutServiceMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('../services/logout-service', () => ({ logout: logoutServiceMock }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

import { useLogout } from './use-logout';

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
  });

  it('chama o serviço, limpa tokens e navega para /login', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutServiceMock).toHaveBeenCalledWith('refresh-1');
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('limpa tokens e navega mesmo se o serviço falhar', async () => {
    logoutServiceMock.mockRejectedValue(new Error('erro'));
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('não chama o serviço quando não há refresh token', async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutServiceMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('alterna isLoading durante o logout', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    let resolveLogout!: () => void;
    logoutServiceMock.mockImplementation(
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
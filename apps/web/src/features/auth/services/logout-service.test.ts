import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { post: postMock },
  ApiError: class ApiError extends Error {},
}));

import { logout } from './logout-service';

describe('logout-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama POST /auth/logout com o refresh token', async () => {
    postMock.mockResolvedValue({ data: { message: 'Logout realizado com sucesso' } });

    await logout('refresh-1');

    expect(postMock).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-1' });
  });
});
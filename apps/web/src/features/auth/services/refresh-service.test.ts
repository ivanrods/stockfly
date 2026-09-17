import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('@/shared/api/http-client', () => ({
  default: { post: postMock },
  ApiError: class ApiError extends Error {},
}));

import { refreshTokens } from './refresh-service';

describe('refresh-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama POST /auth/refresh com o refresh token e retorna o novo par', async () => {
    const tokens = { accessToken: 'acesso-novo', refreshToken: 'refresh-novo' };
    postMock.mockResolvedValue({ data: tokens });

    const result = await refreshTokens('refresh-antigo');

    expect(postMock).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-antigo' });
    expect(result).toEqual(tokens);
  });
});

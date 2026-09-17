import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token-storage';

describe('token-storage', () => {
  beforeEach(() => clearTokens());
  afterEach(() => clearTokens());

  it('retorna null quando não há tokens salvos', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('salva e recupera o par de tokens', () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
  });

  it('sobrescreve tokens existentes', () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    setTokens({ accessToken: 'access-2', refreshToken: 'refresh-2' });

    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2');
  });

  it('limpa os tokens', () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

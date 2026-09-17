// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import http from 'http';
import type { AddressInfo } from 'net';

const { tokenStorage, redirectMock } = vi.hoisted(() => {
  const store: { access?: string; refresh?: string } = {};
  return {
    tokenStorage: {
      store,
      getAccessToken: () => store.access ?? null,
      getRefreshToken: () => store.refresh ?? null,
      setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
        store.access = tokens.accessToken;
        store.refresh = tokens.refreshToken;
      },
      clearTokens: () => {
        store.access = undefined;
        store.refresh = undefined;
      },
    },
    redirectMock: vi.fn(),
  };
});

vi.mock('@/shared/auth/token-storage', () => ({
  getAccessToken: tokenStorage.getAccessToken,
  getRefreshToken: tokenStorage.getRefreshToken,
  setTokens: tokenStorage.setTokens,
  clearTokens: tokenStorage.clearTokens,
}));

vi.mock('@/shared/auth/redirect', () => ({
  redirectToLogin: redirectMock,
}));

import apiClient from './http-client';

let server: http.Server;
let baseUrl: string;

function readBody(req: http.IncomingMessage): Promise<{ refreshToken?: string }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'POST' && req.url === '/auth/refresh') {
      const body = await readBody(req);

      if (body.refreshToken === 'refresh-antigo') {
        res.writeHead(200);
        res.end(JSON.stringify({ accessToken: 'acesso-novo', refreshToken: 'refresh-novo' }));
        return;
      }

      res.writeHead(401);
      res.end(JSON.stringify({ message: 'Refresh token inválido' }));
      return;
    }

    if (req.method === 'GET' && req.url === '/protected') {
      const auth = req.headers.authorization ?? '';

      if (auth === 'Bearer acesso-novo') {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.writeHead(401);
      res.end(JSON.stringify({ message: 'Token inválido ou expirado' }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Não encontrado' }));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(() => {
  tokenStorage.clearTokens();
  redirectMock.mockClear();
});

afterAll(async () => {
  tokenStorage.clearTokens();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('http-client refresh flow', () => {
  it('refresca os tokens e repete a requisição original com o novo access token', async () => {
    tokenStorage.setTokens({ accessToken: 'acesso-antigo', refreshToken: 'refresh-antigo' });

    const response = await apiClient.get(`${baseUrl}/protected`);

    expect(response.data).toEqual({ ok: true });
    expect(tokenStorage.store).toEqual({ access: 'acesso-novo', refresh: 'refresh-novo' });
  });

  it('limpa os tokens e redireciona para /login quando o refresh falha', async () => {
    tokenStorage.setTokens({ accessToken: 'acesso-antigo', refreshToken: 'refresh-invalido' });

    await expect(apiClient.get(`${baseUrl}/protected`)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Sessão expirada, faça login novamente',
    });

    expect(tokenStorage.store).toEqual({});
    expect(redirectMock).toHaveBeenCalledOnce();
  });

  it('limpa os tokens e redireciona quando não há refresh token salvo', async () => {
    await expect(apiClient.get(`${baseUrl}/protected`)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Token inválido ou expirado',
    });

    expect(tokenStorage.store).toEqual({});
    expect(redirectMock).toHaveBeenCalledOnce();
  });
});

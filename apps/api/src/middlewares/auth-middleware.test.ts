import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn((_token: string) => ({ id: 'user-id' })),
}));

vi.mock('jsonwebtoken', () => ({ default: { verify: verifyMock } }));

import { auth } from './auth-middleware.js';

function buildApp() {
  const app = express();
  app.get('/protected', auth, (_req, res) => res.json({ ok: true }));
  return app;
}

describe('auth middleware', () => {
  it('retorna 401 sem header de autorização', async () => {
    const res = await request(buildApp()).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token não informado');
  });

  it('retorna 401 com header malformado', async () => {
    const res = await request(buildApp()).get('/protected').set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido');
  });

  it('retorna 401 com token inválido', async () => {
    verifyMock.mockImplementation(() => {
      throw new Error('token inválido');
    });

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido');
  });

  it('chama next() com token válido', async () => {
    verifyMock.mockReturnValue({ id: 'user-id' });

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer token-valido');

    expect(verifyMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';

const registerPayload = {
  name: 'João',
  email: 'joao@email.com',
  password: '12345678',
  companyName: 'Empresa LTDA',
};

async function registerAdmin() {
  const res = await request(app).post('/auth/register').send(registerPayload);
  return {
    token: res.body.accessToken as string,
    user: res.body.user as { id: string },
  };
}

describe('GET /users/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('retorna 200 com os dados do usuário autenticado sem a senha', async () => {
    const { token, user } = await registerAdmin();

    const res = await request(app).get('/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.email).toBe(registerPayload.email);
    expect(res.body.password).toBeUndefined();
    expect(res.body.companyId).toBeTruthy();
    expect(res.body.role).toBe('admin');

    const stored = await User.findByPk(user.id);
    expect(stored!.email).toBe(registerPayload.email);
  });

  it('retorna 404 quando o usuário do token não existe', async () => {
    const token = jwt.sign(
      { id: '00000000-0000-4000-8000-000000000001' },
      process.env.JWT_SECRET!,
    );

    const res = await request(app).get('/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Usuário não encontrado');
  });
});
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { Permission } from '../../../shared/database/models/permission-model.js';

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
    company: res.body.company as { id: string },
  };
}

async function createOperatorToken() {
  const { company } = await registerAdmin();
  const token = jwt.sign(
    {
      id: '00000000-0000-4000-8000-000000000099',
      companyId: company.id,
      role: 'operator',
    },
    process.env.JWT_SECRET!,
  );
  return token;
}

describe('GET /roles', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/roles');
    expect(res.status).toBe(401);
  });

  it('retorna 200 com os papéis padrão para um usuário autenticado', async () => {
    const { token } = await registerAdmin();

    const res = await request(app).get('/roles').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((role: { name: string }) => role.name);
    expect(names).toEqual(expect.arrayContaining(['admin', 'manager', 'operator', 'viewer']));
  });

  it('retorna 200 para um papel com permissão users:read (operator)', async () => {
    const token = await createOperatorToken();

    const res = await request(app).get('/roles').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('as permissões cadastradas incluem os recursos principais', async () => {
    const permissions = await Permission.findAll();
    const names = permissions.map((permission) => permission.name);
    expect(names).toEqual(
      expect.arrayContaining(['products:read', 'stock:create', 'users:update']),
    );
  });
});

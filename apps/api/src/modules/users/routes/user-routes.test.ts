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
    user: res.body.user as { id: string; companyId: string },
  };
}

let colaboradorCounter = 0;

async function createUserInCompany(companyId: string, overrides: Partial<User> = {}) {
  colaboradorCounter += 1;
  return User.create({
    name: 'Colaborador',
    email: `colaborador-${colaboradorCounter}-${Date.now()}@email.com`,
    password: 'hash',
    companyId,
    role: 'operator',
    ...overrides,
  });
}

function signToken(user: { id: string; companyId: string | null; role: string }) {
  return jwt.sign(
    { id: user.id, companyId: user.companyId, role: user.role },
    process.env.JWT_SECRET!,
  );
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
  });

  it('retorna 404 quando o usuário do token não existe', async () => {
    const token = jwt.sign({ id: '00000000-0000-4000-8000-000000000001' }, process.env.JWT_SECRET!);

    const res = await request(app).get('/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Usuário não encontrado');
  });
});

describe('GET /users', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });

  it('retorna 200 com os usuários da empresa sem senha', async () => {
    const { token, user } = await registerAdmin();
    await createUserInCompany(user.companyId);

    const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const emails = res.body.map((item: { email: string }) => item.email);
    expect(emails).toContain(registerPayload.email);
    for (const item of res.body) {
      expect(item).not.toHaveProperty('password');
    }
  });

  it('retorna 200 para um papel com permissão users:read (viewer)', async () => {
    const { user } = await registerAdmin();
    const viewer = await createUserInCompany(user.companyId, { role: 'viewer' });
    const token = signToken(viewer);

    const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /users', () => {
  it('cria um usuário na empresa como admin', async () => {
    const { token, user } = await registerAdmin();

    const res = await request(app).post('/users').set('Authorization', `Bearer ${token}`).send({
      name: 'Maria',
      email: 'maria@email.com',
      password: 'senha123',
      role: 'manager',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('maria@email.com');
    expect(res.body.role).toBe('manager');
    expect(res.body.companyId).toBe(user.companyId);
    expect(res.body.password).toBeUndefined();

    const stored = await User.findOne({ where: { email: 'maria@email.com' } });
    expect(stored).not.toBeNull();
    expect(stored!.companyId).toBe(user.companyId);
    expect(stored!.password).not.toBe('senha123');
  });

  it('retorna 403 para quem não tem permissão users:create (viewer)', async () => {
    const { user } = await registerAdmin();
    const viewer = await createUserInCompany(user.companyId, { role: 'viewer' });
    const token = signToken(viewer);

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria', email: 'maria@email.com', password: 'senha123' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', email: 'invalido', password: '123' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 se o e-mail já está em uso', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria', email: registerPayload.email, password: 'senha123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('E-mail já está em uso');
  });
});

describe('PUT /users/:id/role', () => {
  it('altera o papel de um usuário da empresa como admin', async () => {
    const { token, user } = await registerAdmin();
    const colaborador = await createUserInCompany(user.companyId);

    const res = await request(app)
      .put(`/users/${colaborador.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'manager' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(colaborador.id);
    expect(res.body.role).toBe('manager');

    const stored = await User.findByPk(colaborador.id);
    expect(stored!.role).toBe('manager');
  });

  it('retorna 400 ao tentar alterar o próprio papel', async () => {
    const { token, user } = await registerAdmin();

    const res = await request(app)
      .put(`/users/${user.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'viewer' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Você não pode alterar o próprio papel');
  });

  it('retorna 400 para usuário de outra empresa', async () => {
    const { token } = await registerAdmin();
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com' });

    const res = await request(app)
      .put(`/users/${other.body.user.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'manager' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Usuário não pertence à sua empresa');
  });

  it('retorna 400 com papel inválido', async () => {
    const { token, user } = await registerAdmin();
    const colaborador = await createUserInCompany(user.companyId);

    const res = await request(app)
      .put(`/users/${colaborador.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'boss' });

    expect(res.status).toBe(400);
  });

  it('retorna 403 para quem não tem permissão users:update (operator)', async () => {
    const { user } = await registerAdmin();
    const operator = await createUserInCompany(user.companyId);
    const colaborador = await createUserInCompany(user.companyId, {
      email: `outro-${colaboradorCounter}-${Date.now()}@email.com`,
    });
    const token = signToken(operator);

    const res = await request(app)
      .put(`/users/${colaborador.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'manager' });

    expect(res.status).toBe(403);
  });
});

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';

describe('POST /auth/register', () => {
  const payload = { name: 'João', email: 'joao@email.com', password: '12345678' };

  it('cria usuário e retorna user + token', async () => {
    const res = await request(app).post('/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuário criado com sucesso');
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!);
    expect(decoded).toMatchObject({ id: res.body.user.id });

    const stored = await User.findByPk(res.body.user.id);
    expect(stored!.password).not.toBe(payload.password);
    await expect(bcrypt.compare(payload.password, stored!.password)).resolves.toBe(true);
  });

  it('retorna 400 se o email já está em uso', async () => {
    await request(app).post('/auth/register').send(payload);

    const res = await request(app).post('/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('E-mail já está em uso');
  });

  it('retorna 400 com dados inválidos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'João', email: 'joao@email.com', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  const payload = { name: 'João', email: 'joao@email.com', password: '12345678' };

  async function createUser() {
    await request(app).post('/auth/register').send(payload);
  }

  it('loga e retorna user + token', async () => {
    await createUser();

    const res = await request(app)
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!);
    expect(decoded).toMatchObject({ id: res.body.user.id });
  });

  it('retorna 401 se o usuário não existe', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@email.com', password: '12345678' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Usuário não encontrado');
  });

  it('retorna 401 com senha errada', async () => {
    await createUser();

    const res = await request(app)
      .post('/auth/login')
      .send({ email: payload.email, password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Senha inválida');
  });

  it('retorna 400 com dados inválidos', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'invalido', password: '' });

    expect(res.status).toBe(400);
  });
});

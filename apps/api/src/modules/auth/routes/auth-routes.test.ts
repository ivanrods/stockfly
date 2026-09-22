import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';
import { RefreshToken } from '../../../shared/database/models/refresh-token-model.js';
import { Company } from '../../../shared/database/models/company-model.js';

describe('POST /auth/register', () => {
  const payload = {
    name: 'João',
    email: 'joao@email.com',
    password: '12345678',
    companyName: 'Empresa LTDA',
  };

  it('cria usuário e retorna user + company + accessToken + refreshToken', async () => {
    const res = await request(app).post('/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuário criado com sucesso');
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.company.name).toBe(payload.companyName);

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET!) as {
      id: string;
      companyId: string;
      role: string;
    };
    expect(decoded).toMatchObject({ id: res.body.user.id, role: 'admin' });
    expect(decoded.companyId).toBe(res.body.company.id);

    const storedCompany = await Company.findByPk(res.body.company.id);
    expect(storedCompany).not.toBeNull();
    expect(storedCompany!.name).toBe(payload.companyName);

    const storedUser = await User.findByPk(res.body.user.id);
    expect(storedUser!.companyId).toBe(res.body.company.id);
    expect(storedUser!.role).toBe('admin');
    expect(storedUser!.password).not.toBe(payload.password);

    const storedToken = await RefreshToken.findOne({
      where: { token: res.body.refreshToken },
    });
    expect(storedToken).not.toBeNull();
    expect(storedToken!.userId).toBe(res.body.user.id);
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
  const payload = {
    name: 'João',
    email: 'joao@email.com',
    password: '12345678',
    companyName: 'Empresa LTDA',
  };

  async function createUser() {
    await request(app).post('/auth/register').send(payload);
  }

  it('loga e retorna user + company + accessToken + refreshToken', async () => {
    await createUser();

    const res = await request(app)
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.company.name).toBe(payload.companyName);

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET!) as {
      id: string;
      companyId: string;
      role: string;
    };
    expect(decoded).toMatchObject({ id: res.body.user.id, role: 'admin' });
    expect(decoded.companyId).toBe(res.body.company.id);
    expect(res.body.refreshToken).toBeTruthy();
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

describe('POST /auth/refresh', () => {
  const payload = {
    name: 'João',
    email: 'joao@email.com',
    password: '12345678',
    companyName: 'Empresa LTDA',
  };

  async function createUserWithRefreshToken() {
    const res = await request(app).post('/auth/register').send(payload);
    return res.body.refreshToken as string;
  }

  it('renova os tokens e revoga o refresh token antigo', async () => {
    const oldRefreshToken = await createUserWithRefreshToken();

    const res = await request(app).post('/auth/refresh').send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(oldRefreshToken);

    const oldStored = await RefreshToken.findOne({ where: { token: oldRefreshToken } });
    expect(oldStored).toBeNull();

    const newStored = await RefreshToken.findOne({
      where: { token: res.body.refreshToken },
    });
    expect(newStored).not.toBeNull();
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'token-invalido' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token inválido');
  });

  it('retorna 401 com refresh token reutilizado (já revogado)', async () => {
    const oldRefreshToken = await createUserWithRefreshToken();

    await request(app).post('/auth/refresh').send({ refreshToken: oldRefreshToken });

    const res = await request(app).post('/auth/refresh').send({ refreshToken: oldRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token inválido');
  });

  it('retorna 401 e revoga se o refresh token está expirado', async () => {
    const { user: registeredUser } = await request(app)
      .post('/auth/register')
      .send(payload)
      .then((r) => r.body);

    const expiredToken = await RefreshToken.create({
      token: 'refresh-token-expirado',
      userId: registeredUser.id,
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app).post('/auth/refresh').send({ refreshToken: expiredToken.token });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token expirado');

    const stored = await RefreshToken.findOne({ where: { token: expiredToken.token } });
    expect(stored).toBeNull();
  });

  it('retorna 400 sem refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/logout', () => {
  const payload = {
    name: 'João',
    email: 'joao@email.com',
    password: '12345678',
    companyName: 'Empresa LTDA',
  };

  it('revoga o refresh token', async () => {
    const res = await request(app).post('/auth/register').send(payload);
    const refreshToken = res.body.refreshToken as string;

    const logout = await request(app).post('/auth/logout').send({ refreshToken });

    expect(logout.status).toBe(200);
    expect(logout.body.message).toBe('Logout realizado com sucesso');

    const stored = await RefreshToken.findOne({ where: { token: refreshToken } });
    expect(stored).toBeNull();
  });

  it('retorna 400 sem refresh token', async () => {
    const res = await request(app).post('/auth/logout').send({});

    expect(res.status).toBe(400);
  });
});

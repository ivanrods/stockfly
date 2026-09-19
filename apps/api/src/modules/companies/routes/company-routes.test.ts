import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { Company } from '../../../shared/database/models/company-model.js';
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
    company: res.body.company as { id: string },
  };
}

async function createOperator() {
  const { company } = await registerAdmin();
  const user = await User.create({
    name: 'Operador',
    email: 'operador@email.com',
    password: 'hash',
    companyId: company.id,
    role: 'operator',
  });
  const token = jwt.sign(
    { id: user.id, companyId: company.id, role: 'operator' },
    process.env.JWT_SECRET!,
  );
  return { token, company };
}

describe('GET /companies/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/companies/me');
    expect(res.status).toBe(401);
  });

  it('retorna 200 com a empresa do usuário autenticado', async () => {
    const { token, company } = await registerAdmin();

    const res = await request(app).get('/companies/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(company.id);
    expect(res.body.name).toBe(registerPayload.companyName);
  });

  it('retorna 404 se o token não possui companyId', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET!);

    const res = await request(app).get('/companies/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /companies/:id', () => {
  it('atualiza a empresa como admin', async () => {
    const { token, company } = await registerAdmin();

    const res = await request(app)
      .put(`/companies/${company.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '(11) 99999-0000', city: 'São Paulo', state: 'sp' });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('(11) 99999-0000');
    expect(res.body.city).toBe('São Paulo');
    expect(res.body.state).toBe('SP');

    const stored = await Company.findByPk(company.id);
    expect(stored!.phone).toBe('(11) 99999-0000');
  });

  it('retorna 403 para id de outra empresa', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .put('/companies/other-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '123' });

    expect(res.status).toBe(403);
  });

  it('retorna 403 para usuário sem role admin', async () => {
    const { token, company } = await createOperator();

    const res = await request(app)
      .put(`/companies/${company.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '123' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const { token, company } = await registerAdmin();

    const res = await request(app)
      .put(`/companies/${company.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cnpj: 'invalido' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /companies/:id', () => {
  it('inativa a empresa como admin', async () => {
    const { token, company } = await registerAdmin();

    const res = await request(app)
      .delete(`/companies/${company.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');

    const stored = await Company.findByPk(company.id);
    expect(stored!.status).toBe('inactive');
  });

  it('retorna 403 para id de outra empresa', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .delete('/companies/other-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('retorna 403 para usuário sem role admin', async () => {
    const { token, company } = await createOperator();

    const res = await request(app)
      .delete(`/companies/${company.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
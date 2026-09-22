import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';
import { Supplier } from '../../../shared/database/models/supplier-model.js';
import { Permission } from '../../../shared/database/models/permission-model.js';
import { Role } from '../../../shared/database/models/role-model.js';
import { RolePermission } from '../../../shared/database/models/role-permission-model.js';

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
    companyId: res.body.user.companyId as string,
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
    role: 'viewer',
    ...overrides,
  });
}

function signToken(user: { id: string; companyId: string | null; role: string }) {
  return jwt.sign(
    { id: user.id, companyId: user.companyId, role: user.role },
    process.env.JWT_SECRET!,
  );
}

describe('GET /suppliers', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/suppliers');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para papel sem permissão suppliers:read', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const permission = await Permission.findOne({ where: { name: 'suppliers:read' } });
    const role = await Role.findOne({ where: { name: 'viewer' } });
    await RolePermission.destroy({
      where: { roleId: role!.id, permissionId: permission!.id },
    });

    const res = await request(app).get('/suppliers').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retorna 200 com os fornecedores apenas da empresa', async () => {
    const { token, companyId } = await registerAdmin();

    await Supplier.create({ companyId, name: 'Tech Distribuidora' });
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    await Supplier.create({
      companyId: other.body.user.companyId as string,
      name: 'Outro Fornecedor',
    });

    const res = await request(app).get('/suppliers').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Tech Distribuidora');
  });
});

describe('POST /suppliers', () => {
  it('cria um fornecedor na empresa como admin', async () => {
    const { token, companyId } = await registerAdmin();

    const res = await request(app).post('/suppliers').set('Authorization', `Bearer ${token}`).send({
      name: 'Tech Distribuidora',
      contactName: 'Carlos',
      phone: '(11) 99999-0000',
      email: 'contato@tech.com',
      cnpj: '12.345.678/0001-90',
      city: 'São Paulo',
      state: 'sp',
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Tech Distribuidora');
    expect(res.body.companyId).toBe(companyId);
    expect(res.body.cnpj).toBe('12345678000190');
    expect(res.body.state).toBe('SP');
  });

  it('retorna 403 para quem não tem permissão suppliers:create (viewer)', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const res = await request(app)
      .post('/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tech Distribuidora' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .post('/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', email: 'invalido' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /suppliers/:id', () => {
  it('atualiza um fornecedor da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const supplier = await Supplier.create({ companyId, name: 'Tech Distribuidora' });

    const res = await request(app)
      .put(`/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '(11) 88888-0000' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(supplier.id);
    expect(res.body.phone).toBe('(11) 88888-0000');
  });

  it('retorna 400 (404) para fornecedor de outra empresa', async () => {
    const { token } = await registerAdmin();
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    const otherSupplier = await Supplier.create({
      companyId: other.body.user.companyId as string,
      name: 'Outro',
    });

    const res = await request(app)
      .put(`/suppliers/${otherSupplier.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Fornecedor não encontrado');
  });

  it('retorna 403 para quem não tem permissão suppliers:update (viewer)', async () => {
    const { companyId } = await registerAdmin();
    const supplier = await Supplier.create({ companyId, name: 'Tech Distribuidora' });
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const res = await request(app)
      .put(`/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '123' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /suppliers/:id', () => {
  it('remove (soft delete) um fornecedor da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const supplier = await Supplier.create({ companyId, name: 'Tech Distribuidora' });

    const res = await request(app)
      .delete(`/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(supplier.id);

    const stored = await Supplier.findByPk(supplier.id, { paranoid: false });
    expect(stored).not.toBeNull();
    expect(stored!.deletedAt).not.toBeNull();

    const list = await request(app).get('/suppliers').set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });

  it('retorna 400 para fornecedor inexistente', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .delete('/suppliers/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Fornecedor não encontrado');
  });
});

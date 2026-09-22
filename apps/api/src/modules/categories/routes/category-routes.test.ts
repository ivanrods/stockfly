import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';
import { Category } from '../../../shared/database/models/category-model.js';
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

describe('GET /categories', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/categories');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para papel sem permissão categories:read', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const permission = await Permission.findOne({ where: { name: 'categories:read' } });
    const role = await Role.findOne({ where: { name: 'viewer' } });
    await RolePermission.destroy({
      where: { roleId: role!.id, permissionId: permission!.id },
    });

    const res = await request(app).get('/categories').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retorna 200 com as categorias apenas da empresa', async () => {
    const { token, companyId } = await registerAdmin();

    await Category.create({ companyId, name: 'Informática' });
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    await Category.create({ companyId: other.body.user.companyId as string, name: 'Outra Categoria' });

    const res = await request(app).get('/categories').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Informática');
  });
});

describe('POST /categories', () => {
  it('cria uma categoria na empresa como admin', async () => {
    const { token, companyId } = await registerAdmin();

    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Informática', description: 'Hardware e periféricos' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Informática');
    expect(res.body.companyId).toBe(companyId);
    expect(res.body.description).toBe('Hardware e periféricos');
  });

  it('retorna 403 para quem não tem permissão categories:create (viewer)', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Informática' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /categories/:id', () => {
  it('atualiza uma categoria da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });

    const res = await request(app)
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gamer' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(category.id);
    expect(res.body.name).toBe('Gamer');
  });

  it('retorna 404 (400) para categoria de outra empresa', async () => {
    const { token } = await registerAdmin();
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    const otherCategory = await Category.create({
      companyId: other.body.user.companyId as string,
      name: 'Outra',
    });

    const res = await request(app)
      .put(`/categories/${otherCategory.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hackeado' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Categoria não encontrada');
  });

  it('retorna 403 para quem não tem permissão categories:update (viewer)', async () => {
    const { companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const res = await request(app)
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gamer' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /categories/:id', () => {
  it('remove (soft delete) uma categoria da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });

    const res = await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(category.id);

    const stored = await Category.findByPk(category.id, { paranoid: false });
    expect(stored).not.toBeNull();
    expect(stored!.deletedAt).not.toBeNull();

    const list = await request(app).get('/categories').set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
    expect(list.body.some((item: { id: string }) => item.id === category.id)).toBe(false);
  });

  it('retorna 400 para categoria inexistente', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .delete('/categories/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Categoria não encontrada');
  });
});
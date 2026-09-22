import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import '../../../test/db.js';
import { app } from '../../../app.js';
import { User } from '../../../shared/database/models/user-model.js';
import { Product } from '../../../shared/database/models/product-model.js';
import { Category } from '../../../shared/database/models/category-model.js';
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

describe('GET /products', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para papel sem permissão products:read', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const permission = await Permission.findOne({ where: { name: 'products:read' } });
    const role = await Role.findOne({ where: { name: 'viewer' } });
    await RolePermission.destroy({
      where: { roleId: role!.id, permissionId: permission!.id },
    });

    const res = await request(app).get('/products').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retorna apenas os produtos da empresa, paginados', async () => {
    const { token, companyId } = await registerAdmin();
    await Product.bulkCreate([
      { companyId, name: 'Notebook' },
      { companyId, name: 'Mouse' },
    ]);
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    await Product.create({ companyId: other.body.user.companyId as string, name: 'Produto Alheio' });

    const res = await request(app).get('/products').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.totalPages).toBe(1);
    const names = res.body.data.map((item: { name: string }) => item.name);
    expect(names).toEqual(['Mouse', 'Notebook']);
    expect(names).not.toContain('Produto Alheio');
  });

  it('filtra pela busca (q) por nome', async () => {
    const { token, companyId } = await registerAdmin();
    await Product.bulkCreate([
      { companyId, name: 'Notebook Gamer' },
      { companyId, name: 'Mouse Gamer' },
      { companyId, name: 'Teclado' },
    ]);

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ q: 'gamer' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('filtra por categoria e fornecedor', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });
    const supplier = await Supplier.create({ companyId, name: 'Distribuidora X' });
    await Product.bulkCreate([
      { companyId, name: 'Notebook', categoryId: category.id },
      { companyId, name: 'Monitor', supplierId: supplier.id },
      { companyId, name: 'Impressora', categoryId: category.id, supplierId: supplier.id },
    ]);

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ categoryId: category.id, supplierId: supplier.id });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Impressora');
  });

  it('filtra por estoque baixo (lowStock)', async () => {
    const { token, companyId } = await registerAdmin();
    await Product.bulkCreate([
      { companyId, name: 'Item Crítico', quantity: 2, minStock: 5 },
      { companyId, name: 'Item OK', quantity: 10, minStock: 5 },
    ]);

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ lowStock: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe('Item Crítico');
  });

  it('filtra por status inativo', async () => {
    const { token, companyId } = await registerAdmin();
    await Product.bulkCreate([
      { companyId, name: 'Ativo' },
      { companyId, name: 'Desativado', status: 'inactive' },
    ]);

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe('Desativado');
  });

  it('pagina corretamente (page e limit)', async () => {
    const { token, companyId } = await registerAdmin();
    await Product.bulkCreate([
      { companyId, name: 'P1' },
      { companyId, name: 'P2' },
      { companyId, name: 'P3' },
    ]);

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: '2', limit: '1' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.page).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.data[0].name).toBe('P2');
  });

  it('retorna 400 com query inválida', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 'abc' });

    expect(res.status).toBe(400);
  });
});

describe('POST /products', () => {
  it('cria um produto na empresa como admin', async () => {
    const { token, companyId } = await registerAdmin();

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Notebook',
        sku: 'NB-001',
        barcode: '7891234567890',
        description: 'Notebook 16GB',
        purchasePrice: '2500.00',
        salePrice: '3299.90',
        quantity: 10,
        minStock: 2,
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Notebook');
    expect(res.body.sku).toBe('NB-001');
    expect(res.body.companyId).toBe(companyId);
    expect(res.body.quantity).toBe(10);
    expect(res.body.minStock).toBe(2);
  });

  it('cria um produto com categoria e fornecedor (includes)', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });
    const supplier = await Supplier.create({ companyId, name: 'Distribuidora X' });

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Notebook', categoryId: category.id, supplierId: supplier.id });

    expect(res.status).toBe(201);
    expect(res.body.categoryId).toBe(category.id);
    expect(res.body.supplierId).toBe(supplier.id);
  });

  it('retorna 403 para quem não tem permissão products:create (viewer)', async () => {
    const { companyId } = await registerAdmin();
    const viewer = await createUserInCompany(companyId);
    const token = signToken(viewer);

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Notebook' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 com body inválido', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', salePrice: '-5' });

    expect(res.status).toBe(400);
  });
});

describe('GET /products/:id', () => {
  it('retorna o produto com categoria e fornecedor', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });
    const product = await Product.create({ companyId, name: 'Notebook', categoryId: category.id });

    const res = await request(app)
      .get(`/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(res.body.category.id).toBe(category.id);
    expect(res.body.category.name).toBe('Informática');
  });

  it('retorna 400 para produto de outra empresa', async () => {
    const { token } = await registerAdmin();
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    const otherProduct = await Product.create({
      companyId: other.body.user.companyId as string,
      name: 'Alheio',
    });

    const res = await request(app)
      .get(`/products/${otherProduct.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Produto não encontrado');
  });
});

describe('PUT /products/:id', () => {
  it('atualiza um produto da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const product = await Product.create({ companyId, name: 'Notebook', salePrice: '2999.90' });

    const res = await request(app)
      .put(`/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ salePrice: '3499.99', minStock: 5 });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(Number(res.body.salePrice)).toBe(3499.99);
    expect(res.body.minStock).toBe(5);
  });

  it('retorna 400 (404) para produto de outra empresa', async () => {
    const { token } = await registerAdmin();
    const other = await request(app)
      .post('/auth/register')
      .send({ ...registerPayload, email: 'outra-empresa@email.com', companyName: 'Outra LTDA' });
    const otherProduct = await Product.create({
      companyId: other.body.user.companyId as string,
      name: 'Alheio',
    });

    const res = await request(app)
      .put(`/products/${otherProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hackeado' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Produto não encontrado');
  });
});

describe('DELETE /products/:id', () => {
  it('remove (soft delete) um produto da empresa', async () => {
    const { token, companyId } = await registerAdmin();
    const product = await Product.create({ companyId, name: 'Notebook' });

    const res = await request(app)
      .delete(`/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);

    const stored = await Product.findByPk(product.id, { paranoid: false });
    expect(stored).not.toBeNull();
    expect(stored!.deletedAt).not.toBeNull();

    const list = await request(app).get('/products').set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(0);
  });

  it('retorna 400 para produto inexistente', async () => {
    const { token } = await registerAdmin();

    const res = await request(app)
      .delete('/products/00000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Produto não encontrado');
  });
});

describe('FK set null ao remover categoria/fornecedor', () => {
  it('produto fica sem categoria ao remover a categoria (soft delete)', async () => {
    const { token, companyId } = await registerAdmin();
    const category = await Category.create({ companyId, name: 'Informática' });
    const product = await Product.create({ companyId, name: 'Notebook', categoryId: category.id });

    await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    const stored = await Product.findByPk(product.id);
    expect(stored!.categoryId).toBeNull();
  });
});
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { Client } from 'pg';
import type { Sequelize } from 'sequelize';

const TEST_DB_NAME = 'stock_test';

function resolveTestDatabaseUrl(base: string): string {
  const url = new URL(base);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error('DATABASE_URL é obrigatória para rodar os testes');

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  process.env.DATABASE_URL = resolveTestDatabaseUrl(adminUrl);
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let sequelize: Sequelize | null = null;

beforeAll(async () => {
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`).catch(() => {});
  await admin.end();

  const [{ sequelize: db }] = await Promise.all([
    import('../shared/config/database.js'),
    import('../shared/database/models/user-model.js'),
  ]);
  sequelize = db;
  await db.sync({ force: true });
});

beforeEach(async () => {
  if (!sequelize) return;
  const names = Object.values(sequelize.models)
    .map((model) => `"${model.tableName}"`)
    .join(', ');
  if (names) await sequelize.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  if (sequelize) await sequelize.close();
});

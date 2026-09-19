import { afterAll, beforeAll, beforeEach } from 'vitest';
import { Client } from 'pg';
import type { Sequelize } from 'sequelize';
import { devUrl, testDbName } from './config.js';

let sequelize: Sequelize | null = null;

beforeAll(async () => {
  const admin = new Client({ connectionString: devUrl.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${testDbName}`).catch(() => {});
  await admin.end();

  const [{ sequelize: db }] = await Promise.all([
    import('../shared/config/database.js'),
    import('../shared/database/models/user-model.js'),
    import('../shared/database/models/company-model.js'),
    import('../shared/database/models/refresh-token-model.js'),
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

export {};

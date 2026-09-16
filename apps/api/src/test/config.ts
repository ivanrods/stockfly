import 'dotenv/config';

const testDbName = 'stock_test';

function reachableFromHost(url: URL): void {
  if (url.hostname === 'postgres' && process.env.DOCKER_ENV !== 'true') {
    url.hostname = 'localhost';
    url.port = process.env.POSTGRES_PORT || '5433';
  }
}

const devUrl = new URL(process.env.DATABASE_URL ?? '');
if (!devUrl.hostname) throw new Error('DATABASE_URL é obrigatória para rodar os testes');

reachableFromHost(devUrl);

const testUrl = process.env.TEST_DATABASE_URL
  ? new URL(process.env.TEST_DATABASE_URL)
  : new URL(devUrl.toString());
testUrl.pathname = `/${testDbName}`;

process.env.DATABASE_URL = testUrl.toString();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

export { devUrl, testDbName, testUrl };

import { describe, expect, it } from 'vitest';
import { decodeJwtPayload } from './jwt';

function createToken(payload: object): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.assinatura`;
}

describe('decodeJwtPayload', () => {
  it('decodifica o payload do token', () => {
    const token = createToken({ id: 'u-1', companyId: 'c-1', role: 'admin' });

    expect(decodeJwtPayload(token)).toEqual({
      id: 'u-1',
      companyId: 'c-1',
      role: 'admin',
    });
  });

  it('assume role viewer quando ausente no payload', () => {
    const token = createToken({ id: 'u-1', companyId: null });

    expect(decodeJwtPayload(token)).toEqual({
      id: 'u-1',
      companyId: null,
      role: 'viewer',
    });
  });

  it('assume companyId null quando ausente no payload', () => {
    const token = createToken({ id: 'u-1', role: 'admin' });

    expect(decodeJwtPayload(token)?.companyId).toBeNull();
  });

  it('retorna null para token inválido', () => {
    expect(decodeJwtPayload('nao-e-um-token')).toBeNull();
  });

  it('retorna null para token sem segments', () => {
    expect(decodeJwtPayload('semsignaturepoint')).toBeNull();
  });

  it('retorna null quando o payload não tem id', () => {
    const token = createToken({ companyId: 'c-1', role: 'admin' });

    expect(decodeJwtPayload(token)).toBeNull();
  });

  it('retorna null quando o payload não é JSON válido', () => {
    const base64 = Buffer.from('nao-json').toString('base64url');
    const token = `${createToken({})}`.split('.')[0].concat(`.${base64}.sig`);

    expect(decodeJwtPayload(token)).toBeNull();
  });
});
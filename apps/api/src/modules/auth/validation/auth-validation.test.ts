import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth-validation.js';

describe('loginSchema', () => {
  it('aceita email e senha válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@email.com', password: '12345678' });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const result = loginSchema.safeParse({ email: 'invalido', password: '12345678' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha ausente', () => {
    const result = loginSchema.safeParse({ email: 'user@email.com' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('aceita dados válidos', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome ausente', () => {
    const result = registerSchema.safeParse({ email: 'user@email.com', password: '12345678' });
    expect(result.success).toBe(false);
  });
});

describe('refreshTokenSchema', () => {
  it('aceita refresh token válido', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejeita refresh token ausente', () => {
    const result = refreshTokenSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

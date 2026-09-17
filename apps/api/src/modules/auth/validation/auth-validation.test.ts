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
      companyName: 'Empresa LTDA',
    });
    expect(result.success).toBe(true);
  });

  it('aceita CNPJ mascarado e normaliza para 14 dígitos', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
      cnpj: '12.345.678/0001-90',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cnpj).toBe('12345678000190');
  });

  it('aceita campos opcionais vazios como null', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
      cnpj: '',
      companyPhone: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBeNull();
      expect(result.data.companyPhone).toBeNull();
    }
  });

  it('rejeita CNPJ inválido', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
      cnpj: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita empresa sem nome', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'user@email.com',
      password: '123',
      companyName: 'Empresa LTDA',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome ausente', () => {
    const result = registerSchema.safeParse({
      email: 'user@email.com',
      password: '12345678',
      companyName: 'Empresa LTDA',
    });
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

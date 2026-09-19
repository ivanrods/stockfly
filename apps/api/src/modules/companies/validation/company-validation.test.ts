import { describe, expect, it } from 'vitest';
import { createCompanySchema, updateCompanySchema } from './company-validation.js';

const validCompany = {
  name: 'Empresa LTDA',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 99999-0000',
  email: 'contato@empresa.com',
  street: 'Rua A',
  number: '100',
  complement: 'Sala 2',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'sp',
  zipCode: '01310-100',
};

describe('createCompanySchema', () => {
  it('aceita empresa válida e normaliza cnpj e state', () => {
    const result = createCompanySchema.safeParse(validCompany);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBe('12345678000190');
      expect(result.data.state).toBe('SP');
      expect(result.data.zipCode).toBe('01310-100');
    }
  });

  it('aceita campos opcionais vazios como null', () => {
    const result = createCompanySchema.safeParse({ name: 'Empresa', cnpj: '', city: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBeNull();
      expect(result.data.city).toBeNull();
    }
  });

  it('aceita empresa sem nenhum campo opcional', () => {
    const result = createCompanySchema.safeParse({ name: 'Empresa' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Empresa');
    }
  });

  it('rejeita empresa sem nome', () => {
    expect(createCompanySchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejeita CNPJ inválido', () => {
    expect(createCompanySchema.safeParse({ name: 'Empresa', cnpj: '123' }).success).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    expect(createCompanySchema.safeParse({ name: 'Empresa', email: 'invalido' }).success).toBe(false);
  });

  it('rejeita UF inválida', () => {
    expect(createCompanySchema.safeParse({ name: 'Empresa', state: 'SPO' }).success).toBe(false);
  });
});

describe('updateCompanySchema', () => {
  it('aceita objeto parcial e normaliza cnpj', () => {
    const result = updateCompanySchema.safeParse({ cnpj: '12.345.678/0001-90' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cnpj).toBe('12345678000190');
  });

  it('aceita objeto vazio', () => {
    expect(updateCompanySchema.safeParse({}).success).toBe(true);
  });

  it('rejeita nome vazio na atualização', () => {
    expect(updateCompanySchema.safeParse({ name: '' }).success).toBe(false);
  });
});
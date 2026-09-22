import { z } from 'zod';

const emptyToNull = z
  .union([z.literal(''), z.string().min(1)])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const cnpj = z
  .union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido'),
  ])
  .optional()
  .nullable()
  .transform((value) => (value ? value.replace(/\D/g, '') : null));

const email = z
  .union([z.literal(''), z.string().email('Formato de e-mail inválido')])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const state = z
  .union([
    z.literal(''),
    z
      .string()
      .regex(/^[A-Za-z]{2}$/, 'UF deve ter 2 letras')
      .transform((value) => value.toUpperCase()),
  ])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  contactName: emptyToNull,
  phone: emptyToNull,
  email,
  cnpj,
  street: emptyToNull,
  number: emptyToNull,
  complement: emptyToNull,
  neighborhood: emptyToNull,
  city: emptyToNull,
  state,
  zipCode: emptyToNull,
});

export const updateSupplierSchema = createSupplierSchema.partial();

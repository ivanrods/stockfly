import { z } from 'zod';

export const productStatuses = ['active', 'inactive'] as const;

const emptyToNull = z
  .union([z.literal(''), z.string().min(1)])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const uuidOrNull = z
  .union([z.literal(''), z.string().min(1)])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const positiveNumber = z
  .string()
  .or(z.number())
  .optional()
  .nullable()
  .transform((value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) return null;
    return number;
  })
  .refine((value) => value === null || value >= 0, 'Valor não pode ser negativo');

const integer = z
  .string()
  .or(z.number())
  .optional()
  .nullable()
  .transform((value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) return null;
    return Math.trunc(number);
  })
  .refine((value) => value === null || value >= 0, 'Valor não pode ser negativo');

export const createProductSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  sku: emptyToNull,
  barcode: emptyToNull,
  description: emptyToNull,
  purchasePrice: positiveNumber,
  salePrice: positiveNumber,
  quantity: integer.default(0).transform((value) => value ?? 0),
  minStock: integer.default(0).transform((value) => value ?? 0),
  categoryId: uuidOrNull,
  supplierId: uuidOrNull,
  imageUrl: emptyToNull,
  weight: positiveNumber,
  dimensions: z.record(z.string(), z.number()).optional().nullable(),
  status: z.enum(productStatuses).default('active'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').optional(),
  sku: emptyToNull.optional(),
  barcode: emptyToNull.optional(),
  description: emptyToNull.optional(),
  purchasePrice: positiveNumber.optional(),
  salePrice: positiveNumber.optional(),
  categoryId: uuidOrNull.optional(),
  supplierId: uuidOrNull.optional(),
  imageUrl: emptyToNull.optional(),
  weight: positiveNumber.optional(),
  dimensions: z.record(z.string(), z.number()).optional().nullable(),
  quantity: integer.optional(),
  minStock: integer.optional(),
  status: z.enum(productStatuses).optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  status: z.enum(productStatuses).optional(),
  lowStock: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value ? value === 'true' : undefined)),
});

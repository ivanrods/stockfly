import { z } from 'zod';

const emptyToNull = z
  .union([z.literal(''), z.string().min(1)])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createCategorySchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  description: emptyToNull,
});

export const updateCategorySchema = createCategorySchema.partial();

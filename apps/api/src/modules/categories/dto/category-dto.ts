import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from '../validation/category-validation.js';

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;

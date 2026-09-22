import { z } from 'zod';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validation/product-validation.js';

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
export type ProductQueryDTO = z.infer<typeof productQuerySchema>;

import { z } from 'zod';
import { createSupplierSchema, updateSupplierSchema } from '../validation/supplier-validation.js';

export type CreateSupplierDTO = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDTO = z.infer<typeof updateSupplierSchema>;

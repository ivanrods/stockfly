import { z } from 'zod';
import { createCompanySchema, updateCompanySchema } from '../validation/company-validation';

export type CreateCompanyDTO = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDTO = z.infer<typeof updateCompanySchema>;
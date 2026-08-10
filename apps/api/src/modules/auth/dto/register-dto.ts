import { z } from 'zod';
import { registerSchema } from '../validation/auth-validation';

export type RegisterDTO = z.infer<typeof registerSchema>;

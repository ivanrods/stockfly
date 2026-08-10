import { z } from 'zod';
import { loginSchema } from '../validation/auth-validation';

export type LoginDTO = z.infer<typeof loginSchema>;

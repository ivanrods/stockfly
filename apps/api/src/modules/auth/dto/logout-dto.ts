import { z } from 'zod';
import { refreshTokenSchema } from '../validation/auth-validation.js';

export type LogoutDTO = z.infer<typeof refreshTokenSchema>;

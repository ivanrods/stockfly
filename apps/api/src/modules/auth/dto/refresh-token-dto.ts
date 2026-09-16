import { z } from 'zod';
import { refreshTokenSchema } from '../validation/auth-validation.js';

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

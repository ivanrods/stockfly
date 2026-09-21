import { z } from 'zod';
import { createUserSchema, updateUserRoleSchema } from '../validation/user-validation.js';

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserRoleDTO = z.infer<typeof updateUserRoleSchema>;

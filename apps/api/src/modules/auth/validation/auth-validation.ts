import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email e senha são obrigatórios').email('Formato de e-mail inválido'),
  password: z.string().min(1, 'Email e senha são obrigatórios'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z
    .string()
    .min(1, 'Email, senha e nome são obrigatórios')
    .email('Formato de e-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

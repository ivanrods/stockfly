import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email e senha são obrigatórios').email('Formato de e-mail inválido'),
  password: z.string().min(1, 'Email e senha são obrigatórios'),
});

const emptyToNull = z
  .union([z.literal(''), z.string().min(1)])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const cnpj = z
  .union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido'),
  ])
  .optional()
  .nullable()
  .transform((value) => (value ? value.replace(/\D/g, '') : null));

const companyEmail = z
  .union([z.literal(''), z.string().email('Formato de e-mail inválido')])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const registerSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z
    .string()
    .min(1, 'Email, senha e nome são obrigatórios')
    .email('Formato de e-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  companyName: z.string().min(1, 'O nome da empresa é obrigatório'),
  cnpj,
  companyPhone: emptyToNull,
  companyEmail,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});
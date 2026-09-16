import { Request, Response } from 'express';
import authService from '../services/auth-service.js';
import { LoginDTO } from '../dto/login-dto.js';
import { RegisterDTO } from '../dto/register-dto.js';
import { RefreshTokenDTO } from '../dto/refresh-token-dto.js';
import { LogoutDTO } from '../dto/logout-dto.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validation/auth-validation.js';

class AuthController {
  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const { email, password } = parsed.data as LoginDTO;

    try {
      const result = await authService.login(email, password);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const { email, password, name } = parsed.data as RegisterDTO;

    try {
      const result = await authService.register({ email, password, name });
      return res.status(201).json({ message: 'Usuário criado com sucesso', ...result });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async refresh(req: Request, res: Response) {
    const parsed = refreshTokenSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const { refreshToken } = parsed.data as RefreshTokenDTO;

    try {
      const tokens = await authService.refresh(refreshToken);
      return res.json(tokens);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async logout(req: Request, res: Response) {
    const parsed = refreshTokenSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]!.message });
    }

    const { refreshToken } = parsed.data as LogoutDTO;

    try {
      await authService.logout(refreshToken);
      return res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new AuthController();

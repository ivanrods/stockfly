import authService from '../services/auth-service';
import { LoginDTO } from '../dto/login-dto';
import { RegisterDTO } from '../dto/register-dto';
import { loginSchema, registerSchema } from '../validation/auth-validation';
import { Request, Response } from 'express';

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
      const { user, token } = await authService.register({ email, password, name });
      return res.status(201).json({ message: 'Usuário criado com sucesso', user, token });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new AuthController();

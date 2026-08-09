import authService from '../services/auth-service';
import { RegisterDTO } from '../dto/register-dto';
import { Request, Response } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as RegisterDTO;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Formato de e-mail inválido' });
    }

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
    const { email, password, name } = req.body as RegisterDTO;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, senha e nome são obrigatórios' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Formato de e-mail inválido' });
    }

    if (password.length < passwordMinLength) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 8 caracteres' });
    }

    if (name.length < 1) {
      return res.status(400).json({ message: 'O nome é obrigatório' });
    }

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

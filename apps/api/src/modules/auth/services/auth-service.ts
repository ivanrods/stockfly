import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import jwtConfig from '../../../shared/config/jwt';
import authRepository from '../repository/auth-repository';

class AuthService {
  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);

    if (!user) throw new Error('Usuário não encontrado');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error('Senha inválida');

    const { password: _password, ...userPayload } = user.toJSON();

    const token = jwt.sign({ id: user.id }, jwtConfig.secret!, { expiresIn: jwtConfig.expiresIn });

    return { user: userPayload, token };
  }

  async register({ email, password, name }: { email: string; password: string; name: string }) {
    const existingUser = await authRepository.findByEmail(email);

    if (existingUser) throw new Error('E-mail já está em uso');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await authRepository.create({
      email,
      password: passwordHash,
      name,
    });

    const { password: _password, ...userPayload } = user.toJSON();

    const token = jwt.sign({ id: user.id }, jwtConfig.secret!, { expiresIn: jwtConfig.expiresIn });

    return { user: userPayload, token };
  }
}

export default new AuthService();

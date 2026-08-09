import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../../shared/database/models/user-model';
import jwtConfig from '../../../shared/config/jwt';

class AuthService {
  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });

    if (!user) throw new Error('Usuário não encontrado');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error('Senha inválida');

    const { password: _password, ...userPayload } = user.toJSON();

    const token = jwt.sign(
      { id: user.id },
      jwtConfig.secret!,
      { expiresIn: jwtConfig.expiresIn },
    );

    return { user: userPayload, token };
  }

  async register({ email, password, name }: { email: string; password: string; name: string }) {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) throw new Error('E-mail já está em uso');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: passwordHash,
      name,
    });

    const { password: _password, ...userPayload } = user.toJSON();

    const token = jwt.sign(
      { id: user.id },
      jwtConfig.secret!,
      { expiresIn: jwtConfig.expiresIn },
    );

    return { user: userPayload, token };
  }
}

export default new AuthService();

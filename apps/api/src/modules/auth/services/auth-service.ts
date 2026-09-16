import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import jwtConfig from '../../../shared/config/jwt.js';
import authRepository from '../repository/auth-repository.js';

function parseExpiresIn(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

class AuthService {
  private async generateTokens(userId: string) {
    const accessToken = jwt.sign({ id: userId }, jwtConfig.secret!, {
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + parseExpiresIn(jwtConfig.refreshExpiresIn));

    await authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);

    if (!user) throw new Error('Usuário não encontrado');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error('Senha inválida');

    const { password: _password, ...userPayload } = user.toJSON();

    const tokens = await this.generateTokens(user.id);

    return { user: userPayload, ...tokens };
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

    const tokens = await this.generateTokens(user.id);

    return { user: userPayload, ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await authRepository.findRefreshToken(refreshToken);

    if (!stored) throw new Error('Refresh token inválido');

    if (new Date() > stored.expiresAt) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new Error('Refresh token expirado');
    }

    await authRepository.deleteRefreshToken(refreshToken);

    const tokens = await this.generateTokens(stored.userId);

    return tokens;
  }

  async logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken);
  }
}

export default new AuthService();

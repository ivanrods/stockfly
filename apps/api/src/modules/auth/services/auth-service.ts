import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import jwtConfig from '../../../shared/config/jwt.js';
import authRepository from '../repository/auth-repository.js';
import { UserRole } from '../../../shared/database/models/user-model.js';
import { Company } from '../../../shared/database/models/company-model.js';
import { sequelize } from '../../../shared/config/database.js';
import { RegisterDTO } from '../dto/register-dto.js';

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
  private async generateTokens(user: { id: string; companyId: string | null; role: UserRole }) {
    const accessToken = jwt.sign(
      { id: user.id, companyId: user.companyId, role: user.role },
      jwtConfig.secret!,
      { expiresIn: jwtConfig.expiresIn },
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + parseExpiresIn(jwtConfig.refreshExpiresIn));

    await authRepository.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);

    if (!user) throw new Error('Usuário não encontrado');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error('Senha inválida');

    const company = user.companyId ? await Company.findByPk(user.companyId) : null;

    const { password: _password, ...userPayload } = user.toJSON();

    const tokens = await this.generateTokens(user);

    return { user: userPayload, company: company ? company.toJSON() : null, ...tokens };
  }

  async register({
    email,
    password,
    name,
    companyName,
    cnpj,
    companyPhone,
    companyEmail,
  }: RegisterDTO) {
    const existingUser = await authRepository.findByEmail(email);

    if (existingUser) throw new Error('E-mail já está em uso');

    const passwordHash = await bcrypt.hash(password, 10);

    const { user, company } = await sequelize.transaction(async (transaction) => {
      const createdCompany = await Company.create(
        { name: companyName, cnpj, phone: companyPhone, email: companyEmail },
        { transaction },
      );

      const createdUser = await authRepository.create(
        {
          email,
          password: passwordHash,
          name,
          companyId: createdCompany.id,
          role: 'admin',
        },
        transaction,
      );

      return { user: createdUser, company: createdCompany };
    });

    const { password: _password, ...userPayload } = user.toJSON();

    const tokens = await this.generateTokens(user);

    return { user: userPayload, company: company.toJSON(), ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await authRepository.findRefreshToken(refreshToken);

    if (!stored) throw new Error('Refresh token inválido');

    if (new Date() > stored.expiresAt) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new Error('Refresh token expirado');
    }

    const user = await authRepository.findById(stored.userId);
    if (!user) throw new Error('Usuário não encontrado');

    await authRepository.deleteRefreshToken(refreshToken);

    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken);
  }
}

export default new AuthService();

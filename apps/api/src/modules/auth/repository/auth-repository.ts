import { User } from '../../../shared/database/models/user-model.js';
import { RefreshToken } from '../../../shared/database/models/refresh-token-model.js';
import { UserRole } from '../../../shared/database/models/user-model.js';
import type { Transaction } from 'sequelize';

class AuthRepository {
  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async findById(id: string) {
    return User.findByPk(id);
  }

  async create(
    data: {
      email: string;
      password: string;
      name: string;
      companyId: string;
      role: UserRole;
    },
    transaction?: Transaction,
  ) {
    return User.create(data, transaction ? { transaction } : undefined);
  }

  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }) {
    return RefreshToken.create(data);
  }

  async findRefreshToken(token: string) {
    return RefreshToken.findOne({ where: { token } });
  }

  async deleteRefreshToken(token: string) {
    return RefreshToken.destroy({ where: { token } });
  }

  async deleteRefreshTokensByUserId(userId: string) {
    return RefreshToken.destroy({ where: { userId } });
  }
}

export default new AuthRepository();

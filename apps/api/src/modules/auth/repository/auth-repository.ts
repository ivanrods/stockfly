import { User } from '../../../shared/database/models/user-model.js';
import { RefreshToken } from '../../../shared/database/models/refresh-token-model.js';

class AuthRepository {
  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async create(data: { email: string; password: string; name: string }) {
    return User.create(data);
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

import { User } from '../../../shared/database/models/user-model';

class AuthRepository {
  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async create(data: { email: string; password: string; name: string }) {
    return User.create(data);
  }
}

export default new AuthRepository();

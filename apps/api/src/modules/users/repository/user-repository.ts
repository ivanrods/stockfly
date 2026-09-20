import { User } from '../../../shared/database/models/user-model.js';

class UserRepository {
  async findById(id: string) {
    return User.findByPk(id);
  }
}

export default new UserRepository();
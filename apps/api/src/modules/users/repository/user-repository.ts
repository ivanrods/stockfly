import { User } from '../../../shared/database/models/user-model.js';
import { UserRole } from '../../../shared/database/models/user-model.js';
import { CreateUserDTO } from '../dto/user-dto.js';

class UserRepository {
  async findById(id: string) {
    return User.findByPk(id);
  }

  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  async findByCompany(companyId: string) {
    return User.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']],
    });
  }

  async create(data: CreateUserDTO & { companyId: string }) {
    return User.create(data);
  }

  async updateRole(id: string, role: UserRole) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update({ role });
  }
}

export default new UserRepository();

import { Role } from '../../../shared/database/models/role-model.js';

class RoleRepository {
  async findAll() {
    return Role.findAll({
      order: [['name', 'ASC']],
    });
  }
}

export default new RoleRepository();

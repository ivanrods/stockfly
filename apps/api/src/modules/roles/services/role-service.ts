import roleRepository from '../repository/role-repository.js';

class RoleService {
  async list() {
    return roleRepository.findAll();
  }
}

export default new RoleService();

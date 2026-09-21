import bcrypt from 'bcrypt';
import userRepository from '../repository/user-repository.js';
import { CreateUserDTO } from '../dto/user-dto.js';
import { UserRole } from '../../../shared/database/models/user-model.js';

function toPublicUser(user: { toJSON(): Record<string, unknown> }) {
  const { password: _password, ...publicUser } = user.toJSON();
  return publicUser;
}

class UserService {
  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }

  async listByCompany(companyId: string) {
    const users = await userRepository.findByCompany(companyId);
    return users.map(toPublicUser);
  }

  async create(data: CreateUserDTO & { companyId: string }) {
    const existing = await userRepository.findByEmail(data.email);

    if (existing) throw new Error('E-mail já está em uso');

    const password = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({ ...data, password });

    return toPublicUser(user);
  }

  async updateRole(id: string, companyId: string, role: UserRole, actorId: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');

    if (user.companyId !== companyId) {
      throw new Error('Usuário não pertence à sua empresa');
    }

    if (user.id === actorId) {
      throw new Error('Você não pode alterar o próprio papel');
    }

    const updated = await userRepository.updateRole(id, role);
    if (!updated) throw new Error('Usuário não encontrado');

    return toPublicUser(updated);
  }
}

export default new UserService();

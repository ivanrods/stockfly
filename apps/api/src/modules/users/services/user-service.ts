import userRepository from '../repository/user-repository.js';

class UserService {
  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }
}

export default new UserService();
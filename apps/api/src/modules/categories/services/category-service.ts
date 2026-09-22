import categoryRepository from '../repository/category-repository.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dto/category-dto.js';

class CategoryService {
  async list(companyId: string) {
    return categoryRepository.findAllByCompany(companyId);
  }

  async getById(companyId: string, id: string) {
    const category = await categoryRepository.findById(companyId, id);
    if (!category) throw new Error('Categoria não encontrada');
    return category;
  }

  async create(companyId: string, data: CreateCategoryDTO) {
    return categoryRepository.create(companyId, data);
  }

  async update(companyId: string, id: string, data: UpdateCategoryDTO) {
    const category = await categoryRepository.update(companyId, id, data);
    if (!category) throw new Error('Categoria não encontrada');
    return category;
  }

  async remove(companyId: string, id: string) {
    const category = await categoryRepository.softDelete(companyId, id);
    if (!category) throw new Error('Categoria não encontrada');
    return category;
  }
}

export default new CategoryService();
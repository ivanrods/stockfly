import { Category } from '../../../shared/database/models/category-model.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dto/category-dto.js';

class CategoryRepository {
  async findAllByCompany(companyId: string) {
    return Category.findAll({
      where: { companyId },
      order: [['name', 'ASC']],
    });
  }

  async findById(companyId: string, id: string) {
    return Category.findOne({ where: { companyId, id } });
  }

  async create(companyId: string, data: CreateCategoryDTO) {
    return Category.create({ ...data, companyId });
  }

  async update(companyId: string, id: string, data: UpdateCategoryDTO) {
    const category = await Category.findOne({ where: { companyId, id } });
    if (!category) return null;
    return category.update(data);
  }

  async softDelete(companyId: string, id: string) {
    const category = await Category.findOne({ where: { companyId, id } });
    if (!category) return null;
    await category.destroy();
    return category;
  }
}

export default new CategoryRepository();

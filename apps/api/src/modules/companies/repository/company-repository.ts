import { Company } from '../../../shared/database/models/company-model.js';
import { CreateCompanyDTO, UpdateCompanyDTO } from '../dto/company-dto.js';

class CompanyRepository {
  async findById(id: string) {
    return Company.findByPk(id);
  }

  async create(data: CreateCompanyDTO) {
    return Company.create(data);
  }

  async update(id: string, data: UpdateCompanyDTO) {
    const company = await Company.findByPk(id);
    if (!company) return null;
    return company.update(data);
  }

  async inactivate(id: string) {
    const company = await Company.findByPk(id);
    if (!company) return null;
    return company.update({ status: 'inactive' });
  }
}

export default new CompanyRepository();
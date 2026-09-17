import companyRepository from '../repository/company-repository.js';
import { CreateCompanyDTO, UpdateCompanyDTO } from '../dto/company-dto.js';

class CompanyService {
  async getById(id: string) {
    const company = await companyRepository.findById(id);
    if (!company) throw new Error('Empresa não encontrada');
    return company;
  }

  async create(data: CreateCompanyDTO) {
    return companyRepository.create(data);
  }

  async update(id: string, data: UpdateCompanyDTO) {
    const company = await companyRepository.update(id, data);
    if (!company) throw new Error('Empresa não encontrada');
    return company;
  }

  async inactivate(id: string) {
    const company = await companyRepository.inactivate(id);
    if (!company) throw new Error('Empresa não encontrada');
    return company;
  }
}

export default new CompanyService();
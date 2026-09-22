import supplierRepository from '../repository/supplier-repository.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../dto/supplier-dto.js';

class SupplierService {
  async list(companyId: string) {
    return supplierRepository.findAllByCompany(companyId);
  }

  async getById(companyId: string, id: string) {
    const supplier = await supplierRepository.findById(companyId, id);
    if (!supplier) throw new Error('Fornecedor não encontrado');
    return supplier;
  }

  async create(companyId: string, data: CreateSupplierDTO) {
    return supplierRepository.create(companyId, data);
  }

  async update(companyId: string, id: string, data: UpdateSupplierDTO) {
    const supplier = await supplierRepository.update(companyId, id, data);
    if (!supplier) throw new Error('Fornecedor não encontrado');
    return supplier;
  }

  async remove(companyId: string, id: string) {
    const supplier = await supplierRepository.softDelete(companyId, id);
    if (!supplier) throw new Error('Fornecedor não encontrado');
    return supplier;
  }
}

export default new SupplierService();
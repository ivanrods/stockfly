import { Supplier } from '../../../shared/database/models/supplier-model.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../dto/supplier-dto.js';

class SupplierRepository {
  async findAllByCompany(companyId: string) {
    return Supplier.findAll({
      where: { companyId },
      order: [['name', 'ASC']],
    });
  }

  async findById(companyId: string, id: string) {
    return Supplier.findOne({ where: { companyId, id } });
  }

  async create(companyId: string, data: CreateSupplierDTO) {
    return Supplier.create({ ...data, companyId });
  }

  async update(companyId: string, id: string, data: UpdateSupplierDTO) {
    const supplier = await Supplier.findOne({ where: { companyId, id } });
    if (!supplier) return null;
    return supplier.update(data);
  }

  async softDelete(companyId: string, id: string) {
    const supplier = await Supplier.findOne({ where: { companyId, id } });
    if (!supplier) return null;
    await supplier.destroy();
    return supplier;
  }
}

export default new SupplierRepository();
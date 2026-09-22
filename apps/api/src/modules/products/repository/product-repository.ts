import { Op, WhereOptions } from 'sequelize';
import { sequelize } from '../../../shared/config/database.js';
import { Product } from '../../../shared/database/models/product-model.js';
import { Category } from '../../../shared/database/models/category-model.js';
import { Supplier } from '../../../shared/database/models/supplier-model.js';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryDTO,
} from '../dto/product-dto.js';

type ProductListFilters = ProductQueryDTO & { companyId: string };

class ProductRepository {
  async findAll(filters: ProductListFilters) {
    const { companyId, page, limit, q, categoryId, supplierId, status, lowStock } = filters;

    const where: Record<PropertyKey, unknown> = { companyId };

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { sku: { [Op.iLike]: `%${q}%` } },
        { barcode: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (lowStock) {
      where[Op.and] = sequelize.literal('"Product"."quantity" <= "Product"."min_stock"');
    }

    return Product.findAndCountAll({
      where: where as WhereOptions,
      offset: (page - 1) * limit,
      limit,
      order: [['name', 'ASC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      ],
      distinct: true,
    });
  }

  async findById(companyId: string, id: string) {
    return Product.findOne({
      where: { companyId, id },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      ],
    });
  }

  async create(companyId: string, data: CreateProductDTO) {
    return Product.create({ ...data, companyId });
  }

  async update(companyId: string, id: string, data: UpdateProductDTO) {
    const product = await Product.findOne({ where: { companyId, id } });
    if (!product) return null;
    return product.update(data);
  }

  async softDelete(companyId: string, id: string) {
    const product = await Product.findOne({ where: { companyId, id } });
    if (!product) return null;
    await product.destroy();
    return product;
  }
}

export default new ProductRepository();
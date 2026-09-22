import productRepository from '../repository/product-repository.js';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductQueryDTO,
} from '../dto/product-dto.js';

class ProductService {
  async list(companyId: string, query: ProductQueryDTO) {
    const { page, limit } = query;
    const { rows, count } = await productRepository.findAll({ companyId, ...query });
    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getById(companyId: string, id: string) {
    const product = await productRepository.findById(companyId, id);
    if (!product) throw new Error('Produto não encontrado');
    return product;
  }

  async create(companyId: string, data: CreateProductDTO) {
    return productRepository.create(companyId, data);
  }

  async update(companyId: string, id: string, data: UpdateProductDTO) {
    const product = await productRepository.update(companyId, id, data);
    if (!product) throw new Error('Produto não encontrado');
    return product;
  }

  async remove(companyId: string, id: string) {
    const product = await productRepository.softDelete(companyId, id);
    if (!product) throw new Error('Produto não encontrado');
    return product;
  }
}

export default new ProductService();
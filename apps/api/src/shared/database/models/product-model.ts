import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Company } from './company-model.js';
import { Category } from './category-model.js';
import { Supplier } from './supplier-model.js';

export type ProductStatus = 'active' | 'inactive';

class BaseModel extends Model {}

class Product extends BaseModel {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare sku: string | null;
  declare barcode: string | null;
  declare description: string | null;
  declare purchasePrice: number | null;
  declare salePrice: number | null;
  declare quantity: number;
  declare minStock: number;
  declare categoryId: string | null;
  declare supplierId: string | null;
  declare imageUrl: string | null;
  declare weight: number | null;
  declare dimensions: Record<string, number> | null;
  declare status: ProductStatus;
  declare deletedAt: Date | null;
}

Product.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: true },
    barcode: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'purchase_price' },
    salePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'sale_price' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    minStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'min_stock' },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: { model: 'Category', key: 'id' },
      onDelete: 'SET NULL',
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'supplier_id',
      references: { model: 'Supplier', key: 'id' },
      onDelete: 'SET NULL',
    },
    imageUrl: { type: DataTypes.STRING, allowNull: true, field: 'image_url' },
    weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    dimensions: { type: DataTypes.JSON, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  },
  {
    sequelize,
    modelName: 'Product',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

Product.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Product, { foreignKey: 'company_id', as: 'products' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products' });

Category.beforeDestroy(async (category) => {
  await Product.update({ categoryId: null }, { where: { categoryId: category.id } });
});

Supplier.beforeDestroy(async (supplier) => {
  await Product.update({ supplierId: null }, { where: { supplierId: supplier.id } });
});

export { BaseModel, Product };

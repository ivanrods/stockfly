import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Company } from './company-model.js';

class BaseModel extends Model {}

class Category extends BaseModel {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare description: string | null;
  declare deletedAt: Date | null;
}

Category.init(
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
    description: { type: DataTypes.STRING, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  },
  {
    sequelize,
    modelName: 'Category',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

Category.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Category, { foreignKey: 'company_id', as: 'categories' });

export { BaseModel, Category };

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Company } from './company-model.js';

class BaseModel extends Model {}

class Supplier extends BaseModel {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare contactName: string | null;
  declare phone: string | null;
  declare email: string | null;
  declare cnpj: string | null;
  declare street: string | null;
  declare number: string | null;
  declare complement: string | null;
  declare neighborhood: string | null;
  declare city: string | null;
  declare state: string | null;
  declare zipCode: string | null;
  declare deletedAt: Date | null;
}

Supplier.init(
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
    contactName: { type: DataTypes.STRING, allowNull: true, field: 'contact_name' },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    cnpj: { type: DataTypes.STRING, allowNull: true },
    street: { type: DataTypes.STRING, allowNull: true },
    number: { type: DataTypes.STRING, allowNull: true },
    complement: { type: DataTypes.STRING, allowNull: true },
    neighborhood: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING(2), allowNull: true },
    zipCode: { type: DataTypes.STRING, allowNull: true, field: 'zip_code' },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  },
  {
    sequelize,
    modelName: 'Supplier',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

Supplier.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Supplier, { foreignKey: 'company_id', as: 'suppliers' });

export { BaseModel, Supplier };
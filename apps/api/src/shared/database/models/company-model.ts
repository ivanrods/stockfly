import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type CompanyStatus = 'active' | 'inactive';

class BaseModel extends Model {}

class Company extends BaseModel {
  declare id: string;
  declare name: string;
  declare cnpj: string | null;
  declare phone: string | null;
  declare email: string | null;
  declare status: CompanyStatus;
  declare street: string | null;
  declare number: string | null;
  declare complement: string | null;
  declare neighborhood: string | null;
  declare city: string | null;
  declare state: string | null;
  declare zipCode: string | null;
}

Company.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    cnpj: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    street: { type: DataTypes.STRING, allowNull: true },
    number: { type: DataTypes.STRING, allowNull: true },
    complement: { type: DataTypes.STRING, allowNull: true },
    neighborhood: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING(2), allowNull: true },
    zipCode: { type: DataTypes.STRING, allowNull: true, field: 'zip_code' },
  },
  {
    sequelize,
    modelName: 'Company',
    freezeTableName: true,
    timestamps: true,
  },
);

export { BaseModel, Company };
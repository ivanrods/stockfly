import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Company } from './company-model.js';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

class BaseModel extends Model {}

class User extends BaseModel {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare companyId: string | null;
  declare role: UserRole;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id',
      references: { model: 'Company', key: 'id' },
      onDelete: 'SET NULL',
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'operator', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    },
  },
  {
    sequelize,
    modelName: 'User',
    freezeTableName: true,
    timestamps: true,
  },
);

User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

export { BaseModel, User };

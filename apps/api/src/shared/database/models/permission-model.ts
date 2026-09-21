import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

class BaseModel extends Model {}

class Permission extends BaseModel {
  declare id: string;
  declare name: string;
  declare description: string | null;
}

Permission.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Permission',
    freezeTableName: true,
    timestamps: true,
  },
);

export { BaseModel, Permission };

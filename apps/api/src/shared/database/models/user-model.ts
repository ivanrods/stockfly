import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

class BaseModel extends Model {}

class User extends BaseModel {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'User',
    freezeTableName: true,
    timestamps: true,
  },
);

export { BaseModel, User };
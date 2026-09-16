import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from './user-model.js';

class RefreshToken extends Model {
  declare id: string;
  declare token: string;
  declare userId: string;
  declare expiresAt: Date;
}

RefreshToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'RefreshToken',
    freezeTableName: true,
    timestamps: true,
  },
);

RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });

export { RefreshToken };

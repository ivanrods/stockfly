import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

class RolePermission extends Model {
  declare roleId: string;
  declare permissionId: string;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'role_id',
      references: { model: 'Role', key: 'id' },
      onDelete: 'CASCADE',
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'permission_id',
      references: { model: 'Permission', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'RolePermission',
    freezeTableName: true,
    timestamps: false,
  },
);

export { RolePermission };

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Permission } from './permission-model.js';
import { RolePermission } from './role-permission-model.js';

export type RoleName = 'admin' | 'manager' | 'operator' | 'viewer';

class BaseModel extends Model {}

class Role extends BaseModel {
  declare id: string;
  declare name: RoleName;
  declare description: string | null;
  declare permissions?: Permission[];
}

Role.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: {
      type: DataTypes.ENUM('admin', 'manager', 'operator', 'viewer'),
      allowNull: false,
      unique: true,
    },
    description: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Role',
    freezeTableName: true,
    timestamps: true,
  },
);

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

export { BaseModel, Role };

import { sequelize } from '../config/database.js';
import { Permission } from './models/permission-model.js';
import { Role } from './models/role-model.js';
import { RolePermission } from './models/role-permission-model.js';
import type { RoleName } from './models/role-model.js';

export const PERMISSIONS = [
  { name: 'company:read', description: 'Visualizar dados da empresa' },
  { name: 'company:update', description: 'Editar dados da empresa' },
  { name: 'users:read', description: 'Listar usuários da empresa' },
  { name: 'users:create', description: 'Criar usuários na empresa' },
  { name: 'users:update', description: 'Alterar papéis de usuários' },
  { name: 'products:read', description: 'Visualizar produtos' },
  { name: 'products:create', description: 'Criar produtos' },
  { name: 'products:update', description: 'Editar produtos' },
  { name: 'products:delete', description: 'Remover produtos' },
  { name: 'categories:read', description: 'Visualizar categorias' },
  { name: 'categories:create', description: 'Criar categorias' },
  { name: 'categories:update', description: 'Editar categorias' },
  { name: 'categories:delete', description: 'Remover categorias' },
  { name: 'suppliers:read', description: 'Visualizar fornecedores' },
  { name: 'suppliers:create', description: 'Criar fornecedores' },
  { name: 'suppliers:update', description: 'Editar fornecedores' },
  { name: 'suppliers:delete', description: 'Remover fornecedores' },
  { name: 'customers:read', description: 'Visualizar clientes' },
  { name: 'customers:create', description: 'Criar clientes' },
  { name: 'customers:update', description: 'Editar clientes' },
  { name: 'customers:delete', description: 'Remover clientes' },
  { name: 'stock:read', description: 'Visualizar estoque' },
  { name: 'stock:create', description: 'Registrar entrada/saída de estoque' },
  { name: 'dashboard:read', description: 'Visualizar dashboard' },
  { name: 'reports:read', description: 'Visualizar relatórios' },
] as const;

export const ROLE_PERMISSIONS: Record<RoleName, readonly string[]> = {
  admin: PERMISSIONS.map((permission) => permission.name),
  manager: PERMISSIONS.filter((permission) => permission.name !== 'company:update').map(
    (permission) => permission.name,
  ),
  operator: [
    'company:read',
    'users:read',
    'products:read',
    'products:create',
    'products:update',
    'categories:read',
    'categories:create',
    'categories:update',
    'suppliers:read',
    'suppliers:create',
    'suppliers:update',
    'customers:read',
    'customers:create',
    'customers:update',
    'stock:read',
    'stock:create',
    'dashboard:read',
  ],
  viewer: [
    'company:read',
    'users:read',
    'products:read',
    'categories:read',
    'suppliers:read',
    'customers:read',
    'stock:read',
    'dashboard:read',
  ],
};

export const DEFAULT_ROLES = [
  { name: 'admin', description: 'Acesso total' },
  { name: 'manager', description: 'Gerencia operações da empresa' },
  { name: 'operator', description: 'Opera o dia a dia do estoque' },
  { name: 'viewer', description: 'Apenas visualização' },
] as const;

export async function seedRbac() {
  await sequelize.transaction(async (transaction) => {
    await Permission.bulkCreate(PERMISSIONS, {
      transaction,
      ignoreDuplicates: true,
    });

    await Role.bulkCreate(DEFAULT_ROLES, {
      transaction,
      ignoreDuplicates: true,
    });

    const roles = await Role.findAll({ transaction });
    const permissions = await Permission.findAll({ transaction });

    const rolesByName = new Map(roles.map((role) => [role.name, role.id]));
    const permissionsByName = new Map(
      permissions.map((permission) => [permission.name, permission.id]),
    );

    const joins: { roleId: string; permissionId: string }[] = [];

    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS) as [
      RoleName,
      readonly string[],
    ][]) {
      const roleId = rolesByName.get(roleName);
      if (!roleId) continue;

      for (const permissionName of permissionNames) {
        const permissionId = permissionsByName.get(permissionName);
        if (!permissionId) continue;
        joins.push({ roleId, permissionId });
      }
    }

    await RolePermission.bulkCreate(joins, {
      transaction,
      ignoreDuplicates: true,
    });
  });
}

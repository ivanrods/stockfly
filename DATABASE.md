# Database — StockFly

> Documentação do banco de dados. Mantenha este arquivo atualizado sempre que criar/alterar tabelas.

---

## Visão Geral

| Item       | Detalhe                                                           |
| ---------- | ----------------------------------------------------------------- |
| Banco      | PostgreSQL 17                                                     |
| ORM        | Sequelize 6                                                       |
| Dialeto    | postgres                                                          |
| Migrations | Sequelize CLI (`src/shared/database/migrations/`)                 |
| Models     | `src/shared/database/models/`                                     |
| Connection | Singleton em `src/shared/config/database.ts` (usa `DATABASE_URL`) |

**Convenções:**

- PK sempre `UUID` (`DataTypes.UUID`, `defaultValue: DataTypes.UUIDV4`)
- `timestamps: true` (gera `createdAt`, `updatedAt`)
- Tabelas com nome exato do model (`freezeTableName: true`)
- Models definidos com `Model.init()`
- Migrations criadas via `npm run db:create-migration -- <nome>` (em `apps/api/`)
- `sequelize.sync({ alter: true })` apenas em dev, nunca em produção

---

## Schema Atual

> Implementado e migrado.

### `Company`

Representa uma empresa (tenant). Todos os dados de negócio pertencem a uma empresa.

| Coluna         | Tipo      | Restrições                                      |
| -------------- | --------- | ----------------------------------------------- |
| `id`           | UUID      | PK, default UUIDV4                              |
| `name`         | STRING    | NOT NULL                                        |
| `cnpj`         | STRING    | NULL                                            |
| `phone`        | STRING    | NULL                                            |
| `email`        | STRING    | NULL                                            |
| `status`       | ENUM      | `active`/`inactive`, NOT NULL, default `active` |
| `street`       | STRING    | NULL                                            |
| `number`       | STRING    | NULL                                            |
| `complement`   | STRING    | NULL                                            |
| `neighborhood` | STRING    | NULL                                            |
| `city`         | STRING    | NULL                                            |
| `state`        | STRING(2) | NULL (UF)                                       |
| `zipCode`      | STRING    | NULL (`zip_code`)                               |
| `createdAt`    | DATE      | NOT NULL                                        |
| `updatedAt`    | DATE      | NOT NULL                                        |

**Model:** `src/shared/database/models/company-model.ts`
**Migration:** `20260917132928-create-company.js`

```typescript
class Company extends Model {
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
```

---

### `User`

Representa usuários do sistema. Cada usuário pertence a uma empresa (`companyId` pode ser `NULL` enquanto o user não tem tenant). O papel (`role`) controla o RBAC básico.

| Coluna      | Tipo   | Restrições                                                        |
| ----------- | ------ | ----------------------------------------------------------------- |
| `id`        | UUID   | PK, default UUIDV4                                                |
| `name`      | STRING | NOT NULL                                                          |
| `email`     | STRING | NOT NULL, UNIQUE                                                  |
| `password`  | STRING | NOT NULL (hash bcrypt)                                            |
| `companyId` | UUID   | NULL, FK → `Company.id`, `onDelete: SET NULL` (`company_id`)      |
| `role`      | ENUM   | `admin`/`manager`/`operator`/`viewer`, NOT NULL, default `viewer` |
| `createdAt` | DATE   | NOT NULL                                                          |
| `updatedAt` | DATE   | NOT NULL                                                          |

**Relações:** `User.belongsTo(Company)` (alias `company`); `Company.hasMany(User)` (alias `users`).

**Model:** `src/shared/database/models/user-model.ts`
**Migrations:** `20260806132859-create-user.js`, `20260917132931-add-company-to-user.js`

```typescript
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

class User extends Model {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare companyId: string | null;
  declare role: UserRole;
}
```

---

### `RefreshToken`

Armazena refresh tokens para renovação do access token.

| Coluna      | Tipo | Restrições                           |
| ----------- | ---- | ------------------------------------ |
| `id`        | UUID | PK, default UUIDV4                   |
| `token`     | TEXT | NOT NULL, UNIQUE                     |
| `userId`    | UUID | NOT NULL, FK → `User.id` (`user_id`) |
| `expiresAt` | DATE | NOT NULL (`expires_at`)              |
| `createdAt` | DATE | NOT NULL                             |
| `updatedAt` | DATE | NOT NULL                             |

**Model:** `src/shared/database/models/refresh-token-model.ts`
**Migration:** `20260916131127-create-refresh-token.js`

```typescript
class RefreshToken extends Model {
  declare id: string;
  declare token: string;
  declare userId: string;
  declare expiresAt: Date;
}
```

---

### `Role`

Catálogo global de papéis padrão (`User.role` referencia o `name`). Cada papel define sua matriz de permissões via `RolePermission`.

| Coluna        | Tipo   | Restrições                                              |
| ------------- | ------ | ------------------------------------------------------- |
| `id`          | UUID   | PK, default UUIDV4                                      |
| `name`        | ENUM   | `admin`/`manager`/`operator`/`viewer`, NOT NULL, UNIQUE |
| `description` | STRING | NULL                                                    |
| `createdAt`   | DATE   | NOT NULL                                                |
| `updatedAt`   | DATE   | NOT NULL                                                |

**Relações:** N:N com `Permission` via `RolePermission` (alias `permissions`).

**Model:** `src/shared/database/models/role-model.ts`
**Migration:** `20260921090000-create-role-permission.js`
**Seed:** `src/shared/database/seed-rbac.ts` (`seedRbac()`, roda no bootstrap e nos testes)

```typescript
type RoleName = 'admin' | 'manager' | 'operator' | 'viewer';

class Role extends Model {
  declare id: string;
  declare name: RoleName;
  declare description: string | null;
  declare permissions?: Permission[];
}
```

---

### `Permission`

Catálogo global de permissões (chaves namespaced, ex: `products:read`, `stock:create`, `users:update`).

| Coluna        | Tipo   | Restrições         |
| ------------- | ------ | ------------------ |
| `id`          | UUID   | PK, default UUIDV4 |
| `name`        | STRING | NOT NULL, UNIQUE   |
| `description` | STRING | NULL               |
| `createdAt`   | DATE   | NOT NULL           |
| `updatedAt`   | DATE   | NOT NULL           |

**Relações:** N:N com `Role` via `RolePermission` (alias `roles`).

**Model:** `src/shared/database/models/permission-model.ts`
**Migration:** `20260921090000-create-role-permission.js`

```typescript
class Permission extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
}
```

---

### `RolePermission`

Tabela de junção `Role` × `Permission` (matriz de permissões de cada papel). PK composta `(role_id, permission_id)`.

| Coluna          | Tipo | Restrições                                 |
| --------------- | ---- | ------------------------------------------ |
| `role_id`       | UUID | PK composta, FK → `Role.id`, CASCADE       |
| `permission_id` | UUID | PK composta, FK → `Permission.id`, CASCADE |

**Model:** `src/shared/database/models/role-permission-model.ts`
**Migration:** `20260921090000-create-role-permission.js`

> **Nota:** o middleware `requirePermission()` resolve o papel do JWT (`req.role`) na tabela `Role`, carrega as `permissions` e verifica se a permissão requerida está na lista. Papéis são globais (Iguais para todas as empresas); papéis customizados por tenant ficam para o futuro (`Role.company_id` nullable).

---

## Schema Planejado

> Ainda não implementado. Consulte `ROADMAP.md` para prioridade e ordem de implementação.

### Modelagem alvo

```
Company ──┬── User ──── Role ──── Permission
          │── Category
          ├── Supplier
          ├── Product ── Stock ── StockMovement
          ├── Customer ── Sale ── SaleItem
          ├── Purchase ── PurchaseItem
          ├── RefreshToken
          └── AuditLog
```

### Tabelas alvo (resumo)

| Tabela          | Campos principais                                                                                                              | Relações                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `Company`       | ✅ nome, CNPJ, status, endereço                                                                                                | 1:N com Users, Products, Categories, Suppliers, Customers, Stock |
| `User`          | ✅ name, email, password (+ `company_id`, `role`)                                                                              | N:1 Company, N:1 Role (através do `role` enum)                   |
| `Role`          | ✅ nome, descrição, permissões (matriz em `RolePermission`)                                                                    | 1:N Users, N:N Permissions                                       |
| `Permission`    | ✅ chave (ex: `stock.create`, `users:read`), descrição                                                                         | N:N Roles                                                        |
| `RefreshToken`  | ✅ token, user, expiração                                                                                                      | N:1 User                                                         |
| `Category`      | nome                                                                                                                           | 1:N Products                                                     |
| `Supplier`      | nome, telefone, email, endereço, CNPJ, contato                                                                                 | 1:N Products                                                     |
| `Product`       | nome, SKU, código de barras, descrição, preço compra, preço venda, quantidade, estoque mínimo, imagem, peso, dimensões, status | N:1 Category, N:1 Supplier, 1:N StockMovement                    |
| `StockMovement` | tipo (entrada/saída), quantidade, motivo, valor unitário, nota, data, responsável                                              | N:1 Product, N:1 User (responsável)                              |
| `Customer`      | nome, telefone, email, endereço, CPF/CNPJ                                                                                      | 1:N Sale                                                         |
| `Sale`          | total, data, cliente                                                                                                           | N:1 Customer, 1:N SaleItem                                       |
| `SaleItem`      | produto, quantidade, preço                                                                                                     | N:1 Sale, N:1 Product                                            |
| `Purchase`      | fornecedor, valor, número da nota, data                                                                                        | N:1 Supplier, 1:N PurchaseItem                                   |
| `PurchaseItem`  | produto, quantidade, valor unitário                                                                                            | N:1 Purchase, N:1 Product                                        |
| `AuditLog`      | user, action, entity, entity_id, dados                                                                                         | N:1 User                                                         |

> ✅ = já implementado.

---

## Regras de Negócio do Banco

1. **Todo dado de negócio tem `company_id`** (FK para `Company`) — nenhuma empresa vê dados da outra.
2. **Nunca alterar estoque diretamente.** Toda entrada/saída cria um `StockMovement` e o update do `Product.stock` deve ser feito em transação (atômico).
3. **Toda alteração sensível gera `AuditLog`** (criação, edição, exclusão de módulos principais).
4. **Senhas são sempre hash bcrypt** (nunca em texto puro) e nunca retornadas em respostas.
5. **RefreshToken** tem expiração e pode ser revogado no logout.
6. **Soft delete** para dados de catálogo (Products, Categories, Suppliers, Customers).

---

## Ciclo de Vida ao Adicionar Tabela

1. Criar model em `src/shared/database/models/<nome>-model.ts`
2. Criar migration: `npm run db:create-migration -- <nome>` (em `apps/api/`)
3. Executar migration: `npm run db:migrate` (via docker)
4. Atualizar este arquivo (`DATABASE.md`)
5. Atualizar `ROADMAP.md` (marcar `[x]`)

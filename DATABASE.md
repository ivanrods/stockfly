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

### `User`

Representa usuários do sistema. **Não pertence a nenhuma empresa ainda** (multi-tenant será adicionado depois).

| Coluna      | Tipo   | Restrições             |
| ----------- | ------ | ---------------------- |
| `id`        | UUID   | PK, default UUIDV4     |
| `name`      | STRING | NOT NULL               |
| `email`     | STRING | NOT NULL, UNIQUE       |
| `password`  | STRING | NOT NULL (hash bcrypt) |
| `createdAt` | DATE   | NOT NULL               |
| `updatedAt` | DATE   | NOT NULL               |

**Model:** `src/shared/database/models/user-model.ts`
**Migration:** `20260806132859-create-user.js`

```typescript
class User extends Model {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
}
```

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
| `Company`       | nome, CNPJ, status, endereço                                                                                                   | 1:N com Users, Products, Categories, Suppliers, Customers, Stock |
| `User`          | name, email, password (+ `company_id`)                                                                                         | N:1 Company, N:1 Role                                            |
| `Role`          | nome, permissões                                                                                                               | 1:N Users, N:N Permissions                                       |
| `Permission`    | chave (ex: `stock.create`)                                                                                                     | N:N Roles                                                        |
| `RefreshToken`  | token, user, expiração                                                                                                         | N:1 User                                                         |
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

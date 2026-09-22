# API — StockFly

> Documentação dos endpoints REST. Mantenha este arquivo atualizado ao adicionar/alterar rotas.

---

## Visão Geral

| Item             | Detalhe                                              |
| ---------------- | ---------------------------------------------------- |
| Base URL         | `http://localhost:3333` (API em Docker)              |
| Formato          | JSON                                                 |
| Autenticação     | JWT via header `Authorization: Bearer <token>`       |
| Validação        | Zod (schemas em `src/modules/<feature>/validation/`) |
| Resposta de erro | `{ "message": string }`                              |
| Erro não tratado | `500 { "message": "Erro interno do servidor" }`      |

**Estrutura das rotas:** `src/app.ts` registra os módulos em prefixos (`/auth`, `/companies`, etc.). Cada módulo expõe seu `Router` em `src/modules/<feature>/routes/`.

**Regra:** rotas protegidas passam pelo middleware `authMiddleware` de `src/shared/middlewares/auth-middleware.ts`. Ele valida o JWT e injeta no `req`: `user`, `companyId` e `role` (`admin`/`manager`/`operator`/`viewer`) extraídos do token.

Autorização adicional por rotas:

- `requireRole('admin', ...)` — exige que o `role` do JWT esteja na lista (`src/shared/middlewares/require-role.ts`)
- `requirePermission('users:read', ...)` — exige que o papel do usuário tenha pelo menos uma das permissões (lê a matriz `Role`→`Permission` do banco, `src/shared/middlewares/require-permission.ts`)

```typescript
import { authMiddleware } from '../shared/middlewares/auth-middleware';
import { requireRole } from '../shared/middlewares/require-role';
import { requirePermission } from '../shared/middlewares/require-permission';

router.get('/me', authMiddleware, companyController.getMine.bind(companyController));
router.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  companyController.update.bind(companyController),
);
router.get(
  '/',
  authMiddleware,
  requirePermission('users:read'),
  userController.list.bind(userController),
);
```

**Multi-tenant:** o JWT carrega `id`, `companyId` e `role`. Módulos de negócio devem escopar consultas e autorizações pelo `req.companyId`.

---

## Endpoints Atuais

### `GET /health`

> Público. Verifica se a API está de pé.

**Resposta 200:**

```json
{ "status": "ok" }
```

---

### `POST /auth/register`

> Público. Cria uma nova empresa (Company) junto com o usuário administrador (role `admin`) numa transação e retorna os tokens.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "minhasenha123",
  "companyName": "Empresa LTDA",
  "cnpj": "12.345.678/0001-90",
  "companyPhone": "(11) 99999-0000",
  "companyEmail": "contato@empresa.com"
}
```

| Campo          | Regras                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| `name`         | obrigatório, min 1                                                                 |
| `email`        | obrigatório, formato válido                                                        |
| `password`     | obrigatório, min 8 caracteres                                                      |
| `companyName`  | obrigatório, min 1 — nome da empresa criada                                        |
| `cnpj`         | opcional, vazio → `null`; máscara `XX.XXX.XXX/XXXX-XX` ou 14 dígitos (normalizado) |
| `companyPhone` | opcional, vazio → `null`                                                           |
| `companyEmail` | opcional, formato válido, vazio → `null`                                           |

**Resposta 201:**

```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "companyId": "uuid",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "company": {
    "id": "uuid",
    "name": "Empresa LTDA",
    "cnpj": "12345678000190",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "hex..."
}
```

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 400    | Validação Zod falhou ou e-mail já em uso |

---

### `POST /auth/login`

> Público. Autentica o usuário e retorna tokens + empresa vinculada.

**Body:**

```json
{
  "email": "joao@example.com",
  "password": "minhasenha123"
}
```

**Resposta 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "companyId": "uuid",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "company": {
    "id": "uuid",
    "name": "Empresa LTDA",
    "status": "active"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "hex..."
}
```

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 400    | Validação Zod falhou                     |
| 401    | Usuário não encontrado ou senha inválida |

> O `accessToken` é um JWT com `{ id, companyId, role }`. O `company` pode ser `null` se o usuário não tiver empresa.

---

### `POST /auth/refresh`

> Público. Troca um refresh token válido por um novo par de tokens (o antigo é revogado).

**Body:**

```json
{ "refreshToken": "hex..." }
```

**Resposta 200:**

```json
{ "accessToken": "eyJhbGciOi...", "refreshToken": "hex..." }
```

**Erros:**

| Status | Quando                                  |
| ------ | --------------------------------------- |
| 400    | Sem `refreshToken` no body              |
| 401    | Token inválido, expirado ou reutilizado |

---

### `POST /auth/logout`

> Público. Revoga o refresh token informado.

**Body:**

```json
{ "refreshToken": "hex..." }
```

**Resposta 200:**

```json
{ "message": "Logout realizado com sucesso" }
```

| Status | Quando                     |
| ------ | -------------------------- |
| 400    | Sem `refreshToken` no body |

---

### `GET /companies/me`

> Protegido (`authMiddleware`). Retorna a empresa do usuário autenticado, identificada pelo `companyId` do JWT.

**Resposta 200:**

```json
{
  "id": "uuid",
  "name": "Empresa LTDA",
  "cnpj": "12345678000190",
  "status": "active",
  "phone": null,
  "email": null,
  "street": null,
  "number": null,
  "complement": null,
  "neighborhood": null,
  "city": null,
  "state": null,
  "zipCode": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Erros:**

| Status | Quando                                             |
| ------ | -------------------------------------------------- |
| 401    | Token ausente ou inválido                          |
| 404    | Sem `companyId` no token ou empresa não encontrada |

---

### `PUT /companies/:id`

> Protegido (`authMiddleware`). Atualiza a empresa. Exige que `:id` seja o `companyId` do JWT e que o usuário seja `admin`.

**Body (parcial, campos opcionais):**

```json
{ "phone": "(11) 99999-0000", "city": "São Paulo", "state": "sp" }
```

Regras dos campos: iguais às validações do schema da empresa (CNPJ/máscara normalizado, `state` com 2 letras normalizado para maiúsculas, vazios → `null`).

**Resposta 200:** empresa atualizada (mesmo formato de `GET /companies/me`).

**Erros:**

| Status | Quando                                                                   |
| ------ | ------------------------------------------------------------------------ |
| 401    | Token ausente ou inválido                                                |
| 403    | `:id` ≠ `companyId` ou usuário não é `admin`                             |
| 400    | Validação Zod falhou                                                     |
| 404    | Empresa não encontrada (`{ "message": "Empresa não encontrada" }` → 400) |

> **Nota:** o controller devolve `400` quando o serviço lança `Error` (incluindo "Empresa não encontrada").

---

### `DELETE /companies/:id`

> Protegido (`authMiddleware`). Inativa a empresa (soft delete, `status: inactive`). Mesmas regras de autorização do `PUT` (só admin, `:id` = companyId).

**Resposta 200:** empresa com `status: "inactive"`.

**Erros:**

| Status | Quando                                         |
| ------ | ---------------------------------------------- |
| 401    | Token ausente ou inválido                      |
| 403    | `:id` ≠ `companyId` ou usuário não é `admin`   |
| 400    | Empresa não encontrada (serviço lança `Error`) |

---

### `GET /users/me`

> Protegido (`authMiddleware`). Retorna os dados do usuário autenticado, identificado pelo `id` do JWT. A senha nunca é retornada.

**Resposta 200:**

```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@example.com",
  "companyId": "uuid",
  "role": "admin",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Erros:**

| Status | Quando                          |
| ------ | ------------------------------- |
| 401    | Token ausente ou inválido       |
| 404    | Usuário do token não encontrado |

---

### `GET /users`

> Protegido (`authMiddleware` + `requirePermission('users:read')`). Lista os usuários da empresa do JWT (`companyId`), do mais recente para o mais antigo. A senha nunca é retornada.

**Resposta 200:**

```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "companyId": "uuid",
    "role": "manager",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Erros:**

| Status | Quando                           |
| ------ | -------------------------------- |
| 401    | Token ausente ou inválido        |
| 403    | Papel sem permissão `users:read` |
| 404    | Sem `companyId` no token         |

---

### `POST /users`

> Protegido (`authMiddleware` + `requirePermission('users:create')`). Cria um usuário na empresa do JWT com a senha hashada (bcrypt).

**Body:**

```json
{
  "name": "Maria Souza",
  "email": "maria@example.com",
  "password": "minhasenha123",
  "role": "viewer"
}
```

| Campo      | Regras                                                             |
| ---------- | ------------------------------------------------------------------ |
| `name`     | obrigatório, min 1                                                 |
| `email`    | obrigatório, formato válido, único                                 |
| `password` | obrigatório, min 8 caracteres (hash bcrypt)                        |
| `role`     | opcional (`admin`/`manager`/`operator`/`viewer`), default `viewer` |

**Resposta 201:** usuário criado (mesmo formato de um item de `GET /users`, sem senha).

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 401    | Token ausente ou inválido                |
| 403    | Papel sem permissão `users:create`       |
| 404    | Sem `companyId` no token                 |
| 400    | Validação Zod falhou ou e-mail já em uso |

---

### `PUT /users/:id/role`

> Protegido (`authMiddleware` + `requirePermission('users:update')`). Atribui um papel a um usuário da própria empresa. Não é permitido alterar o próprio papel.

**Body:**

```json
{ "role": "manager" }
```

**Resposta 200:** usuário atualizado com o novo `role` (sem senha).

**Erros:**

| Status | Quando                                                                                 |
| ------ | -------------------------------------------------------------------------------------- |
| 401    | Token ausente ou inválido                                                              |
| 403    | Papel sem permissão `users:update`                                                     |
| 404    | `:id` ausente/vazia                                                                    |
| 400    | Usuário não encontrado, de outra empresa, papel inválido ou alteração do próprio papel |

---

### `GET /roles`

> Protegido (`authMiddleware` + `requirePermission('users:read')`). Lista os papéis padrão do sistema (alimentados por `seedRbac()`).

**Resposta 200:**

```json
[
  {
    "id": "uuid",
    "name": "admin",
    "description": "Acesso total",
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "uuid",
    "name": "viewer",
    "description": "Apenas visualização",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Erros:**

| Status | Quando                           |
| ------ | -------------------------------- |
| 401    | Token ausente ou inválido        |
| 403    | Papel sem permissão `users:read` |

---

### `GET /categories`

> Protegido (`authMiddleware` + `requirePermission('categories:read')`). Lista as categorias da empresa do JWT, ordenadas por nome. Categorias removidas (soft delete) não aparecem.

**Resposta 200:**

```json
[
  {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Informática",
    "description": "Hardware e periféricos",
    "deletedAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Erros:**

| Status | Quando                                |
| ------ | ------------------------------------- |
| 401    | Token ausente ou inválido             |
| 403    | Papel sem permissão `categories:read` |
| 404    | Sem `companyId` no token              |

---

### `POST /categories`

> Protegido (`authMiddleware` + `requirePermission('categories:create')`). Cria uma categoria na empresa do JWT.

**Body:**

```json
{ "name": "Informática", "description": "Hardware e periféricos" }
```

| Campo         | Regras                   |
| ------------- | ------------------------ |
| `name`        | obrigatório, min 1       |
| `description` | opcional, vazio → `null` |

**Resposta 201:** categoria criada (mesmo formato de um item de `GET /categories`).

**Erros:**

| Status | Quando                                  |
| ------ | --------------------------------------- |
| 401    | Token ausente ou inválido               |
| 403    | Papel sem permissão `categories:create` |
| 404    | Sem `companyId` no token                |
| 400    | Validação Zod falhou                    |

---

### `PUT /categories/:id`

> Protegido (`authMiddleware` + `requirePermission('categories:update')`). Atualiza uma categoria da própria empresa.

**Body (parcial):** mesmo schema do `POST`, campos opcionais.

**Resposta 200:** categoria atualizada.

**Erros:**

| Status | Quando                                                     |
| ------ | ---------------------------------------------------------- |
| 401    | Token ausente ou inválido                                  |
| 403    | Papel sem permissão `categories:update`                    |
| 404    | Sem `companyId` no token                                   |
| 400    | Validação falhou ou categoria inexistente/de outra empresa |

---

### `DELETE /categories/:id`

> Protegido (`authMiddleware` + `requirePermission('categories:delete')`). Remove a categoria (soft delete). Produtos vinculados têm `categoryId` anulado (hook `beforeDestroy`).

**Resposta 200:** categoria removida (campos originais).

**Erros:**

| Status | Quando                                  |
| ------ | --------------------------------------- |
| 401    | Token ausente ou inválido               |
| 403    | Papel sem permissão `categories:delete` |
| 404    | Sem `companyId` no token                |
| 400    | Categoria inexistente/de outra empresa  |

---

### `GET /suppliers`

> Protegido (`authMiddleware` + `requirePermission('suppliers:read')`). Lista os fornecedores da empresa do JWT, ordenados por nome.

**Resposta 200:** array de fornecedores (campos: `id`, `companyId`, `name`, `contactName`, `phone`, `email`, `cnpj`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zipCode`, timestamps).

**Erros:** mesmos padrões de `/categories` (401/403/404), usando permissão `suppliers:read`.

---

### `POST /suppliers`

> Protegido (`authMiddleware` + `requirePermission('suppliers:create')`). Cria um fornecedor na empresa do JWT.

**Body:**

```json
{
  "name": "Tech Distribuidora",
  "contactName": "Carlos",
  "phone": "(11) 99999-0000",
  "email": "contato@tech.com",
  "cnpj": "12.345.678/0001-90",
  "city": "São Paulo",
  "state": "sp"
}
```

| Campo         | Regras                                                    |
| ------------- | --------------------------------------------------------- |
| `name`        | obrigatório, min 1                                        |
| `contactName` | opcional, vazio → `null`                                  |
| `phone`       | opcional, vazio → `null`                                  |
| `email`       | opcional, formato válido, vazio → `null`                  |
| `cnpj`        | opcional, máscara ou 14 dígitos (normalizado)             |
| endereço      | opcional (STR separado, `state` = UF 2 letras, maiúsculo) |

**Resposta 201:** fornecedor criado.

**Erros:** mesmos padrões, usando permissão `suppliers:create` (400 em validação).

---

### `PUT /suppliers/:id` e `DELETE /suppliers/:id`

> Protegido (`authMiddleware` + `requirePermission('suppliers:update' | 'suppliers:delete')`). Atualiza ou remove (soft delete) um fornecedor da própria empresa.

**Respostas:** 200 com o fornecedor atualizado/removido. Ao remover, produtos vinculados têm `supplierId` anulado.

**Erros:** mesmos padrões de `/categories` (401/403/400), usando as permissões `suppliers:*`.

---

### `GET /products`

> Protegido (`authMiddleware` + `requirePermission('products:read')`). Lista produtos da empresa com paginação, busca e filtros. Produtos removidos (soft delete) não aparecem.

**Query params:**

| Param        | Tipo    | Regras                                       |
| ------------ | ------- | -------------------------------------------- |
| `page`       | number  | default `1`, mínimo `1`                      |
| `limit`      | number  | default `20`, `1`–`100`                      |
| `q`          | string  | busca por nome, SKU ou código de barras      |
| `categoryId` | string  | filtra por categoria                         |
| `supplierId` | string  | filtra por fornecedor                        |
| `status`     | enum    | `active`/`inactive`                          |
| `lowStock`   | boolean | `true` → produtos com `quantity <= minStock` |

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "name": "Notebook",
      "sku": "NB-001",
      "barcode": null,
      "description": null,
      "purchasePrice": "2500.00",
      "salePrice": "3299.90",
      "quantity": 10,
      "minStock": 2,
      "categoryId": "uuid",
      "supplierId": null,
      "imageUrl": null,
      "weight": null,
      "dimensions": null,
      "status": "active",
      "category": { "id": "uuid", "name": "Informática" },
      "supplier": null,
      "deletedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

> `price` e `weight` (DECIMAL) vêm como string; `category`/`supplier` são objetos embutidos com `id` e `name`.

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 401    | Token ausente ou inválido                |
| 403    | Papel sem permissão `products:read`      |
| 404    | Sem `companyId` no token                 |
| 400    | Query inválida (ex: `page` não numérico) |

---

### `POST /products`

> Protegido (`authMiddleware` + `requirePermission('products:create')`). Cria um produto na empresa do JWT.

**Body:**

```json
{
  "name": "Notebook",
  "sku": "NB-001",
  "barcode": "7891234567890",
  "description": "Notebook 16GB",
  "purchasePrice": "2500.00",
  "salePrice": "3299.90",
  "quantity": 10,
  "minStock": 2,
  "categoryId": "uuid",
  "supplierId": "uuid",
  "weight": "1.800",
  "dimensions": { "length": 30, "width": 20, "height": 2 },
  "status": "active"
}
```

| Campo                                       | Regras                                           |
| ------------------------------------------- | ------------------------------------------------ |
| `name`                                      | obrigatório, min 1                               |
| `sku`, `barcode`, `description`, `imageUrl` | opcional, vazio → `null`                         |
| `purchasePrice`, `salePrice`, `weight`      | opcional, ≥ 0                                    |
| `quantity`, `minStock`                      | opcional, inteiro ≥ 0, default `0`               |
| `categoryId`, `supplierId`                  | opcional (devem pertencer à empresa)             |
| `dimensions`                                | opcional, objeto de números                      |
| `status`                                    | opcional (`active`/`inactive`), default `active` |

**Resposta 201:** produto criado (mesmo formato de um item de `GET /products`, sem `category`/`supplier` embutidos).

**Erros:** mesmos padrões (400 em validação), usando permissão `products:create`.

---

### `GET /products/:id`

> Protegido (`authMiddleware` + `requirePermission('products:read')`). Retorna o produto da empresa com `category` e `supplier` embutidos.

**Resposta 200:** mesmo formato do item de `GET /products`, com `category`/`supplier`.

**Erros:**

| Status | Quando                               |
| ------ | ------------------------------------ |
| 401    | Token ausente ou inválido            |
| 403    | Papel sem permissão `products:read`  |
| 404    | Sem `companyId` no token             |
| 400    | Produto inexistente/de outra empresa |

---

### `PUT /products/:id`

> Protegido (`authMiddleware` + `requirePermission('products:update')`). Atualiza um produto da própria empresa.

**Body (parcial):** mesmo schema do `POST`, campos opcionais (sem defaults — campos não enviados não são alterados).

**Resposta 200:** produto atualizado.

**Erros:** mesmos padrões (401/403/400), usando permissão `products:update`.

---

### `DELETE /products/:id`

> Protegido (`authMiddleware` + `requirePermission('products:delete')`). Remove o produto (soft delete) — `deletedAt` é preenchido e o produto some das listagens.

**Resposta 200:** produto removido (campos originais).

**Erros:**

| Status | Quando                                |
| ------ | ------------------------------------- |
| 401    | Token ausente ou inválido             |
| 403    | Papel sem permissão `products:delete` |
| 404    | Sem `companyId` no token              |
| 400    | Produto inexistente/de outra empresa  |

---

## Endpoints Planejados

> Derivado do `ROADMAP.md`. Implementar seguindo o padrão feature-module.

### Auth & Users

- `PUT /users/me/password` — alterar senha (protegido)
- `PUT /users/me` — atualizar dados do perfil (protegido)

### Companies (multi-tenant)

Já implementado: `GET /companies/me`, `PUT /companies/:id`, `DELETE /companies/:id`.

- `GET /companies` — listar empresas (admin)
- `GET /companies/:id` — detalhe de outra empresa (admin)

### Users & RBAC

Já implementado: `GET /users`, `POST /users`, `PUT /users/:id/role`, `GET /roles`.

- `PUT /users/:id` — atualizar usuário (protegido)
- `DELETE /users/:id` — inativar usuário (protegido)

### Products

Já implementado: `GET /products`, `POST /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id` (com paginação, busca e filtros).

- `POST /products/:id/image` — upload de imagem (protegido)

### Categories, Suppliers & Customers

Já implementado: CRUD completo em `/categories` e `/suppliers` (protegido, escopado por empresa, soft delete).

- CRUD em `/customers` (padrão acima, protegido)

### Stock

- `POST /stock/in` — registrar entrada (protegido)
- `POST /stock/out` — registrar saída (protegido)
- `GET /stock` — visão geral do estoque (protegido)
- `GET /products/:id/movements` — histórico de movimentações (protegido)

### Dashboard & Reports

- `GET /dashboard` — cards e últimos movimentos (protegido)
- `GET /reports/:type` — relatórios (protegido)
- `GET /reports/:type/export` — exportar CSV/Excel/PDF (protegido)

### Misc

- `POST /upload` — upload genérico (protegido)
- `GET /audit-logs` — logs de auditoria (admin)

---

## Ciclo de Vida ao Adicionar Endpoint

1. Criar schema Zod em `src/modules/<feature>/validation/`
2. Criar DTO em `src/modules/<feature>/dto/`
3. Implementar lógica no repository/service
4. Criar método no controller (validação + HTTP)
5. Registrar rota em `src/modules/<feature>/routes/` com `.bind(controller)`
6. Mapear no `app.ts`
7. Atualizar este arquivo (`API.md`)
8. Atualizar `ROADMAP.md` (marcar `[x]`)

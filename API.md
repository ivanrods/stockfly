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

- `GET /products` — listar (paginação, filtros, busca)
- `POST /products` — criar (protegido)
- `GET /products/:id` — detalhe (protegido)
- `PUT /products/:id` — atualizar (protegido)
- `DELETE /products/:id` — soft delete (protegido)
- `POST /products/:id/image` — upload de imagem (protegido)

### Categories & Suppliers & Customers

- CRUD em `/categories`, `/suppliers`, `/customers` (padrão acima, protegido)

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

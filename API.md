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

**Estrutura das rotas:** `src/app.ts` registra os módulos em prefixos (`/auth`, `/products`, etc.). Cada módulo expõe seu `Router` em `src/modules/<feature>/routes/`.

**Regra:** rotas que exigem login devem passar pelo middleware `auth` (`src/middlewares/auth-middleware.ts`).

```typescript
import { auth } from '../middlewares/auth-middleware';

router.get('/', auth, productController.list.bind(productController));
```

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

> Público. Cria um novo usuário e retorna o JWT.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "minhasenha123"
}
```

| Campo      | Regras                        |
| ---------- | ----------------------------- |
| `name`     | obrigatório, min 1            |
| `email`    | obrigatório, formato válido   |
| `password` | obrigatório, min 8 caracteres |

**Resposta 201:**

```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOi..."
}
```

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 400    | Validação Zod falhou ou e-mail já em uso |
| 500    | Erro interno                             |

---

### `POST /auth/login`

> Público. Autentica o usuário e retorna um novo JWT (expira em 1 dia).

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
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOi..."
}
```

**Erros:**

| Status | Quando                                   |
| ------ | ---------------------------------------- |
| 400    | Validação Zod falhou                     |
| 401    | Usuário não encontrado ou senha inválida |
| 500    | Erro interno                             |

---

## Endpoints Planejados

> Derivado do `ROADMAP.md`. Implementar seguindo o padrão feature-module.

### Auth

- `POST /auth/refresh` — renovar access token (via refresh token)
- `POST /auth/logout` — revogar refresh token (protegido)
- `PUT /users/me/password` — alterar senha (protegido)
- `PUT /users/me` — atualizar dados do perfil (protegido)

### Companies (multi-tenant)

- `POST /companies` — criar empresa (admin)
- `GET /companies` — listar
- `GET /companies/:id` — detalhe
- `PUT /companies/:id` — atualizar (admin)
- `DELETE /companies/:id` — inativar (admin)

### Users & RBAC

- `GET /users` — listar usuários da empresa (protegido)
- `POST /users` — criar usuário (protegido)
- `PUT /users/:id` — atualizar (protegido)
- `PUT /users/:id/role` — atribuir papel (admin)
- `DELETE /users/:id` — inativar (protegido)
- `GET /roles` — listar papéis

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

## Cycle de Vida ao Adicionar Endpoint

1. Criar schema Zod em `src/modules/<feature>/validation/`
2. Criar DTO em `src/modules/<feature>/dto/`
3. Implementar lógica no repository/service
4. Criar método no controller (validação + HTTP)
5. Registrar rota em `src/modules/<feature>/routes/` com `.bind(controller)`
6. Mapear no `app.ts`
7. Atualizar este arquivo (`API.md`)
8. Atualizar `ROADMAP.md` (marcar `[x]`)

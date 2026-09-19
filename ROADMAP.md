# Roadmap — StockFly

> Sistema de Gestão de Estoque Multi-tenant (pt-BR)
> Fonte: Notion do projeto. Manter este arquivo atualizado conforme features forem implementadas.

---

## Status Atual

**Concluído:**

- [x] Setup inicial (Docker, Express, React, Vite, TypeScript, ESLint, Prettier)
- [x] Autenticação básica (registro + login com JWT, bcrypt)
- [x] Validação com Zod
- [x] Model `User` + migration
- [x] Testes (Vitest + supertest backend, Testing Library frontend)
- [x] CI/CD básico (GitHub Actions: lint, typecheck, build, test)
- [x] Refresh token (renovar access token + logout)
- [x] Multi-tenant: `Company` + `User.company_id` + `User.role` + JWT `{ id, companyId, role }`

**Detalhe do que já existe:** ver `AGENTS.md`.

---

## Próximas Features (por ordem de prioridade)

### 1. Refresh Token

- [x] Renovar access token expirado
- [x] `RefreshToken` model + tabela
- [x] Logout (revogar refresh token)

### 2. Multi-tenant: Empresas (Companies)

Empresa é o container principal. Usuário pertence a uma empresa. Nenhuma empresa vê dados da outra.

- [x] `Company` model (nome, CNPJ, status, endereço)
- [x] `User.company_id` FK com `Company` (+ `User.role` para RBAC básico)
- [x] Middleware que injeta `company_id` no `req` a partir do token JWT (`authMiddleware`)
- [x] JWT carrega `{ id, companyId, role }` (login, register e refresh)
- [x] `register` cria empresa + usuário `admin` em transação
- [x] CRUD Empresas escopado por tenant (apenas admin): `GET /companies/me`, `PUT /companies/:id`, `DELETE /companies/:id`
- [ ] Todos os módulos abaixo escopados por `company_id`

### 3. RBAC — Papéis e Permissões

O `User.role` (`admin`/`manager`/`operator`/`viewer`) já existe no schema e no JWT. Falta o RBAC completo:

- [ ] `Role` model + `Permission` model (ou evoluir `role` atual)
- [ ] Middleware `requireRole()` / `requirePermission()`
- [ ] Seeds com papéis padrão
- [ ] Gestão de usuários da empresa (`GET/POST /users`, atribuir papéis)

### 4. Produtos

- [ ] `Product` model: nome, SKU, código de barras, descrição, preço compra, preço venda, quantidade, estoque mínimo, categoria FK, fornecedor FK, imagem, peso, dimensões, status
- [ ] CRUD (com paginação, ordenação, filtros, soft delete)
- [ ] Busca por nome, SKU, código de barras
- [ ] Filtros: categoria, fornecedor, estoque baixo, ativo/inativo
- [ ] Upload de imagem (local → MinIO/S3 depois)

### 5. Categorias

- [ ] `Category` model (nome, descrição?)
- [ ] CRUD
- [ ] Exemplos: Informática, Celulares, Escritório, Ferramentas, Roupas

### 6. Fornecedores

- [ ] `Supplier` model: nome, telefone, email, endereço, CNPJ, contato
- [ ] CRUD

### 7. Clientes

- [ ] `Customer` model: nome, telefone, email, endereço, CPF/CNPJ
- [ ] CRUD

### 8. Estoque — Entradas e Saídas

**Regra fundamental:** nunca alterar estoque diretamente. Sempre registrar uma movimentação (`StockMovement`).

**Entrada** (compra/ajuste):

- Fornecedor, produto, quantidade, valor unitário, número da nota, data, responsável
- Ao salvar: `stock += quantidade`

**Saída** (venda/perda/troca/defeito):

- Produto, quantidade, motivo (venda, perda, troca, defeito), responsável
- Ao salvar: `stock -= quantidade`
- Validar estoque mínimo

- [ ] `StockMovement` model (tipo: entrada/saída, quantidade, motivo, valor unitário, nota, responsável, produto FK, empresa FK)
- [ ] Migração com transactions (movimentação + update de estoque atômico)
- [ ] Histórico por produto (quem fez cada alteração e quando)

### 9. Dashboard

- [ ] Cards: total produtos, estoque baixo, entradas hoje, saídas hoje
- [ ] Gráfico: produtos mais vendidos
- [ ] Lista: últimas movimentações
- [ ] Cache no Redis (opcional)

### 10. Alertas de Estoque Baixo

- [ ] Quando `quantidade <= estoque_mínimo` → mostrar badge/alerta
- [ ] Lista de produtos críticos no dashboard

### 11. Relatórios

- [ ] Produtos, entradas, saídas, estoque, lucro, compras, movimentações
- [ ] Exportar: CSV, Excel, PDF

### 12. Busca e Filtros Globais

- [ ] Busca com debounce no frontend
- [ ] Filtros sincronizados com URL params

### 13. Perfil do Usuário

- [ ] Alterar senha
- [ ] Atualizar dados
- [ ] Atualizar foto

### 14. Recuperação de Senha

- [ ] Enviar email com link de redefinição
- [ ] Fila BullMQ (email assíncrono)

### 15. Auditoria

- [ ] `AuditLog` model (user, action, entity, entity_id, data)
- [ ] Registrar criações/edições/deleções dos módulos principais

### 16. Importação/Exportação

- [ ] Importar produtos via CSV (com fila)
- [ ] Exportar relatórios em Excel/PDF

---

## Infraestrutura Planejada

### Redis (cache + filas)

- [ ] Cache do dashboard
- [ ] Cache de consultas frequentes
- [ ] Blacklist de tokens (opcional)

### BullMQ (filas)

- [ ] Envio de emails (cadastro, recuperação de senha)
- [ ] Importação de CSV em background

### Emails (Nodemailer)

- [ ] Templates HTML
- [ ] Envio via fila
- [ ] Depois: Resend/SendGrid

### Storage de Imagens

- [ ] Local (upload direto) — dev
- [ ] MinIO — testes
- [ ] AWS S3 + CloudFront — produção

### Observabilidade

- [ ] Pino (logger estruturado)
- [ ] Helmet, Rate Limit, Compression (segurança básica)
- [ ] Sentry (frontend e backend)
- [ ] Prometheus + Grafana (métricas)

### CI/CD e Deploy

- [ ] Pipeline completo: Lint → Testes → Build → Docker → Deploy
- [ ] Deploy: Railway/Render/VPS/AWS EC2
- [ ] Nginx como reverse proxy + HTTPS

---

## Tecnologias Planejadas

### Backend

| Uso           | Tecnologia         | Status      |
| ------------- | ------------------ | ----------- |
| ORM           | Sequelize          | ✅ Em uso   |
| Validação     | Zod                | ✅ Em uso   |
| Autenticação  | JWT + bcrypt       | ✅ Em uso   |
| Refresh Token | jsonwebtoken       | ✅ Em uso   |
| Filas         | BullMQ             | ⏳ Pendente |
| Cache         | Redis              | ⏳ Pendente |
| Upload        | Multer             | ⏳ Pendente |
| Logs          | Pino               | ⏳ Pendente |
| Emails        | Nodemailer         | ⏳ Pendente |
| Testes        | Vitest + supertest | ✅ Em uso   |

### Frontend

| Uso           | Tecnologia               | Status      |
| ------------- | ------------------------ | ----------- |
| UI            | MUI 9                    | ✅ Em uso   |
| HTTP          | Axios                    | ✅ Em uso   |
| Estado server | TanStack Query           | ⏳ Pendente |
| Estado global | Zustand                  | ⏳ Pendente |
| Formulários   | React Hook Form          | ⏳ Pendente |
| Tabelas       | TanStack Table           | ⏳ Pendente |
| Gráficos      | Recharts                 | ⏳ Pendente |
| Upload        | React Dropzone           | ⏳ Pendente |
| Notificações  | Sonner                   | ⏳ Pendente |
| Testes        | Vitest + Testing Library | ✅ Em uso   |
| E2E           | Playwright               | ⏳ Pendente |

---

## Modelagem de Dados (alvo)

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

**Regras:**

- Todas as tabelas de dados de negócio têm `company_id`
- Toda movimentação de estoque gera `StockMovement`
- Toda alteração sensível gera `AuditLog`

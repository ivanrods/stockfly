# AGENTS.md — Instruções para IA

Guia de referência para IA que trabalham neste projeto. Leia antes de fazer qualquer alteração.

---

## Visão Geral

**StockFly** é um monorepo full-stack para gestão de estoque (em desenvolvimento).

| Camada   | Tecnologias                                        |
| -------- | -------------------------------------------------- |
| Frontend | React 19, TypeScript 6, Vite 8, MUI 9, Axios      |
| Backend  | Node.js 22, Express 5, TypeScript 6, Zod 4        |
| Banco    | PostgreSQL 17, Sequelize 6                         |
| Auth     | bcrypt, jsonwebtoken (JWT)                         |
| Infra    | Docker Compose (api:3333, web:5173, postgres:5433) |
| Testes   | Vitest 4, Testing Library, supertest               |
| Lint     | ESLint 10 (flat config), Prettier 3                |

---

## Estrutura do Monorepo

```
stockfly/
├── apps/
│   ├── api/                        # Backend Express
│   │   └── src/
│   │       ├── app.ts              # Express app (rotas, middlewares)
│   │       ├── server.ts           # Bootstrap (DB + listen)
│   │       ├── modules/            # Features (auth/, future: products/, stock/)
│   │       │   └── <feature>/
│   │       │       ├── routes/     # Rotas Express
│   │       │       ├── controllers/# Validação + resposta HTTP
│   │       │       ├── services/   # Lógica de negócio
│   │       │       ├── repository/ # Acesso ao banco (Sequelize)
│   │       │       ├── validation/ # Schemas Zod
│   │       │       └── dto/        # Types inferidos dos schemas Zod
│   │       ├── shared/
│   │       │   ├── config/         # database.ts, jwt.ts
│   │       │   ├── database/       # models/, migrations/
│   │       │   └── middlewares/    # auth-middleware.ts
│   │       ├── types/              # Augmentations (express.d.ts)
│   │       └── test/               # Setup de testes (db, config)
│   └── web/                        # Frontend React
│       └── src/
│           ├── main.tsx            # Entry point (BrowserRouter)
│           ├── App.tsx             # Definição de rotas
│           ├── features/           # Features (auth/, future: products/, stock/)
│           │   └── <feature>/
│           │       ├── pages/      # Componentes de página
│           │       ├── hooks/      # Custom hooks (use-*.ts)
│           │       ├── services/   # Chamadas API (Axios)
│           │       ├── components/ # Componentes reutilizáveis da feature
│           │       └── types/      # Types da feature
│           └── shared/
│               └── api/            # http-client.ts (instância Axios)
├── docker-compose.yml
├── .env.example
└── package.json                    # Scripts raiz (docker, lint, format)
```

---

## Padrões Backend (API)

### Adicionar nova feature (ex: products)

1. Criar pasta `src/modules/products/` com as subpastas: `routes/`, `controllers/`, `services/`, `repository/`, `validation/`, `dto/`

2. **Model** — Criar em `src/shared/database/models/`:
   ```typescript
   // product-model.ts
   import { DataTypes } from 'sequelize';
   import sequelize from '../config/database';

   export const Product = sequelize.define('Product', {
     id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
     name: { type: DataTypes.STRING, allowNull: false },
     // ... campos
   }, { timestamps: true });
   ```

3. **Migration** — Criar via `npm run db:create-migration -- <nome>` em `apps/api/`

4. **Validation** — Schema Zod em `validation/`:
   ```typescript
   import { z } from 'zod';

   export const createProductSchema = z.object({
     name: z.string().min(1, 'Nome é obrigatório'),
     // ...
   });
   ```

5. **DTO** — Tipos inferidos em `dto/`:
   ```typescript
   import { z } from 'zod';
   import { createProductSchema } from '../validation/product-validation';

   export type CreateProductDTO = z.infer<typeof createProductSchema>;
   ```

6. **Repository** — Acesso ao banco (classe com export default singleton):
   ```typescript
   import { Product } from '../../../shared/database/models/product-model';

   class ProductRepository {
     async findAll() { return Product.findAll(); }
     async findById(id: string) { return Product.findByPk(id); }
     async create(data: CreateProductDTO) { return Product.create(data); }
   }

   export default new ProductRepository();
   ```

7. **Service** — Lógica de negócio (classe com export default singleton):
   ```typescript
   import productRepository from '../repository/product-repository';

   class ProductService {
     async list() { return productRepository.findAll(); }
     async getById(id: string) {
       const product = await productRepository.findById(id);
       if (!product) throw new Error('Produto não encontrado');
       return product;
     }
   }

   export default new ProductService();
   ```

8. **Controller** — Validação + HTTP (classe com export default singleton):
   ```typescript
   import { Request, Response } from 'express';
   import { createProductSchema } from '../validation/product-validation';
   import { CreateProductDTO } from '../dto/create-product-dto';
   import productService from '../services/product-service';

   class ProductController {
     async list(req: Request, res: Response) {
       const products = await productService.list();
       return res.json(products);
     }

     async create(req: Request, res: Response) {
       const parsed = createProductSchema.safeParse(req.body);
       if (!parsed.success) {
         return res.status(400).json({ message: parsed.error.issues[0]!.message });
       }
       const data = parsed.data as CreateProductDTO;
       try {
         const product = await productService.create(data);
         return res.status(201).json(product);
       } catch (error) {
         if (error instanceof Error) {
           return res.status(400).json({ message: error.message });
         }
         return res.status(500).json({ message: 'Erro interno do servidor' });
       }
     }
   }

   export default new ProductController();
   ```

9. **Routes** — Registrar rotas em `routes/`:
   ```typescript
   import { Router } from 'express';
   import productController from '../controllers/product-controller';

   const router = Router();

   router.get('/', productController.list.bind(productController));
   router.post('/', productController.create.bind(productController));

   export default router;
   ```

10. **Registrar no app.ts** — Adicionar a rota no Express:
    ```typescript
    import productRoutes from './modules/products/routes/product-routes';
    // ...
    app.use('/products', productRoutes);
    ```

### Convenções Backend

- Controllers, services e repositories são classes instanciadas como singletons (`export default new ClassName()`)
- Rotas usam `.bind(controller)` para manter o contexto do `this`
- Validação sempre com Zod, erros retornam `{ message: string }`
- Erros de negócio são `throw new Error('msg')`, capturados no controller
- Senhas sempre hasheadas com `bcrypt.hash(password, 10)`
- Senhas nunca são retornadas nas respostas (destructure e descarte)
- JWT extraído do header `Authorization: Bearer <token>`
- Middlewares de auth protegem rotas autenticadas

---

## Padrões Frontend (Web)

### Adicionar nova feature (ex: products)

1. Criar pasta `src/features/products/` com: `pages/`, `hooks/`, `services/`, `types/`, `components/`

2. **Types** — Definir em `types/`:
   ```typescript
   // product-types.ts
   export interface Product {
     id: string;
     name: string;
     // ...
   }
   ```

3. **Service** — Chamada API em `services/`:
   ```typescript
   // product-service.ts
   import httpClient from '@/shared/api/http-client';
   import { Product } from '../types/product-types';

   export async function getProducts(): Promise<Product[]> {
     const response = await httpClient.get<Product[]>('/products');
     return response.data;
   }
   ```

4. **Hook** — Lógica de estado em `hooks/`:
   ```typescript
   // use-products.ts
   import { useState, useEffect } from 'react';
   import { getProducts } from '../services/product-service';
   import { Product } from '../types/product-types';

   export function useProducts() {
     const [products, setProducts] = useState<Product[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       getProducts()
         .then(setProducts)
         .catch((err) => setError(err.message))
         .finally(() => setIsLoading(false));
     }, []);

     return { products, isLoading, error };
   }
   ```

5. **Page** — Componente de página em `pages/`:
   ```typescript
   // products-page.tsx
   import { Box, Typography, CircularProgress, Alert } from '@mui/material';
   import { useProducts } from '../hooks/use-products';

   export default function ProductsPage() {
     const { products, isLoading, error } = useProducts();

     if (isLoading) return <CircularProgress />;
     if (error) return <Alert severity="error">{error}</Alert>;

     return (
       <Box sx={{ p: 3 }}>
         <Typography variant="h4">Produtos</Typography>
         {/* ... */}
       </Box>
     );
   }
   ```

6. **Registrar rota em App.tsx**:
   ```typescript
   import ProductsPage from '@/features/products/pages/products-page';

   <Route path="/products" element={<ProductsPage />} />
   ```

### Convenções Frontend

- Componentes de página são `export default function ComponentName()`
- Hooks customizados começam com `use-` no nome do arquivo
- Caminhos relativos dentro da feature: `../hooks/use-xxx`, `../services/xxx-service`
- Caminhos absolutos para shared: `@/shared/api/http-client`
- UI sempre com componentes MUI (`@mui/material`)
- Erros tratados com `Alert severity="error"` do MUI
- Loading com `CircularProgress` do MUI
- Interface doAxios: `import axios, { AxiosError } from 'axios'`

---

## Testes

### Backend (apps/api)

- Arquivos: `*.test.ts` ao lado do arquivo testado
- Framework: Vitest + supertest (testes de integração com DB real)
- Setup: `src/test/setup.ts` cria DB de teste `stock_test`, sincroniza models
- Rodar: `cd apps/api && npm run test:run`
- Coverage: `npm run test:coverage` (80% linhas, 80% funções, 70% branches, 80% statements)

```typescript
// Exemplo de teste de integração
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app';

describe('POST /products', () => {
  it('should create a product', async () => {
    const response = await request(app)
      .post('/products')
      .send({ name: 'Produto Teste' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Produto Teste');
  });
});
```

### Frontend (apps/web)

- Arquivos: `*.test.tsx` ou `*.test.ts` ao lado do arquivo testado
- Framework: Vitest + Testing Library + jsdom
- Setup: `tests/setup.ts` (jest-dom matchers)
- Rodar: `cd apps/web && npm run test:run`
- Coverage: `npm run test:coverage` (80/80/70/80)

```typescript
// Exemplo de teste de componente
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductsPage from './products-page';

describe('ProductsPage', () => {
  it('should render title', () => {
    render(<ProductsPage />);
    expect(screen.getByText('Produtos')).toBeInTheDocument();
  });
});
```

---

## Comandos Úteis

### Raiz
```bash
npm run dev              # Docker compose up --build
npm run dev:detached     # Docker compose up -d --build
npm run down             # Docker compose down
npm run lint             # Lint raiz
npm run format           # Format all with Prettier
```

### API (apps/api)
```bash
npm run dev              # tsx watch src/server.ts
npm run build            # tsc → dist/
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run test:run         # Vitest run
npm run test:coverage    # Vitest com coverage
npm run db:create-migration -- <nome>  # Criar migration
```

### Web (apps/web)
```bash
npm run dev              # vite
npm run build            # tsc -b && vite build
npm run lint             # ESLint
npm run test:run         # Vitest run
npm run test:coverage    # Vitest com coverage
```

---

## Regras Importantes

### Sempre fazer

- Rodar `npm run lint` e `npm run typecheck` (ou `npm run build`) após alterações
- Usar Zod para validação no backend
- Usar MUI para componentes no frontend
- Seguir o padrão feature-module (routes → controllers → services → repository)
- Manter textos da UI em português (pt-BR)
- Usar `@/` como alias para `src/` no frontend
- Criar migration para mudanças na tabela

### Nunca fazer

- Não usar `any` (preferir tipos corretos ou `unknown`)
- não usar `console.log` em produção (usar `console.error` apenas)
- Não retornar senha nas respostas da API
- Não硬编码ar secrets (usar variáveis de ambiente)
- Não usar `sequelize.sync()` em produção (apenas dev com `alter: true`)
- Não pular validação no controller (sempre validar com Zod antes de chamar service)
- Não importar de caminhos relativos que saiam da feature (`../../`)

---

## Ambiente

- `.env` na raiz e em `apps/api/.env` — copiar de `.env.example`
- Variáveis: `DATABASE_URL`, `JWT_SECRET`, `POSTGRES_PORT`, `API_PORT`, `WEB_PORT`
- Portas padrão: Web 5173, API 3333, Postgres 5433
- Git branch principal: `main`

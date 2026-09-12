# StockFly

Aplicação full stack moderna construída com **React, Node.js, Express, TypeScript e PostgreSQL**.

## Tecnologias

| Camada   | Tecnologias                  |
| -------- | ---------------------------- |
| Frontend | React 19, TypeScript, Vite   |
| Backend  | Node.js, Express, TypeScript |
| Banco    | PostgreSQL 17+               |
| Infra    | Docker + Docker Compose      |

## Estrutura

```text
.
├── apps/
│   ├── api/    # Backend (Express + TypeScript)
│   └── web/    # Frontend (React + Vite)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Começando

### Pré-requisitos

- Node.js 22+
- PostgreSQL 17+ (apenas para rodar sem Docker)

### Setup

Clone o projeto e instale as dependências:

```bash
git clone <repository-url>
cd <project>

# Crie o arquivo de variáveis de ambiente
cp .env.example .env
```

## Executar com Docker

```bash
npm run dev:detached
```

| Serviço    | URL                   |
| ---------- | --------------------- |
| Web        | http://localhost:5173 |
| API        | http://localhost:3333 |
| PostgreSQL | localhost:5433        |

```bash
# Parar os containers
npm run down

# Parar e remover os volumes
docker compose down -v
```

## Executar sem Docker

Configure o PostgreSQL e atualize o `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/database
```

Instale as dependências de cada aplicação:

```bash
cd apps/api
npm install

cd ../web
npm install
```

Inicie o backend e o frontend (em terminais separados):

```bash
cd apps/api
npm run dev
```

```bash
cd apps/web
npm run dev
```

| Serviço | URL                   |
| ------- | --------------------- |
| Web     | http://localhost:5173 |
| API     | http://localhost:3333 |

## Testes

### Web

```bash
cd apps/web

# Rodar em modo watch
npm run test

# Rodar uma vez
npm run test:run

# Com cobertura
npm run test:coverage
```

### API

Ainda sem testes configurados.

## Scripts

### API

| Script              | Descrição                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Inicia em modo desenvolvimento (hot reload) |
| `npm run build`     | Compila para `dist/`                        |
| `npm run start`     | Inicia a versão compilada                   |
| `npm run lint`      | Executa o lint                              |
| `npm run typecheck` | Verifica os tipos do TypeScript             |

### Web

| Script                  | Descrição                      |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Inicia em modo desenvolvimento |
| `npm run build`         | Gera o build de produção       |
| `npm run test`          | Roda os testes em modo watch   |
| `npm run test:run`      | Roda os testes uma vez         |
| `npm run test:coverage` | Roda os testes com cobertura   |
| `npm run lint`          | Executa o lint                 |
| `npm run preview`       | Previsualiza o build           |

# LexiClass Backend

Backend service for LexiClass.

## Stack

- NestJS
- Prisma
- PostgreSQL
- pnpm

## Local Setup

Install dependencies:

```powershell
pnpm install
```

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Start PostgreSQL:

```powershell
docker compose up -d
```

Run the API in development:

```powershell
pnpm dev
```

The API listens on:

```text
http://localhost:4000/api/v1
```

Health check:

```text
GET http://localhost:4000/api/v1/health
```

## Verification

```powershell
pnpm lint
pnpm test
pnpm build
```

## Planned Prisma Commands

These scripts are available for the database checkpoint:

```powershell
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

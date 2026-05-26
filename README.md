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

Apply migrations and load demo data:

```powershell
pnpm prisma:migrate
pnpm prisma:seed
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

## Demo Seed Data

Seed credentials:

```text
teacher@example.com / password
student@example.com / password
```

Demo class invite codes:

```text
A2-7KQ9
B1-4MVP
```

The seed creates one teacher, two students, two classes, two word sets, words, enrollments, assignments, and sample practice attempts for analytics.

## Verification

```powershell
pnpm lint
pnpm test
pnpm build
```

## Prisma Commands

Useful database scripts:

```powershell
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

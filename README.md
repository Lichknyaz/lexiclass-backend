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

Production start requires a build first:

```powershell
pnpm build
pnpm start
```

The API listens on:

```text
http://localhost:4000/api/v1
```

Health check:

```text
GET http://localhost:4000/api/v1/health
```

Interactive API documentation:

```text
http://localhost:4000/api/docs
```

Use the Swagger `Authorize` button with the `accessToken` returned by `POST /api/v1/auth/login`.

## Demo Seed Data

Seed credentials:

```text
teacher@example.com / password
student@example.com / password
```

Additional demo students, all using password `password`:

```text
olena.student@example.com
andrii.student@example.com
kateryna.student@example.com
maksym.student@example.com
iryna.student@example.com
bohdan.student@example.com
sofia.student@example.com
dmytro.student@example.com
```

Demo class invite codes:

```text
A2-7KQ9 - English A2 - Travel
B1-4MVP - English B1 - Classroom Communication
```

The seed resets the demo teacher's classes, word sets, assignments, enrollments, and practice attempts so demo data stays clean after E2E or manual testing. It creates two classes, three English word sets with Ukrainian translations, multiple students in each class, and varied practice attempts for meaningful teacher analytics.

## Verification

```powershell
pnpm lint
pnpm test
pnpm build
```

With PostgreSQL seeded and the API running on port `4000`, run the smoke flow in another terminal:

```powershell
pnpm smoke
```

The smoke script checks health, teacher login/classes, student login/assignments, student word-set details, practice submission, student progress, and teacher analytics.

The same script can target another API URL:

```powershell
pnpm smoke -- -BaseUrl http://localhost:4000/api/v1
```

## Prisma Commands

Useful database scripts:

```powershell
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

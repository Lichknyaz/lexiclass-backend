# LexiClass Deployment

This project is deployed as three services:

- Frontend: Vercel, root directory `lexiclass-frontend`
- Backend API: Render, Railway, Fly.io, or another Node.js host, root directory `lexiclass-backend`
- Database: hosted PostgreSQL, for example Neon, Supabase, Railway, or Render PostgreSQL

The frontend calls the backend through `NEXT_PUBLIC_API_URL`, and the backend allows the frontend origin through `CORS_ORIGIN`.

## 1. Prepare The Repository

Push the frontend and backend repositories to GitHub.

Before deploying, verify locally:

```powershell
cd "D:\GoIT\Capstone Project\LexiClass\lexiclass-backend"
pnpm install
pnpm build
pnpm test

cd "D:\GoIT\Capstone Project\LexiClass\lexiclass-frontend"
pnpm install
pnpm lint
pnpm test
pnpm build
```

If a local Next.js build fails on Windows with an `.next` permission error, delete the generated cache and run the build again:

```powershell
Remove-Item .next -Recurse -Force
pnpm build
```

## 2. Create PostgreSQL

Create a hosted PostgreSQL database and copy its connection string.

The backend expects:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Use the provider's pooled connection string if the platform recommends it for application traffic.

## 3. Deploy The Backend

Create a new backend service from the backend GitHub repository.

Recommended settings:

```text
Root directory: lexiclass-backend
Runtime: Node.js
Node version: 22 or newer
Install command: pnpm install --frozen-lockfile
Build command: pnpm deploy:build && pnpm prisma:deploy
Start command: pnpm start
```

If the backend repository root is already `lexiclass-backend`, leave root directory empty.

Set these environment variables:

```text
DATABASE_URL=<your hosted PostgreSQL URL>
JWT_SECRET=<long random production secret>
PORT=<platform-provided port, or omit if the platform injects it>
CORS_ORIGIN=<your Vercel frontend URL>
```

After the first backend deploy, seed demo data if you need the demo accounts:

```powershell
pnpm prisma:seed
```

Then verify:

```text
https://your-backend-domain/api/v1/health
https://your-backend-domain/api/docs
```

Expected health response:

```json
{"status":"ok","service":"lexiclass-backend"}
```

## 4. Deploy The Frontend To Vercel

Create a new Vercel project from the frontend GitHub repository.

Use these settings:

```text
Root directory: lexiclass-frontend
Framework preset: Next.js
Install command: pnpm install --frozen-lockfile
Build command: pnpm build
Output directory: .next
Node version: 22 or newer
```

If the frontend repository root is already `lexiclass-frontend`, leave root directory empty.

Set these Vercel environment variables:

```text
NEXT_PUBLIC_DATA_SOURCE=backend
NEXT_PUBLIC_API_URL=https://your-backend-domain/api/v1
```

Deploy the frontend.

## 5. Connect CORS

After Vercel gives you the production frontend URL, update the backend environment variable:

```text
CORS_ORIGIN=https://your-vercel-project.vercel.app
```

Redeploy or restart the backend.

## 6. Final Smoke Check

Open the Vercel URL and log in with seeded demo credentials, if seeded:

```text
teacher@example.com / password
student@example.com / password
```

Check these flows:

- teacher login
- teacher classes
- teacher word sets
- student login
- student assignments
- practice submission
- student progress
- teacher analytics

For backend-only verification, run the smoke script against production:

```powershell
cd "D:\GoIT\Capstone Project\LexiClass\lexiclass-backend"
pnpm smoke -- -BaseUrl https://your-backend-domain/api/v1
```

# Praxor Kit

Ship paid SaaS faster, without lock-in.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm + Turborepo |
| Marketing | Astro + React islands |
| Dashboard | Vite + React + React Router + TanStack Query |
| API | Hono on Node |
| Database | Postgres + Drizzle ORM |
| Auth | Better Auth |
| Payments | Stripe |
| Email | Resend + React Email |
| UI | shadcn/ui + Tailwind CSS |

## Prerequisites

- Node 22+ (`nvm use` picks it up from `.nvmrc`)
- pnpm 9+ (`npm install -g pnpm`)
- Docker (for local Postgres)

## Local setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres
pnpm db:up

# 3. Copy env files and fill in secrets
cp apps/api/.env.example apps/api/.env
# Fill in STRIPE_SECRET_KEY, RESEND_API_KEY, etc.

# 4. Push DB schema
pnpm db:push

# 5. Start dev servers
pnpm dev
```

Open:
- Dashboard: http://localhost:5173
- API: http://localhost:3001
- Marketing: http://localhost:4321

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:up` | Start local Postgres |
| `pnpm db:down` | Stop local Postgres |
| `pnpm db:push` | Push schema to DB (dev only) |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Branding

Find-and-replace before launch:
- `Praxor Kit` → your product name
- `@praxor-kit/*` → your package scope
- `kit.praxor.dev` → your domain

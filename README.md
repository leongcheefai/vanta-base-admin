# Vanta Base Admin

Bootstrap internal company tooling fast, without lock-in.

## Stack


| Layer     | Tech                                         |
| --------- | -------------------------------------------- |
| Monorepo  | pnpm + Turborepo                             |
| Dashboard | Vite + React + React Router + TanStack Query |
| API       | NestJS on Node (Express platform)            |
| Database  | Postgres + Drizzle ORM                       |
| Auth      | Better Auth                                  |
| Payments  | Stripe                                       |
| Email     | Resend + React Email                         |
| UI        | shadcn/ui + Tailwind CSS                     |


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

# 6. Install Claude Code GitHub App (enables AI-assisted PRs and code review)
# Run in Claude Code:
/install-github-app
```

Open:

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)

## Commands


| Command           | Description                  |
| ----------------- | ---------------------------- |
| `pnpm dev`        | Start all dev servers        |
| `pnpm build`      | Build all apps               |
| `pnpm lint`       | Lint all packages            |
| `pnpm typecheck`  | Type-check all packages      |
| `pnpm db:up`      | Start local Postgres         |
| `pnpm db:down`    | Stop local Postgres          |
| `pnpm db:push`    | Push schema to DB (dev only) |
| `pnpm db:migrate` | Run migrations               |
| `pnpm db:studio`  | Open Drizzle Studio          |


## Contributing

This repo uses [Matt Pocock's engineering skills](https://github.com/mattpocock/skills) for AI-assisted development. Follow the install instructions in that repo, then run `/setup-matt-pocock-skills` in Claude Code to configure the issue tracker and domain docs for this repo.

## Branding

Find-and-replace before launch:

- `Vanta Base Admin` → your product name
- `@vanta-base-admin/*` → your package scope
- `vanta-base-admin.dev` → your domain


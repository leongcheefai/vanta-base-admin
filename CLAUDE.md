# Praxor Kit

## Purpose
Praxor Kit is a production-ready SaaS boilerplate for indie hackers built on Vite + Hono + Better Auth. This root directory is the pnpm + Turborepo monorepo containing three apps (`web`, `app`, `api`) and six shared packages (`ui`, `db`, `auth`, `emails`, `env`, `config`).

## Conventions
- Package scope: `@praxor-kit/*`
- All env access via `packages/env` — never `process.env` directly
- Retheme by editing `packages/ui/src/styles/tokens.css` only — never the Tailwind config
- Lint/format: Biome only — no ESLint, no Prettier
- TypeScript strict everywhere — no `any`, no `@ts-ignore` without an inline justification comment
- Conventional commits: `feat:`, `chore:`, `fix:`, `docs:`
- New dependencies: check locked stack first — no Next.js, Prisma, Clerk, tRPC, ESLint, Prettier, Express, Fastify, NestJS

## Common tasks
- "Add a new app" → create `apps/<name>/`, add `package.json` with name `@praxor-kit/<name>`, add tsconfig extending `@praxor-kit/config/tsconfig`, register relevant turbo pipelines
- "Add a new package" → create `packages/<name>/`, add `package.json` with name `@praxor-kit/<name>`, run `pnpm install`
- "Start local DB" → `pnpm db:up`
- "Run everything locally" → `pnpm db:up && pnpm dev`
- "Run typecheck across all packages" → `pnpm typecheck`

## Gotchas
- `pnpm` only — never `npm install` or `yarn`
- All env must be validated through `@praxor-kit/env` — apps must not read `process.env` directly
- Turbo caches aggressively — run `turbo <task> --force` if output looks stale
- Brand placeholders to find-and-replace before launch: `Praxor Kit` (product name), `@praxor-kit/*` (package scope), `kit.praxor.dev` (domain)
- shadcn primitives live in `packages/ui/src/primitives` — add via `pnpm dlx shadcn@latest add <component>` run from `packages/ui`

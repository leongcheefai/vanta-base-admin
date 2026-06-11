# Vanta Base Admin

## Purpose
Vanta Base Admin — production-ready SaaS boilerplate. Vite + NestJS on Node (Express platform) + Better Auth. pnpm + Turborepo monorepo: three apps (`web`, `app`, `api`), six shared packages (`ui`, `db`, `auth`, `emails`, `env`, `config`).

## Conventions
- Package scope: `@vanta-base-admin/*`
- Env access via `packages/env` — never `process.env` directly
- Retheme: edit `packages/ui/src/styles/tokens.css` only — never Tailwind config
- Lint/format: Biome only — no ESLint, no Prettier
- TypeScript strict — no `any`, no `@ts-ignore` without inline justification
- Conventional commits: `feat:`, `chore:`, `fix:`, `docs:`
- New deps: check locked stack first — no Next.js, Prisma, Clerk, tRPC, ESLint, Prettier, Fastify

## Common tasks
- "Add new app" → create `apps/<name>/`, add `package.json` name `@vanta-base-admin/<name>`, add tsconfig extending `@vanta-base-admin/config/tsconfig`, register turbo pipelines
- "Add new package" → create `packages/<name>/`, add `package.json` name `@vanta-base-admin/<name>`, run `pnpm install`
- "Start local DB" → `pnpm db:up`
- "Run everything locally" → `pnpm db:up && pnpm dev`
- "Run typecheck" → `pnpm typecheck`
- "Before commit/push" → `pnpm lint && pnpm build` must both pass (auto-enforced via Claude Code hook)

## Gotchas
- `pnpm` only — never `npm install` or `yarn`
- Env validated through `@vanta-base-admin/env` — apps must not read `process.env` directly
- Turbo caches aggressively — run `turbo <task> --force` if output stale
- shadcn primitives in `packages/ui/src/primitives` — add via `pnpm dlx shadcn@latest add <component>` from `packages/ui`; export from `packages/ui/src/index.ts` after adding
- UI components: use shadcn from `@vanta-base-admin/ui` — never raw HTML inputs, selects, buttons, or dialogs if shadcn equivalent exists or can be added

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/leongcheefai/vanta-base-admin`). See `docs/agents/issue-tracker.md`.

### Triage labels

All five canonical triage roles use default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
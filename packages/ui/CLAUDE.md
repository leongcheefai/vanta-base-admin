# packages/ui

## Purpose
Shared React component library. Two layers: low-level shadcn `primitives` (`Button`, `Badge`, `Card`, `Input`, `Label`) and higher-level `patterns` (marketing sections and the dashboard shell). Also owns the single Tailwind v4 CSS entrypoint and all design tokens.

## Conventions
- Retheme by editing only `src/styles/tokens.css` — change the OKLCH values for `--primary`, `--accent`, etc. Never touch `src/styles/index.css` or any Tailwind config
- `src/index.ts` is the single export barrel — every new component must be added here
- No build step — consuming apps compile source directly via their bundler

## Common tasks

### Retheme / rebrand
Edit `src/styles/tokens.css`. All colors use OKLCH (`oklch(L C H)`). The current scheme is achromatic (chroma = 0). To add brand color, set a non-zero chroma on `--primary` and related tokens for both `:root` (light) and `.dark`.

### Add a shadcn primitive
```bash
cd packages/ui
pnpm dlx shadcn@latest add <component>
```
Then export the new component from `src/index.ts`. After adding, fix any package-relative imports (e.g. `@praxor-kit/ui/lib/utils`) to relative paths (`../lib/utils`) — shadcn CLI generates these incorrectly for in-package use.

### Add a new pattern component
1. Create `src/patterns/<name>.tsx`
2. Export from `src/index.ts`

## Gotchas
- No `tailwind.config.ts` — Tailwind v4 is entirely CSS-first; all token wiring is in `src/styles/index.css` under `@theme inline`
- `apps/web` needs `@source "../../../../packages/ui/src"` in its `global.css` for Tailwind to scan UI pattern class names — removing it causes classes to be purged
- `DashboardShell` takes a `renderNavLink` prop instead of hard-coding `<a>` tags — keeps it router-agnostic; pass React Router `<Link>` from the app
- Tokens map to Tailwind utilities via `@theme inline` in `index.css`: `--primary` → `bg-primary`, `text-primary`, etc.

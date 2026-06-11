# apps/web

## Purpose
Astro 5 marketing site, statically generated. Public-facing at `vanta-base-admin.dev`. No auth — purely content and conversion. Ships React islands for interactive sections and generates OG images at build time via Satori.

## Conventions
- Pages live in `src/pages/` as `.astro` files — use `BaseLayout` for consistent `<head>` SEO and OG meta
- Interactive sections are React islands in `src/components/*.tsx` — activate with `client:load` or `client:visible`
- All marketing copy lives in `src/components/LandingContent.tsx` and `src/components/PricingContent.tsx` — do not scatter copy into `.astro` files
- `PUBLIC_APP_URL` links the nav "Sign in" and "Get started" buttons to the dashboard — read via `import.meta.env` directly (not `@vanta-base-admin/env`, which is server-only)
- Tailwind utility classes from `@vanta-base-admin/ui` patterns are only generated because of the `@source` directive in `src/styles/global.css` — do not remove it

## Common tasks

### Update marketing copy
Edit `src/components/LandingContent.tsx` (hero, features, testimonials, FAQs) and `src/components/PricingContent.tsx`.

### Add a new page
1. Create `src/pages/<name>.astro`
2. Use `<BaseLayout>` — pass an `ogSlug` prop matching the page name
3. Add the slug to `STATIC_PAGES` in `src/pages/og/[slug].png.ts` so an OG image is generated

### Add a blog post
Create a markdown/MDX file in the `blog` content collection. OG image auto-generates.

### Change the domain / site URL
Update `site` in `astro.config.ts`.

## Gotchas
- Dev server runs on port 4321: `pnpm --filter @vanta-base-admin/web dev`
- Type-check with `astro check`, not `tsc`
- OG image generation (`src/pages/og/[slug].png.ts`) fetches fonts from jsDelivr at build time — offline builds fail; swap to `fs.readFileSync` for local testing
- React components are islands: they render static HTML by default; add a `client:*` directive in the `.astro` file to hydrate them

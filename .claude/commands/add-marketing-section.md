Add a new section to the marketing site in `apps/web`.

Ask the user for the section name, purpose, and where it should appear on the page, then:

1. Check if a suitable pattern component already exists in `packages/ui` — the available patterns are: `Hero`, `FeatureSection`, `LogoCloud`, `PricingCard`, `Testimonial`, `FAQ`. If one fits, use it directly.

2. If a new pattern is needed:
   - Create `packages/ui/src/patterns/<name>.tsx`
   - Export it from `packages/ui/src/index.ts`

3. Add the section to `apps/web/src/components/LandingContent.tsx` (or `PricingContent.tsx` for pricing-related content) in the correct position.

4. If the section needs interactivity (hover states, accordions, etc.), the component is already a React island because `LandingContent` is rendered with `client:load`. No extra setup needed.

5. Tailwind classes from new pattern components are only generated if the `@source` directive in `apps/web/src/styles/global.css` covers `packages/ui/src`. It does by default — do not remove it.

6. Run `pnpm typecheck` and start the dev server (`pnpm --filter @praxor-kit/web dev`) to verify the section renders correctly at `http://localhost:4321`.

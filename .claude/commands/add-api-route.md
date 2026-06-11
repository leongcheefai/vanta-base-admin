Add a new API route to `apps/api` following the module pattern.

Ask the user for the feature name and what HTTP methods/endpoints are needed, then:

1. Create `apps/api/src/modules/<feature>/` with three files:
   - `<feature>.schema.ts` — Zod schemas for request/response validation
   - `<feature>.service.ts` — business logic functions (no Hono imports)
   - `<feature>.routes.ts` — Hono router that validates input with `@hono/zod-validator`, calls service functions, and returns JSON responses

2. In `<feature>.routes.ts`, protect endpoints that require auth:
   ```ts
   const user = c.get('user')
   if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
   ```

3. Mount the router in `apps/api/src/lib/app.ts`:
   ```ts
   import { featureRouter } from '../modules/<feature>/<feature>.routes'
   app.route('/<feature>', featureRouter)
   ```

4. Run `pnpm typecheck` to verify no type errors.

Follow existing modules (`billing`, `me`) as reference for structure and patterns. All env access via `serverEnv` from `@vanta-base-admin/env` — never `process.env`.

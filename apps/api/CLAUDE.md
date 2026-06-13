# apps/api

## Purpose
NestJS API server on Node.js (Express platform). Handles auth (Better Auth) and all business logic. Runs on port 3001 in development. No billing/Stripe — internal tooling only.

## Conventions
- Every feature lives in `src/modules/<name>/` — four files: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `dto/<input>.dto.ts`
- All routes require auth by default (global `AuthGuard`). Public routes use `@Public()` from `src/common/decorators/public.decorator.ts`
- Use `@Body() dto: SomeDto` with class-validator DTOs for request validation — never trust `@Body()` without a typed DTO
- Auth user in controller: `@CurrentUser() user: SessionUser` from `src/common/decorators/current-user.decorator.ts`
- All env access via `@vanta-base-admin/env` (`serverEnv` export) — never `process.env`
- Better Auth routes handled by `AuthController` in `src/modules/auth/` — do not add auth routes elsewhere

## Common tasks

### Add a new API route
1. Create or extend `src/modules/<feature>/`
2. Add DTO in `dto/<input>.dto.ts` using class-validator decorators
3. Add business logic in `<feature>.service.ts` — `@Injectable()` class
4. Export a controller from `<feature>.controller.ts` — `@Controller('<feature>')`
5. Register in `<feature>.module.ts` and import in `src/app.module.ts`

### Test an endpoint manually
```bash
# Health check
curl http://localhost:3001/health

# Authenticated endpoint (requires session cookie)
curl http://localhost:3001/me -H "Cookie: <session-cookie>"
```

## Gotchas
- `rawBody: true` is still set in NestFactory.create — harmless if no webhook endpoints exist, but can be removed if desired

# Hono → NestJS Migration Design

**Date:** 2026-06-11
**Scope:** `apps/api` only — all other workspace packages unaffected

---

## Motivation

Replace Hono with NestJS in `apps/api` for scalability and conventions: guards, pipes, interceptors, and the NestJS module system to stay organized as the API grows.

---

## Approach

NestJS with `@nestjs/platform-express` (CJS). Drop `"type": "module"` from `apps/api/package.json`. Use `class-validator`/`class-transformer` for HTTP-layer validation. Convert service functions to `@Injectable()` classes. Build remains `tsup`, transpiled to CommonJS.

---

## File Structure

```
apps/api/src/
├── main.ts                                        # Bootstrap
├── app.module.ts                                  # Root module
├── common/
│   ├── guards/auth.guard.ts                       # CanActivate — session extraction
│   ├── decorators/current-user.decorator.ts       # @CurrentUser() param decorator
│   └── filters/http-exception.filter.ts           # ExceptionFilter — global error handler
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   └── auth.controller.ts                     # Better Auth pass-through
    ├── billing/
    │   ├── billing.module.ts
    │   ├── billing.controller.ts
    │   ├── billing.service.ts
    │   └── dto/
    │       ├── create-checkout.dto.ts
    │       └── create-portal.dto.ts
    ├── feedback/
    │   ├── feedback.module.ts
    │   ├── feedback.controller.ts
    │   ├── feedback.service.ts
    │   └── dto/create-feedback.dto.ts
    ├── health/
    │   ├── health.module.ts
    │   └── health.controller.ts
    ├── me/
    │   ├── me.module.ts
    │   └── me.controller.ts
    ├── metrics/
    │   ├── metrics.module.ts
    │   ├── metrics.controller.ts
    │   └── metrics.service.ts
    ├── releases/
    │   ├── releases.module.ts
    │   ├── releases.controller.ts
    │   ├── releases.service.ts
    │   └── dto/
    └── uploads/
        ├── uploads.module.ts
        ├── uploads.controller.ts
        ├── uploads.service.ts
        └── dto/create-presigned-url.dto.ts
```

Surviving unchanged: `src/lib/stripe.ts`, `src/lib/github.ts`, `src/lib/logger.ts`, `src/load-env.ts`.
Deleted: `src/lib/app.ts`, `src/lib/context.ts`, `src/middleware/auth.ts`, `src/middleware/error.ts`, `src/index.ts`.
All existing `*.schema.ts` files may be retained for internal service-layer type inference; they are no longer used for HTTP validation (replaced by DTOs).

---

## Dependencies

### Add
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/platform-express`
- `reflect-metadata`
- `class-validator`
- `class-transformer`

### Remove
- `hono`
- `@hono/node-server`
- `@hono/zod-validator`

### Retain
- `zod` (used in service-layer schemas and internal type inference)
- All other existing deps unchanged

---

## tsconfig Changes (`apps/api/tsconfig.json`)

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "CommonJS",
    "moduleResolution": "Node"
  }
}
```

---

## package.json Changes (`apps/api/package.json`)

- Remove `"type": "module"`
- Update build script: `"build": "tsup src/main.ts --format cjs --out-dir dist"`
- Update dev script: `"dev": "tsx watch src/main.ts"` (`reflect-metadata` imported at top of `main.ts` — no CLI flag needed)

---

## Bootstrap (`main.ts`)

```ts
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { serverEnv } from '@vanta-base-admin/env'
import './load-env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: [serverEnv.APP_URL, serverEnv.WEB_URL], credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(serverEnv.PORT)
  console.log(`API listening on http://localhost:${serverEnv.PORT}`)
}
bootstrap()
```

---

## Auth Guard (`common/guards/auth.guard.ts`)

Implements `CanActivate`. Calls `auth.api.getSession({ headers: request.headers })`, attaches `user` and `session` to the Express `request` object. Returns `false` (triggers `UnauthorizedException`) if no session. Applied per-controller or per-route via `@UseGuards(AuthGuard)`. The health controller and `AuthController` do not use this guard.

---

## `@CurrentUser()` Decorator (`common/decorators/current-user.decorator.ts`)

Custom param decorator that reads `request.user` from the Express request. Replaces all `c.get("user")` calls from the Hono pattern.

---

## Exception Filter (`common/filters/http-exception.filter.ts`)

Implements `ExceptionFilter`. Catches `HttpException` (from `@nestjs/common`) and all unhandled errors. Returns `{ error: message }` JSON — same shape as current Hono `errorHandler`. Logs unhandled errors via `lib/logger`.

---

## Better Auth Pass-Through (`modules/auth/auth.controller.ts`)

```ts
@Controller()
export class AuthController {
  @All('/api/auth/*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return auth.handler(req as unknown as globalThis.Request, res as unknown as globalThis.Response)
  }
}
```

Better Auth's handler accepts Web API `Request`/`Response`. Express `req`/`res` must be converted to Web API equivalents. Implementation will use `toWebRequest(req)` to construct a `globalThis.Request` from the Express request, then pipe the resulting Web `Response` back to Express `res`. This mirrors the current `app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))` pattern.

---

## Module Pattern (example: billing)

**`billing.module.ts`**
```ts
@Module({ controllers: [BillingController], providers: [BillingService] })
export class BillingModule {}
```

**`billing.controller.ts`**
```ts
@Controller('billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('config')
  getConfig() { return this.billingService.getBillingConfig() }

  @Post('checkout')
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user.id, dto)
  }

  @Post('webhook')
  // webhook route — AuthGuard not applied; controller-level @UseGuards can be overridden per-route
  // using a @Public() custom decorator that sets IS_PUBLIC_KEY metadata, read in AuthGuard.canActivate()
  handleWebhook(@Req() req: Request) { ... }
}
```

**`billing.service.ts`**
```ts
@Injectable()
export class BillingService {
  async createCheckoutSession(userId: string, input: CreateCheckoutDto) { ... }
  // Same logic as current billing.service.ts functions
}
```

**`dto/create-checkout.dto.ts`**
```ts
export class CreateCheckoutDto {
  @IsString() priceId: string
  @IsUrl() successUrl: string
  @IsUrl() cancelUrl: string
}
```

All 7 modules (billing, feedback, health, me, metrics, releases, uploads) follow this identical pattern.

---

## `AppModule`

```ts
@Module({
  imports: [
    AuthModule,
    BillingModule,
    FeedbackModule,
    HealthModule,
    MeModule,
    MetricsModule,
    ReleasesModule,
    UploadsModule,
  ],
})
export class AppModule {}
```

---

## CLAUDE.md Update

Remove NestJS from the locked-stack prohibition list. Update stack description from "Hono on Node" to "NestJS on Node (Express platform)". Update dev/build notes accordingly.

---

## README.md Update

Update the stack table: `API` row changes from `Hono on Node` to `NestJS on Node`.

---

## Out of Scope

- No changes to `apps/web`, `apps/app`, or any `packages/*`
- No changes to auth provider (Better Auth stays)
- No changes to DB layer (Drizzle stays)
- No OpenAPI/Swagger setup (not requested)
- No testing infrastructure changes

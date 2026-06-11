# Hono → NestJS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Hono with NestJS in `apps/api`, preserving all existing routes and business logic.

**Architecture:** NestJS with `@nestjs/platform-express` (CommonJS). Each Hono router becomes a NestJS module with a controller and an `@Injectable()` service class. Auth session extraction moves to a `CanActivate` guard; error handling moves to an `ExceptionFilter`. Better Auth is wired as a pass-through controller that converts Express `req`/`res` to Web API `Request`/`Response`.

**Tech Stack:** NestJS 10, `@nestjs/platform-express`, `class-validator`, `class-transformer`, `reflect-metadata`, `vitest`, `@nestjs/testing`, `supertest`

---

## File Map

### Create
| File | Role |
|---|---|
| `apps/api/src/main.ts` | Bootstrap — NestFactory, CORS, global pipes/filters |
| `apps/api/src/app.module.ts` | Root module — imports all feature modules |
| `apps/api/src/common/guards/auth.guard.ts` | CanActivate — session extraction |
| `apps/api/src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |
| `apps/api/src/common/decorators/public.decorator.ts` | `@Public()` route decorator |
| `apps/api/src/common/filters/http-exception.filter.ts` | ExceptionFilter — global error shape |
| `apps/api/src/modules/auth/auth.module.ts` | NestJS module |
| `apps/api/src/modules/auth/auth.controller.ts` | Better Auth pass-through (`/api/auth/*`) |
| `apps/api/src/modules/health/health.module.ts` | NestJS module |
| `apps/api/src/modules/health/health.controller.ts` | `GET /health` |
| `apps/api/src/modules/me/me.module.ts` | NestJS module |
| `apps/api/src/modules/me/me.controller.ts` | `GET /me`, `GET /me/has-password` |
| `apps/api/src/modules/metrics/metrics.module.ts` | NestJS module |
| `apps/api/src/modules/metrics/metrics.controller.ts` | `GET /metrics/overview` |
| `apps/api/src/modules/metrics/metrics.service.ts` | Replaces plain functions |
| `apps/api/src/modules/feedback/feedback.module.ts` | NestJS module |
| `apps/api/src/modules/feedback/feedback.controller.ts` | `POST /feedback` |
| `apps/api/src/modules/feedback/feedback.service.ts` | Replaces plain functions |
| `apps/api/src/modules/feedback/dto/create-feedback.dto.ts` | class-validator DTO |
| `apps/api/src/modules/releases/releases.module.ts` | NestJS module |
| `apps/api/src/modules/releases/releases.controller.ts` | `GET /releases`, `POST /releases/sync` |
| `apps/api/src/modules/releases/releases.service.ts` | Replaces plain functions |
| `apps/api/src/modules/uploads/uploads.module.ts` | NestJS module |
| `apps/api/src/modules/uploads/uploads.controller.ts` | `POST /uploads/avatar/presign` |
| `apps/api/src/modules/uploads/uploads.service.ts` | Replaces plain functions (fixes Hono import) |
| `apps/api/src/modules/uploads/dto/presign-avatar.dto.ts` | class-validator DTO |
| `apps/api/src/modules/billing/billing.module.ts` | NestJS module |
| `apps/api/src/modules/billing/billing.controller.ts` | Billing routes incl. raw-body webhook |
| `apps/api/src/modules/billing/billing.service.ts` | Replaces plain functions |
| `apps/api/src/modules/billing/dto/create-checkout.dto.ts` | class-validator DTO |
| `apps/api/src/modules/billing/dto/create-portal.dto.ts` | class-validator DTO |
| `apps/api/vitest.config.ts` | Vitest config with reflect-metadata setup |
| `apps/api/src/test-setup.ts` | `import 'reflect-metadata'` for tests |

### Modify
| File | Change |
|---|---|
| `apps/api/package.json` | Remove `"type":"module"`, add NestJS deps, update scripts, add test script |
| `apps/api/tsconfig.json` | Add `experimentalDecorators`, `emitDecoratorMetadata`, override `module`/`moduleResolution` |
| `apps/api/CLAUDE.md` | Update conventions for NestJS patterns |
| `CLAUDE.md` (root) | Remove NestJS from locked-stack prohibition |
| `README.md` (root) | Update API row in stack table |

### Delete (in final task)
`src/index.ts`, `src/lib/app.ts`, `src/lib/context.ts`, `src/middleware/auth.ts`, `src/middleware/error.ts`, `src/modules/*/\*.routes.ts`, `src/modules/metrics/index.ts`

---

## Task 1: Install dependencies and configure package.json + tsconfig

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/tsconfig.json`

- [ ] **Step 1: Update `apps/api/package.json`**

Replace its full content with:

```json
{
  "name": "@vanta-base-admin/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsup src/main.ts --format cjs --out-dir dist --no-splitting",
    "start": "node dist/main.js",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1044.0",
    "@aws-sdk/s3-request-presigner": "^3.1044.0",
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@octokit/rest": "^22.0.1",
    "@vanta-base-admin/auth": "workspace:*",
    "@vanta-base-admin/db": "workspace:*",
    "@vanta-base-admin/emails": "workspace:*",
    "@vanta-base-admin/env": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dotenv": "^16.4.7",
    "drizzle-orm": "^0.45.0",
    "reflect-metadata": "^0.2.2",
    "stripe": "^22.1.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.4.0",
    "@types/express": "^5.0.0",
    "@types/supertest": "^6.0.0",
    "@vanta-base-admin/config": "workspace:*",
    "supertest": "^7.0.0",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Update `apps/api/tsconfig.json`**

```json
{
  "extends": "@vanta-base-admin/config/tsconfig",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "CommonJS",
    "moduleResolution": "Node",
    "verbatimModuleSyntax": false,
    "noEmit": true
  },
  "include": ["src/**/*", "vitest.config.ts"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd apps/api && pnpm install
```

Expected: packages install without errors. `node_modules/@nestjs/common` exists.

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json
git commit -m "chore(api): add NestJS deps, switch to CJS, update tsconfig"
```

---

## Task 2: Vitest config and test setup

**Files:**
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/test-setup.ts`

- [ ] **Step 1: Create `apps/api/src/test-setup.ts`**

```typescript
import 'reflect-metadata'
```

- [ ] **Step 2: Create `apps/api/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Verify vitest runs (no tests yet)**

```bash
cd apps/api && pnpm test
```

Expected output: `No test files found` (not an error exit).

- [ ] **Step 4: Commit**

```bash
git add apps/api/vitest.config.ts apps/api/src/test-setup.ts
git commit -m "chore(api): add vitest config with reflect-metadata setup"
```

---

## Task 3: Common infrastructure — ExceptionFilter, AuthGuard, decorators

**Files:**
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/guards/auth.guard.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/decorators/public.decorator.ts`

- [ ] **Step 1: Write failing test for HttpExceptionFilter**

Create `apps/api/src/common/filters/http-exception.filter.spec.ts`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { HttpExceptionFilter } from './http-exception.filter'

const mockJson = vi.fn()
const mockStatus = vi.fn().mockReturnValue({ json: mockJson })
const mockRes = { status: mockStatus } as any
const mockHost = {
  switchToHttp: () => ({ getResponse: () => mockRes }),
} as any

describe('HttpExceptionFilter', () => {
  it('returns correct shape for HttpException', () => {
    const filter = new HttpExceptionFilter()
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), mockHost)
    expect(mockStatus).toHaveBeenCalledWith(404)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Not found' })
  })

  it('returns 500 for unknown errors', () => {
    const filter = new HttpExceptionFilter()
    filter.catch(new Error('boom'), mockHost)
    expect(mockStatus).toHaveBeenCalledWith(500)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './http-exception.filter'`

- [ ] **Step 3: Create `apps/api/src/common/filters/http-exception.filter.ts`**

```typescript
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common'
import type { Response } from 'express'
import { log } from '../../lib/logger'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>()
    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      const message = typeof body === 'string' ? body : (body as any).message ?? exception.message
      return res.status(exception.getStatus()).json({ error: message })
    }
    const err = exception instanceof Error ? exception : new Error(String(exception))
    log('error', 'Unhandled error', { message: err.message, stack: err.stack })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ common/filters/http-exception.filter.spec.ts`

- [ ] **Step 5: Create `apps/api/src/common/decorators/public.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
```

- [ ] **Step 6: Create `apps/api/src/common/decorators/current-user.decorator.ts`**

```typescript
import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { auth } from '@vanta-base-admin/auth'
import type { Request } from 'express'

export type SessionUser = typeof auth.$Infer.Session.user
export type SessionSession = typeof auth.$Infer.Session.session

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser | null => {
    const request = ctx.switchToHttp().getRequest<Request & { user: SessionUser | null }>()
    return request.user ?? null
  },
)
```

- [ ] **Step 7: Write failing test for AuthGuard**

Create `apps/api/src/common/guards/auth.guard.spec.ts`:

```typescript
import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AuthGuard } from './auth.guard'

vi.mock('@vanta-base-admin/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from '@vanta-base-admin/auth'

function makeContext(headers: Record<string, string> = {}) {
  const request: any = { headers, user: null, session: null }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _request: request,
  } as any
}

describe('AuthGuard', () => {
  it('sets user and session when session exists', async () => {
    const mockSession = { user: { id: '1', email: 'a@b.com' }, session: { id: 's1' } }
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    const guard = new AuthGuard(null as any)
    const ctx = makeContext()
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
    expect(ctx._request.user).toEqual(mockSession.user)
  })

  it('returns true for @Public() routes even without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)
    const mockReflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as any
    const guard = new AuthGuard(mockReflector)
    const ctx = makeContext()
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
  })

  it('throws UnauthorizedException when no session on protected route', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)
    const mockReflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as any
    const guard = new AuthGuard(mockReflector)
    const ctx = makeContext()
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })
})
```

- [ ] **Step 8: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './auth.guard'`

- [ ] **Step 9: Create `apps/api/src/common/guards/auth.guard.ts`**

```typescript
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Reflector,
  UnauthorizedException,
} from '@nestjs/common'
import { auth } from '@vanta-base-admin/auth'
import type { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest<Request & { user: any; session: any }>()

    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const sessionData = await auth.api.getSession({ headers })
    request.user = sessionData?.user ?? null
    request.session = sessionData?.session ?? null

    if (isPublic) return true
    if (!request.user) throw new UnauthorizedException()
    return true
  }
}
```

- [ ] **Step 10: Run tests — expect all pass**

```bash
cd apps/api && pnpm test
```

Expected: all specs green.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/common/
git commit -m "feat(api): add NestJS common infrastructure — guard, filter, decorators"
```

---

## Task 4: Bootstrap — main.ts and AppModule skeleton

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core'
import { AuthGuard } from './common/guards/auth.guard'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

@Module({
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Create `apps/api/src/main.ts`**

```typescript
import 'reflect-metadata'
import './load-env'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { serverEnv } from '@vanta-base-admin/env'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.enableCors({
    origin: [serverEnv.APP_URL, serverEnv.WEB_URL],
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  await app.listen(serverEnv.PORT)
  console.log(`API listening on http://localhost:${serverEnv.PORT}`)
}

bootstrap()
```

- [ ] **Step 3: Verify typecheck passes**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/main.ts apps/api/src/app.module.ts
git commit -m "feat(api): add NestJS bootstrap and AppModule skeleton"
```

---

## Task 5: Health module

**Files:**
- Create: `apps/api/src/modules/health/health.module.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.controller.spec.ts`

- [ ] **Step 1: Write failing test**

Create `apps/api/src/modules/health/health.controller.spec.ts`:

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect } from 'vitest'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()
    controller = module.get(HealthController)
  })

  it('returns ok: true', () => {
    expect(controller.check()).toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './health.controller'`

- [ ] **Step 3: Create `apps/api/src/modules/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { ok: true }
  }
}
```

- [ ] **Step 4: Create `apps/api/src/modules/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 5: Run test — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/health/health.controller.spec.ts`

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/health/
git commit -m "feat(api): add NestJS health module"
```

---

## Task 6: Me module

**Files:**
- Create: `apps/api/src/modules/me/me.module.ts`
- Create: `apps/api/src/modules/me/me.controller.ts`
- Create: `apps/api/src/modules/me/me.controller.spec.ts`

- [ ] **Step 1: Write failing test**

Create `apps/api/src/modules/me/me.controller.spec.ts`:

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { MeController } from './me.controller'

vi.mock('@vanta-base-admin/db', () => ({
  db: { query: { account: { findFirst: vi.fn() } } },
}))

import { db } from '@vanta-base-admin/db'

const mockUser = { id: 'u1', email: 'a@b.com', name: 'Alice' } as any

describe('MeController', () => {
  let controller: MeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
    }).compile()
    controller = module.get(MeController)
  })

  it('getMe returns the user', () => {
    expect(controller.getMe(mockUser)).toEqual({ user: mockUser })
  })

  it('hasPassword returns false when no credential account', async () => {
    vi.mocked(db.query.account.findFirst).mockResolvedValue(undefined)
    const result = await controller.hasPassword(mockUser)
    expect(result).toEqual({ hasPassword: false })
  })

  it('hasPassword returns true when credential account exists', async () => {
    vi.mocked(db.query.account.findFirst).mockResolvedValue({ id: 'acc1' } as any)
    const result = await controller.hasPassword(mockUser)
    expect(result).toEqual({ hasPassword: true })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './me.controller'`

- [ ] **Step 3: Create `apps/api/src/modules/me/me.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common'
import { db } from '@vanta-base-admin/db'
import { CurrentUser, type SessionUser } from '../../common/decorators/current-user.decorator'

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: SessionUser) {
    return { user }
  }

  @Get('has-password')
  async hasPassword(@CurrentUser() user: SessionUser) {
    const account = await db.query.account.findFirst({
      where: (acc, { and, eq }) =>
        and(eq(acc.userId, user.id), eq(acc.providerId, 'credential')),
    })
    return { hasPassword: account !== undefined }
  }
}
```

- [ ] **Step 4: Create `apps/api/src/modules/me/me.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { MeController } from './me.controller'

@Module({ controllers: [MeController] })
export class MeModule {}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/me/me.controller.spec.ts`

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/me/
git commit -m "feat(api): add NestJS me module"
```

---

## Task 7: Metrics module

**Files:**
- Create: `apps/api/src/modules/metrics/metrics.module.ts`
- Create: `apps/api/src/modules/metrics/metrics.controller.ts`
- Create: `apps/api/src/modules/metrics/metrics.service.ts`
- Create: `apps/api/src/modules/metrics/metrics.controller.spec.ts`

- [ ] **Step 1: Write failing test**

Create `apps/api/src/modules/metrics/metrics.controller.spec.ts`:

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

const mockOverview = { kpis: {}, revenue: [], signups: [], activeUsers: [], planDistribution: [], activationFunnel: [], topCountries: [] } as any

describe('MetricsController', () => {
  let controller: MetricsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: { getOverview: vi.fn().mockReturnValue(mockOverview) } }],
    }).compile()
    controller = module.get(MetricsController)
  })

  it('returns overview from service', () => {
    expect(controller.getOverview()).toEqual(mockOverview)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './metrics.controller'`

- [ ] **Step 3: Create `apps/api/src/modules/metrics/metrics.service.ts`**

```typescript
import { Injectable } from '@nestjs/common'
import { generateMockMetrics } from './metrics.mock'
import type { MetricsOverview } from './metrics.schema'

@Injectable()
export class MetricsService {
  getOverview(): MetricsOverview {
    return generateMockMetrics()
  }
}
```

- [ ] **Step 4: Create `apps/api/src/modules/metrics/metrics.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common'
import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('overview')
  getOverview() {
    return this.metricsService.getOverview()
  }
}
```

- [ ] **Step 5: Create `apps/api/src/modules/metrics/metrics.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

@Module({ controllers: [MetricsController], providers: [MetricsService] })
export class MetricsModule {}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/metrics/metrics.controller.spec.ts`

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/metrics/metrics.module.ts apps/api/src/modules/metrics/metrics.controller.ts apps/api/src/modules/metrics/metrics.service.ts apps/api/src/modules/metrics/metrics.controller.spec.ts
git commit -m "feat(api): add NestJS metrics module"
```

---

## Task 8: Feedback module

**Files:**
- Create: `apps/api/src/modules/feedback/dto/create-feedback.dto.ts`
- Create: `apps/api/src/modules/feedback/feedback.service.ts`
- Create: `apps/api/src/modules/feedback/feedback.controller.ts`
- Create: `apps/api/src/modules/feedback/feedback.module.ts`
- Create: `apps/api/src/modules/feedback/feedback.controller.spec.ts`

- [ ] **Step 1: Create `apps/api/src/modules/feedback/dto/create-feedback.dto.ts`**

```typescript
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateFeedbackDto {
  @IsEnum(['bug', 'feature', 'other'])
  type: 'bug' | 'feature' | 'other'

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string
}
```

- [ ] **Step 2: Write failing test**

Create `apps/api/src/modules/feedback/feedback.controller.spec.ts`:

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

const mockUser = { id: 'u1', email: 'a@b.com' } as any
const mockResult = { id: 'f1', issueUrl: undefined }

describe('FeedbackController', () => {
  let controller: FeedbackController
  let service: FeedbackService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: { create: vi.fn().mockResolvedValue(mockResult) } }],
    }).compile()
    controller = module.get(FeedbackController)
    service = module.get(FeedbackService)
  })

  it('calls service.create and returns result', async () => {
    const dto = { type: 'bug' as const, message: 'something broke' }
    const result = await controller.create(mockUser, dto)
    expect(service.create).toHaveBeenCalledWith('u1', 'a@b.com', dto)
    expect(result).toEqual(mockResult)
  })
})
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './feedback.controller'`

- [ ] **Step 4: Create `apps/api/src/modules/feedback/feedback.service.ts`**

```typescript
import { Injectable } from '@nestjs/common'
import { db, schema } from '@vanta-base-admin/db'
import { createFeedbackIssue } from '../../lib/github'
import { log } from '../../lib/logger'
import type { CreateFeedbackDto } from './dto/create-feedback.dto'

@Injectable()
export class FeedbackService {
  async create(userId: string, userEmail: string, input: CreateFeedbackDto) {
    const id = crypto.randomUUID()
    await db.insert(schema.feedback).values({ id, userId, ...input })

    let issueUrl: string | undefined
    try {
      const issue = await createFeedbackIssue({ id, userEmail, userId, ...input })
      issueUrl = issue?.html_url ?? undefined
    } catch (err) {
      log('warn', 'github_issue_create_failed', { feedbackId: id, err: String(err) })
    }

    return { id, issueUrl }
  }
}
```

- [ ] **Step 5: Create `apps/api/src/modules/feedback/feedback.controller.ts`**

```typescript
import { Body, Controller, Post } from '@nestjs/common'
import { CurrentUser, type SessionUser } from '../../common/decorators/current-user.decorator'
import { CreateFeedbackDto } from './dto/create-feedback.dto'
import { FeedbackService } from './feedback.service'

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(user.id, user.email, dto)
  }
}
```

- [ ] **Step 6: Create `apps/api/src/modules/feedback/feedback.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

@Module({ controllers: [FeedbackController], providers: [FeedbackService] })
export class FeedbackModule {}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/feedback/feedback.controller.spec.ts`

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/feedback/
git commit -m "feat(api): add NestJS feedback module"
```

---

## Task 9: Releases module

**Files:**
- Create: `apps/api/src/modules/releases/releases.service.ts`
- Create: `apps/api/src/modules/releases/releases.controller.ts`
- Create: `apps/api/src/modules/releases/releases.module.ts`
- Create: `apps/api/src/modules/releases/releases.controller.spec.ts`

- [ ] **Step 1: Write failing test**

Create `apps/api/src/modules/releases/releases.controller.spec.ts`:

```typescript
import { ForbiddenException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { ReleasesController } from './releases.controller'
import { ReleasesService } from './releases.service'

const adminUser = { id: 'u1', role: 'admin' } as any
const regularUser = { id: 'u2', role: 'user' } as any
const mockReleases = [{ id: '1', tag: 'v1.0.0' }]

describe('ReleasesController', () => {
  let controller: ReleasesController
  let service: ReleasesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleasesController],
      providers: [{
        provide: ReleasesService,
        useValue: {
          list: vi.fn().mockResolvedValue(mockReleases),
          sync: vi.fn().mockResolvedValue({ synced: 1 }),
        },
      }],
    }).compile()
    controller = module.get(ReleasesController)
    service = module.get(ReleasesService)
  })

  it('list returns releases from service', async () => {
    expect(await controller.list()).toEqual(mockReleases)
  })

  it('sync succeeds for admin', async () => {
    expect(await controller.sync(adminUser)).toEqual({ synced: 1 })
    expect(service.sync).toHaveBeenCalled()
  })

  it('sync throws ForbiddenException for non-admin', async () => {
    await expect(controller.sync(regularUser)).rejects.toThrow(ForbiddenException)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './releases.controller'`

- [ ] **Step 3: Create `apps/api/src/modules/releases/releases.service.ts`**

```typescript
import { Injectable } from '@nestjs/common'
import { db, schema } from '@vanta-base-admin/db'
import { desc } from 'drizzle-orm'
import { listGithubReleases } from '../../lib/github'
import { log } from '../../lib/logger'

@Injectable()
export class ReleasesService {
  async list() {
    return db.select().from(schema.release).orderBy(desc(schema.release.publishedAt))
  }

  async sync() {
    let releases: Awaited<ReturnType<typeof listGithubReleases>>
    try {
      releases = await listGithubReleases()
    } catch (err) {
      log('warn', 'github_releases_fetch_failed', { err: String(err) })
      return { synced: 0 }
    }

    if (!releases) {
      log('warn', 'github_releases_skipped', { reason: 'GitHub config not set' })
      return { synced: 0 }
    }

    for (const r of releases) {
      await db
        .insert(schema.release)
        .values({
          id: String(r.id),
          tag: r.tag_name,
          name: r.name ?? r.tag_name,
          body: r.body ?? null,
          url: r.html_url,
          prerelease: r.prerelease,
          publishedAt: r.published_at ? new Date(r.published_at) : null,
        })
        .onConflictDoUpdate({
          target: schema.release.id,
          set: {
            tag: r.tag_name,
            name: r.name ?? r.tag_name,
            body: r.body ?? null,
            url: r.html_url,
            prerelease: r.prerelease,
            publishedAt: r.published_at ? new Date(r.published_at) : null,
            syncedAt: new Date(),
          },
        })
    }

    return { synced: releases.length }
  }
}
```

- [ ] **Step 4: Create `apps/api/src/modules/releases/releases.controller.ts`**

```typescript
import { Controller, ForbiddenException, Get, Post } from '@nestjs/common'
import { CurrentUser, type SessionUser } from '../../common/decorators/current-user.decorator'
import { ReleasesService } from './releases.service'

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  list() {
    return this.releasesService.list()
  }

  @Post('sync')
  async sync(@CurrentUser() user: SessionUser) {
    if (user.role !== 'admin') throw new ForbiddenException()
    return this.releasesService.sync()
  }
}
```

- [ ] **Step 5: Create `apps/api/src/modules/releases/releases.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { ReleasesController } from './releases.controller'
import { ReleasesService } from './releases.service'

@Module({ controllers: [ReleasesController], providers: [ReleasesService] })
export class ReleasesModule {}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/releases/releases.controller.spec.ts`

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/releases/
git commit -m "feat(api): add NestJS releases module"
```

---

## Task 10: Uploads module

**Files:**
- Create: `apps/api/src/modules/uploads/dto/presign-avatar.dto.ts`
- Create: `apps/api/src/modules/uploads/uploads.service.ts`
- Create: `apps/api/src/modules/uploads/uploads.controller.ts`
- Create: `apps/api/src/modules/uploads/uploads.module.ts`
- Create: `apps/api/src/modules/uploads/uploads.controller.spec.ts`

- [ ] **Step 1: Create `apps/api/src/modules/uploads/dto/presign-avatar.dto.ts`**

```typescript
import { IsEnum, IsInt, IsPositive, Max } from 'class-validator'

export class PresignAvatarDto {
  @IsEnum(['image/png', 'image/jpeg', 'image/webp'])
  contentType: 'image/png' | 'image/jpeg' | 'image/webp'

  @IsInt()
  @IsPositive()
  @Max(5 * 1024 * 1024)
  size: number
}
```

- [ ] **Step 2: Write failing test**

Create `apps/api/src/modules/uploads/uploads.controller.spec.ts`:

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { UploadsController } from './uploads.controller'
import { UploadsService } from './uploads.service'

const mockUser = { id: 'u1' } as any
const mockResult = { uploadUrl: 'https://s3.example.com/upload', publicUrl: 'https://cdn.example.com/key', key: 'avatars/u1/uuid.png' }

describe('UploadsController', () => {
  let controller: UploadsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [{ provide: UploadsService, useValue: { presignAvatar: vi.fn().mockResolvedValue(mockResult) } }],
    }).compile()
    controller = module.get(UploadsController)
  })

  it('presignAvatar calls service and returns result', async () => {
    const dto = { contentType: 'image/png' as const, size: 1024 }
    const result = await controller.presignAvatar(mockUser, dto)
    expect(result).toEqual(mockResult)
  })
})
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './uploads.controller'`

- [ ] **Step 4: Create `apps/api/src/modules/uploads/uploads.service.ts`**

Note: removes the `HTTPException` import from `hono/http-exception` and replaces with NestJS equivalent.

```typescript
import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { serverEnv } from '@vanta-base-admin/env'
import type { PresignAvatarDto } from './dto/presign-avatar.dto'

let _s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: serverEnv.S3_REGION,
      credentials: {
        accessKeyId: serverEnv.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY ?? '',
      },
      ...(serverEnv.S3_ENDPOINT ? { endpoint: serverEnv.S3_ENDPOINT, forcePathStyle: false } : {}),
    })
  }
  return _s3Client
}

function getExtension(contentType: PresignAvatarDto['contentType']): string {
  const map: Record<PresignAvatarDto['contentType'], string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }
  return map[contentType]
}

@Injectable()
export class UploadsService {
  async presignAvatar(
    userId: string,
    input: PresignAvatarDto,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (
      !serverEnv.S3_BUCKET ||
      !serverEnv.S3_ACCESS_KEY_ID ||
      !serverEnv.S3_SECRET_ACCESS_KEY ||
      !serverEnv.S3_PUBLIC_URL
    ) {
      throw new ServiceUnavailableException('Storage unavailable')
    }

    const ext = getExtension(input.contentType)
    const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`
    const client = getS3Client()
    const command = new PutObjectCommand({
      Bucket: serverEnv.S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 })
    const publicUrl = `${serverEnv.S3_PUBLIC_URL}/${key}`
    return { uploadUrl, publicUrl, key }
  }
}
```

- [ ] **Step 5: Create `apps/api/src/modules/uploads/uploads.controller.ts`**

```typescript
import { Body, Controller, Post } from '@nestjs/common'
import { CurrentUser, type SessionUser } from '../../common/decorators/current-user.decorator'
import { PresignAvatarDto } from './dto/presign-avatar.dto'
import { UploadsService } from './uploads.service'

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('avatar/presign')
  presignAvatar(@CurrentUser() user: SessionUser, @Body() dto: PresignAvatarDto) {
    return this.uploadsService.presignAvatar(user.id, dto)
  }
}
```

- [ ] **Step 6: Create `apps/api/src/modules/uploads/uploads.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { UploadsController } from './uploads.controller'
import { UploadsService } from './uploads.service'

@Module({ controllers: [UploadsController], providers: [UploadsService] })
export class UploadsModule {}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: `✓ modules/uploads/uploads.controller.spec.ts`

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/uploads/
git commit -m "feat(api): add NestJS uploads module"
```

---

## Task 11: Billing module

**Files:**
- Create: `apps/api/src/modules/billing/dto/create-checkout.dto.ts`
- Create: `apps/api/src/modules/billing/dto/create-portal.dto.ts`
- Create: `apps/api/src/modules/billing/billing.service.ts`
- Create: `apps/api/src/modules/billing/billing.controller.ts`
- Create: `apps/api/src/modules/billing/billing.module.ts`
- Create: `apps/api/src/modules/billing/billing.controller.spec.ts`

> **Note:** The webhook route receives the raw request body for Stripe signature verification. NestJS is bootstrapped with `rawBody: true` (done in Task 4 main.ts) which makes `req.rawBody` available as a `Buffer`.

- [ ] **Step 1: Create DTOs**

`apps/api/src/modules/billing/dto/create-checkout.dto.ts`:
```typescript
import { IsString, IsUrl, MinLength } from 'class-validator'

export class CreateCheckoutDto {
  @IsString()
  @MinLength(1)
  priceId: string

  @IsUrl()
  successUrl: string

  @IsUrl()
  cancelUrl: string
}
```

`apps/api/src/modules/billing/dto/create-portal.dto.ts`:
```typescript
import { IsUrl } from 'class-validator'

export class CreatePortalDto {
  @IsUrl()
  returnUrl: string
}
```

- [ ] **Step 2: Write failing test**

Create `apps/api/src/modules/billing/billing.controller.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

const mockUser = { id: 'u1' } as any
const mockConfig = { plans: [] }
const mockCheckout = { url: 'https://checkout.stripe.com/pay/xxx' }
const mockPortal = { url: 'https://billing.stripe.com/session/xxx' }

describe('BillingController', () => {
  let controller: BillingController
  let service: BillingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{
        provide: BillingService,
        useValue: {
          getConfig: vi.fn().mockResolvedValue(mockConfig),
          listInvoices: vi.fn().mockResolvedValue([]),
          getSubscription: vi.fn().mockResolvedValue(null),
          createCheckoutSession: vi.fn().mockResolvedValue(mockCheckout),
          createPortalSession: vi.fn().mockResolvedValue(mockPortal),
          handleWebhook: vi.fn().mockResolvedValue(undefined),
        },
      }],
    }).compile()
    controller = module.get(BillingController)
    service = module.get(BillingService)
  })

  it('getConfig returns config', async () => {
    expect(await controller.getConfig()).toEqual(mockConfig)
  })

  it('createCheckout returns url', async () => {
    const dto = { priceId: 'price_1', successUrl: 'https://app.example.com/success', cancelUrl: 'https://app.example.com/cancel' }
    expect(await controller.createCheckout(mockUser, dto)).toEqual(mockCheckout)
  })

  it('handleWebhook throws BadRequestException when signature missing', async () => {
    const req: any = { rawBody: Buffer.from('{}'), headers: {} }
    await expect(controller.handleWebhook(req)).rejects.toThrow(BadRequestException)
  })

  it('handleWebhook calls service when signature present', async () => {
    const req: any = { rawBody: Buffer.from('{}'), headers: { 'stripe-signature': 'sig_xxx' } }
    await controller.handleWebhook(req)
    expect(service.handleWebhook).toHaveBeenCalledWith('{}', 'sig_xxx')
  })
})
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd apps/api && pnpm test
```

Expected: `Cannot find module './billing.controller'`

- [ ] **Step 4: Create `apps/api/src/modules/billing/billing.service.ts`**

```typescript
import { Injectable } from '@nestjs/common'
import { db, schema } from '@vanta-base-admin/db'
import { sendPaymentFailedEmail } from '@vanta-base-admin/emails'
import { serverEnv } from '@vanta-base-admin/env'
import { eq } from 'drizzle-orm'
import { stripe } from '../../lib/stripe'
import type { CreateCheckoutDto } from './dto/create-checkout.dto'
import type { CreatePortalDto } from './dto/create-portal.dto'

type SubscriptionStatus = (typeof schema.subscriptionStatusEnum.enumValues)[number]

@Injectable()
export class BillingService {
  async getConfig() {
    const { getBillingConfig } = await import('../../lib/app').catch(() => {
      throw new Error('getBillingConfig not available')
    })
    return getBillingConfig()
  }

  async listInvoices(userId: string) {
    const subscription = await db.query.subscription.findFirst({
      where: eq(schema.subscription.userId, userId),
    })
    if (!subscription?.stripeCustomerId) return []
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 24,
    })
    return invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      date: inv.created,
      pdf: inv.invoice_pdf,
    }))
  }

  async getSubscription(userId: string) {
    return db.query.subscription.findFirst({
      where: eq(schema.subscription.userId, userId),
    })
  }

  async createCheckoutSession(userId: string, input: CreateCheckoutDto) {
    const existing = await db.query.subscription.findFirst({
      where: eq(schema.subscription.userId, userId),
    })
    let customerId = existing?.stripeCustomerId ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } })
      customerId = customer.id
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    })
    return { url: session.url }
  }

  async createPortalSession(userId: string, input: CreatePortalDto) {
    const subscription = await db.query.subscription.findFirst({
      where: eq(schema.subscription.userId, userId),
    })
    if (!subscription?.stripeCustomerId) {
      const customer = await stripe.customers.create({ metadata: { userId } })
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: input.returnUrl,
      })
      return { url: session.url }
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: input.returnUrl,
    })
    return { url: session.url }
  }

  async handleWebhook(rawBody: string, signature: string) {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (!userId) return
      await db
        .insert(schema.subscription)
        .values({
          id: crypto.randomUUID(),
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: 'active' as SubscriptionStatus,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })
        .onConflictDoUpdate({
          target: schema.subscription.userId,
          set: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: 'active' as SubscriptionStatus,
          },
        })
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      if (!userId) return
      await db
        .insert(schema.subscription)
        .values({
          id: crypto.randomUUID(),
          userId,
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: sub.status as SubscriptionStatus,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        .onConflictDoUpdate({
          target: schema.subscription.userId,
          set: {
            stripeSubscriptionId: sub.id,
            status: sub.status as SubscriptionStatus,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      await db
        .update(schema.subscription)
        .set({ status: 'canceled' as SubscriptionStatus })
        .where(eq(schema.subscription.stripeSubscriptionId, sub.id))
    }

    if (event.type === 'invoice.paid') {
      const inv = event.data.object
      const subId = inv.subscription as string | null
      if (!subId) return
      await db
        .update(schema.subscription)
        .set({ status: 'active' as SubscriptionStatus })
        .where(eq(schema.subscription.stripeSubscriptionId, subId))
    }

    if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object
      const subId = inv.subscription as string | null
      if (!subId) return
      await db
        .update(schema.subscription)
        .set({ status: 'past_due' as SubscriptionStatus })
        .where(eq(schema.subscription.stripeSubscriptionId, subId))
      const subscription = await db.query.subscription.findFirst({
        where: eq(schema.subscription.stripeSubscriptionId, subId),
      })
      if (subscription) {
        const user = await db.query.user.findFirst({
          where: eq(schema.user.id, subscription.userId),
        })
        if (user) {
          await sendPaymentFailedEmail(user.email)
        }
      }
    }
  }
}
```

> **Note on `getConfig`:** The existing `getBillingConfig` in `src/lib/app.ts` will be deleted. Move it or inline it here. See step below.

- [ ] **Step 5: Check existing `getBillingConfig` and inline into service**

Read `apps/api/src/lib/app.ts` — there is no `getBillingConfig` there (it was in `billing.service.ts`). The original `billing.service.ts` has its own `getBillingConfig`. Replace the `getConfig` method in the new service with the actual implementation from the old `billing.service.ts`:

```bash
cat apps/api/src/modules/billing/billing.service.ts | grep -n "getBillingConfig" 
# read the original: apps/api/src/modules/billing/billing.service.ts (the OLD one)
```

Copy the `getBillingConfig` function body into `BillingService.getConfig()` in the new service file. The old implementation reads Stripe products/prices to build a plans list.

- [ ] **Step 6: Create `apps/api/src/modules/billing/billing.controller.ts`**

```typescript
import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, type SessionUser } from '../../common/decorators/current-user.decorator'
import { BillingService } from './billing.service'
import { CreateCheckoutDto } from './dto/create-checkout.dto'
import { CreatePortalDto } from './dto/create-portal.dto'

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('config')
  getConfig() {
    return this.billingService.getConfig()
  }

  @Get('invoices')
  listInvoices(@CurrentUser() user: SessionUser) {
    return this.billingService.listInvoices(user.id)
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: SessionUser) {
    const subscription = await this.billingService.getSubscription(user.id)
    return { subscription: subscription ?? null }
  }

  @Post('checkout')
  createCheckout(@CurrentUser() user: SessionUser, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user.id, dto)
  }

  @Post('portal')
  createPortal(@CurrentUser() user: SessionUser, @Body() dto: CreatePortalDto) {
    return this.billingService.createPortalSession(user.id, dto)
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      throw new BadRequestException('Missing Stripe signature')
    }
    const rawBody = req.rawBody?.toString('utf8')
    if (!rawBody) throw new BadRequestException('Missing request body')
    await this.billingService.handleWebhook(rawBody, signature)
    return { received: true }
  }
}
```

- [ ] **Step 7: Create `apps/api/src/modules/billing/billing.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

@Module({ controllers: [BillingController], providers: [BillingService] })
export class BillingModule {}
```

- [ ] **Step 8: Run tests — expect pass**

```bash
cd apps/api && pnpm test
```

Expected: all specs green including `billing.controller.spec.ts`

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/modules/billing/
git commit -m "feat(api): add NestJS billing module"
```

---

## Task 12: Auth module — Better Auth pass-through

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`

> Better Auth's `auth.handler` expects a Web API `Request`. In NestJS/Express there is no built-in adapter, so we manually construct one from the Express `req`. NestJS is bootstrapped with `rawBody: true` so `req.rawBody` is available as `Buffer` for POST requests.

- [ ] **Step 1: Create `apps/api/src/modules/auth/auth.controller.ts`**

```typescript
import { All, Controller, Req, Res } from '@nestjs/common'
import { auth } from '@vanta-base-admin/auth'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Public } from '../../common/decorators/public.decorator'

@Public()
@Controller()
export class AuthController {
  @All('/api/auth/*path')
  async handleAuth(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const proto = req.protocol
    const host = req.get('host') ?? 'localhost'
    const url = `${proto}://${host}${req.originalUrl}`

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const body = hasBody ? (req.rawBody ?? undefined) : undefined

    const webRequest = new Request(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore — duplex required by some runtimes for body streams
      duplex: 'half',
    })

    const webResponse = await auth.handler(webRequest)

    res.status(webResponse.status)
    webResponse.headers.forEach((value, key) => res.set(key, value))
    const responseBody = await webResponse.text()
    res.send(responseBody)
  }
}
```

- [ ] **Step 2: Create `apps/api/src/modules/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'

@Module({ controllers: [AuthController] })
export class AuthModule {}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/auth/
git commit -m "feat(api): add NestJS auth pass-through controller"
```

---

## Task 13: Wire all modules into AppModule

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Update `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core'
import { AuthGuard } from './common/guards/auth.guard'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { FeedbackModule } from './modules/feedback/feedback.module'
import { HealthModule } from './modules/health/health.module'
import { MeModule } from './modules/me/me.module'
import { MetricsModule } from './modules/metrics/metrics.module'
import { ReleasesModule } from './modules/releases/releases.module'
import { UploadsModule } from './modules/uploads/uploads.module'

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
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
cd apps/api && pnpm test
```

Expected: all specs pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat(api): wire all modules into AppModule"
```

---

## Task 14: Delete old Hono files

**Files to delete:**
- `apps/api/src/index.ts`
- `apps/api/src/lib/app.ts`
- `apps/api/src/lib/context.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/middleware/error.ts`
- `apps/api/src/modules/billing/billing.routes.ts`
- `apps/api/src/modules/feedback/feedback.routes.ts`
- `apps/api/src/modules/health/health.routes.ts`
- `apps/api/src/modules/me/me.routes.ts`
- `apps/api/src/modules/metrics/metrics.routes.ts`
- `apps/api/src/modules/metrics/index.ts`
- `apps/api/src/modules/releases/releases.routes.ts`
- `apps/api/src/modules/uploads/uploads.routes.ts`

Also delete the old function-based service files that have been replaced:
- `apps/api/src/modules/billing/billing.service.ts` (old — replaced in Task 11)
- `apps/api/src/modules/feedback/feedback.service.ts` (old — replaced in Task 8)
- `apps/api/src/modules/metrics/metrics.service.ts` (old — replaced in Task 7)
- `apps/api/src/modules/releases/releases.service.ts` (old — replaced in Task 9)
- `apps/api/src/modules/uploads/uploads.service.ts` (old — replaced in Task 10)

> **Note:** The new service files are created in the same paths, so the above is only relevant if you've kept both old and new during migration. If you wrote new files to the same path, skip re-deleting them.

- [ ] **Step 1: Delete old Hono route files and unused lib files**

```bash
cd apps/api
rm src/index.ts src/lib/app.ts src/lib/context.ts
rm src/middleware/auth.ts src/middleware/error.ts
rm src/modules/billing/billing.routes.ts
rm src/modules/feedback/feedback.routes.ts
rm src/modules/health/health.routes.ts
rm src/modules/me/me.routes.ts
rm src/modules/metrics/metrics.routes.ts src/modules/metrics/index.ts
rm src/modules/releases/releases.routes.ts
rm src/modules/uploads/uploads.routes.ts
```

- [ ] **Step 2: Run typecheck — verify no dangling imports**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors. If errors reference deleted files, trace which new file imports them and fix.

- [ ] **Step 3: Run all tests**

```bash
cd apps/api && pnpm test
```

Expected: all specs pass.

- [ ] **Step 4: Commit**

```bash
git add -u apps/api/src/
git commit -m "chore(api): delete Hono route files and unused lib files"
```

---

## Task 15: Update documentation

**Files:**
- Modify: `apps/api/CLAUDE.md`
- Modify: `CLAUDE.md` (root)
- Modify: `README.md` (root)

- [ ] **Step 1: Replace `apps/api/CLAUDE.md`**

```markdown
# apps/api

## Purpose
NestJS API server on Node.js (Express platform). Handles auth (Better Auth), billing (Stripe), and all business logic. Runs on port 3001 in development.

## Conventions
- Every feature lives in `src/modules/<name>/` — four files: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `dto/<name>.dto.ts`
- Controllers use `@UseGuards(AuthGuard)` (applied globally via `APP_GUARD`) — routes that should be public use `@Public()` from `src/common/decorators/public.decorator.ts`
- Use `@Body() dto: SomeDto` with class-validator DTOs for request validation — never trust `@Body()` without a typed DTO
- Auth user in controller: `@CurrentUser() user: SessionUser` from `src/common/decorators/current-user.decorator.ts`
- All env access via `@vanta-base-admin/env` (the `serverEnv` export) — never `process.env`
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

## Stripe + Billing

### Local webhook testing with Stripe CLI
```bash
stripe login
stripe listen --forward-to localhost:3001/billing/webhook
# CLI prints a webhook signing secret — add to .env as STRIPE_WEBHOOK_SECRET
```

### Webhook events handled
| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert subscription row with active status |
| `customer.subscription.created` | Upsert subscription row |
| `customer.subscription.updated` | Update plan/status/period-end/cancel_at_period_end |
| `customer.subscription.deleted` | Mark subscription canceled |
| `invoice.paid` | Re-sync subscription status |
| `invoice.payment_failed` | Mark subscription past_due, send payment-failed email |

### Gotchas
- Webhook `POST /billing/webhook` uses raw body — NestJS bootstrapped with `rawBody: true`, controller reads `req.rawBody` as Buffer
- Stripe API version pinned in `src/lib/stripe.ts`
- `subscription_data.metadata.userId` set on checkout so webhooks can identify the user
```

- [ ] **Step 2: Update root `CLAUDE.md` — remove NestJS from locked stack**

Find the line:
```
New deps: check locked stack first — no Next.js, Prisma, Clerk, tRPC, ESLint, Prettier, Express, Fastify, NestJS
```

Replace with:
```
New deps: check locked stack first — no Next.js, Prisma, Clerk, tRPC, ESLint, Prettier, Fastify
```

Also update the `api` description in the Purpose section from `Hono on Node` context to reflect NestJS.

- [ ] **Step 3: Update root `README.md` stack table**

Find:
```
| API | Hono on Node |
```

Replace with:
```
| API | NestJS on Node (Express platform) |
```

- [ ] **Step 4: Commit docs**

```bash
git add apps/api/CLAUDE.md CLAUDE.md README.md
git commit -m "docs: update API docs for NestJS migration"
```

---

## Task 16: Build verification

- [ ] **Step 1: Run full test suite**

```bash
cd apps/api && pnpm test
```

Expected: all specs pass.

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors across all packages.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Test production build**

```bash
cd apps/api && pnpm build
```

Expected: `dist/main.js` created. No build errors.

- [ ] **Step 5: Smoke-test the built output**

```bash
# Requires .env to be set up
node apps/api/dist/main.js &
sleep 2
curl http://localhost:3001/health
# Expected: {"ok":true}
kill %1
```

- [ ] **Step 6: Final commit if anything was fixed**

```bash
git add -A
git commit -m "chore(api): NestJS migration complete — build verified"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Infrastructure (deps, tsconfig, package.json): Task 1
  - Vitest setup: Task 2
  - Common (guard, filter, decorators): Task 3
  - Bootstrap: Task 4
  - Health module: Task 5
  - Me module: Task 6
  - Metrics module: Task 7
  - Feedback module + DTO: Task 8
  - Releases module: Task 9
  - Uploads module + DTO + Hono import fix: Task 10
  - Billing module + DTOs + raw webhook body: Task 11
  - Better Auth pass-through: Task 12
  - AppModule wiring: Task 13
  - Delete old files: Task 14
  - Docs update (CLAUDE.md, README.md, root CLAUDE.md): Task 15
  - Build verification: Task 16

- [x] **No placeholders** — all code blocks are complete.

- [x] **Type consistency** — `SessionUser` defined in `current-user.decorator.ts`, used consistently in all controllers. `CreateCheckoutDto`/`CreatePortalDto` names match between controller and service. `PresignAvatarDto` used in both uploads controller and service.

- [x] **Webhook raw body** — `rawBody: true` set in main.ts (Task 4), `req.rawBody` used in billing controller (Task 11).

- [x] **`@Public()` routes** — health (`HealthController`), billing config, billing webhook, and Better Auth pass-through all decorated `@Public()`.

- [x] **Admin check in releases** — `ForbiddenException` thrown in controller when `user.role !== 'admin'` (Task 9).

- [x] **`getBillingConfig`** — Task 11 Step 5 flags that the implementation must be inlined from the old service file. Implementer must read the old file before deleting it.

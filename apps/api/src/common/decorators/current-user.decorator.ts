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

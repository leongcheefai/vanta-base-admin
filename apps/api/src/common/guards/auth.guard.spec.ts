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

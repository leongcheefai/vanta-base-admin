import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from '@praxor-kit/auth'
import { serverEnv } from '@praxor-kit/env'
import type { AppVariables } from './context'
import { errorHandler } from '../middleware/error'
import { sessionMiddleware } from '../middleware/auth'
import { healthRouter } from '../modules/health/health.routes'
import { meRouter } from '../modules/me/me.routes'

export const app = new Hono<{ Variables: AppVariables }>()

app.use('*', logger())
app.use('*', cors({ origin: serverEnv.APP_URL, credentials: true }))
app.use('*', sessionMiddleware)
app.onError(errorHandler)

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.route('/health', healthRouter)
app.route('/me', meRouter)

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
import { billingRouter } from '../modules/billing/billing.routes'
import { feedbackRouter } from '../modules/feedback/feedback.routes'

export const app = new Hono<{ Variables: AppVariables }>()

app.use('*', logger())
app.use('*', cors({ origin: serverEnv.APP_URL, credentials: true }))
app.use('*', sessionMiddleware)
app.onError(errorHandler)

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.route('/health', healthRouter)
app.route('/me', meRouter)
app.route('/billing', billingRouter)
app.route('/feedback', feedbackRouter)

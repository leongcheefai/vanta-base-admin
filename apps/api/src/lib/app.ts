import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from '../middleware/error'
import { healthRouter } from '../modules/health/health.routes'

export const app = new Hono()

app.use('*', logger())
app.use('*', cors())
app.onError(errorHandler)

app.route('/health', healthRouter)

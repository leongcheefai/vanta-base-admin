import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { log } from '../lib/logger'

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  log('error', 'Unhandled error', { message: err.message, stack: err.stack })
  return c.json({ error: 'Internal server error' }, 500)
}

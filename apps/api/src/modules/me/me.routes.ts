import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppVariables } from '../../lib/context'

export const meRouter = new Hono<{ Variables: AppVariables }>()

meRouter.get('/', (c) => {
  const user = c.get('user')
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
  return c.json({ user })
})

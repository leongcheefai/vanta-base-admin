import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import type { AppVariables } from '../../lib/context'
import { presignAvatarSchema } from './uploads.schema'
import { presignAvatarUpload } from './uploads.service'

export const uploadsRouter = new Hono<{ Variables: AppVariables }>()

uploadsRouter.post('/avatar/presign', zValidator('json', presignAvatarSchema), async (c) => {
  const user = c.get('user')
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
  const input = c.req.valid('json')
  const result = await presignAvatarUpload(user.id, input)
  return c.json(result)
})

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

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

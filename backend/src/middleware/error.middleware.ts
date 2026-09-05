import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { fail, HttpError } from '../utils/apiResponse.js'

export function notFound(req: Request, res: Response) {
  return fail(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return

  if (err instanceof ZodError) {
    return fail(res, { statusCode: 400, message: 'Validation failed', errors: err.flatten() })
  }

  if (err instanceof HttpError) {
    return fail(res, { statusCode: err.statusCode, message: err.message, errors: err.errors })
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error'
  console.error('[error]', err)
  return fail(res, { statusCode: 500, message })
}

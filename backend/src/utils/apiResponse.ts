import type { Response } from 'express'

interface SuccessArgs {
  message: string
  data?: unknown
  meta?: unknown
  statusCode?: number
}

interface ErrorArgs {
  message: string
  errors?: unknown
  statusCode?: number
}

export function ok(res: Response, { message, data, meta, statusCode = 200 }: SuccessArgs) {
  const payload: Record<string, unknown> = { success: true, message }
  if (data !== undefined) payload.data = data
  if (meta !== undefined) payload.meta = meta
  return res.status(statusCode).json(payload)
}

export function fail(res: Response, { message, errors, statusCode = 500 }: ErrorArgs) {
  const payload: Record<string, unknown> = { success: false, message }
  if (errors !== undefined) payload.errors = errors
  return res.status(statusCode).json(payload)
}

// Throwable error that carries an HTTP status. Caught by errorHandler.
export class HttpError extends Error {
  statusCode: number
  errors?: unknown
  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
  }
}

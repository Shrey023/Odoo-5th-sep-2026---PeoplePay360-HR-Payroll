import type { Request, Response } from 'express'

import * as authService from '../services/auth.service.js'
import { ok } from '../utils/apiResponse.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body)
  const result = await authService.register(input)
  ok(res, { statusCode: 201, message: 'Registered', data: result })
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body)
  const result = await authService.login(input)
  ok(res, { message: 'Logged in', data: result })
}

export async function me(req: Request, res: Response) {
  const result = await authService.me(req.user!.id)
  ok(res, { message: 'Current user', data: result })
}

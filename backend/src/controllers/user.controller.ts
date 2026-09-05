import type { Request, Response } from 'express'

import * as userService from '../services/user.service.js'
import { ok } from '../utils/apiResponse.js'
import { createUserSchema, updateUserRolesSchema } from '../validators/user.validator.js'

export async function list(req: Request, res: Response) {
  const data = await userService.list()
  ok(res, { message: 'Users', data })
}

export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body)
  const data = await userService.create(input)
  ok(res, { statusCode: 201, message: 'User created', data })
}

export async function updateRoles(req: Request, res: Response) {
  const input = updateUserRolesSchema.parse(req.body)
  const data = await userService.updateRoles(req.params.id, req.user!.id, input)
  ok(res, { message: 'User roles updated', data })
}

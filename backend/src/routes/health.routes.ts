import { Router } from 'express'

import { prisma } from '../config/prisma.js'
import { ok } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const healthRouter = Router()

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`
    ok(res, { message: 'PeoplePay360 API healthy', data: { db: 'up' } })
  }),
)

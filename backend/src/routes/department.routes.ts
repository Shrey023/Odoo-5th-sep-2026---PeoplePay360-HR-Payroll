import { Router } from 'express'

import { prisma } from '../config/prisma.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { ok } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const departmentRouter = Router()

departmentRouter.use(authenticate)

departmentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { company: { select: { id: true, name: true } } },
    })
    ok(res, { message: 'Departments', data })
  }),
)

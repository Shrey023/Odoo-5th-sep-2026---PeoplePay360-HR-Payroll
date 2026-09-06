import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../config/prisma.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
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

departmentRouter.post(
  '/',
  authorize(...HR_ROLES),
  asyncHandler(async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body)
    const company = await prisma.company.findFirst()
    const data = await prisma.department.create({
      data: { name, companyId: company!.id },
      include: { company: { select: { id: true, name: true } } },
    })
    ok(res, { statusCode: 201, message: 'Department created', data })
  }),
)

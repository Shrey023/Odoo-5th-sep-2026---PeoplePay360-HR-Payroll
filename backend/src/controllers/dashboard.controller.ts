import type { EmployeeType } from '@prisma/client'
import type { Request, Response } from 'express'

import * as dashboardService from '../services/dashboard.service.js'
import { ok } from '../utils/apiResponse.js'

const EMPLOYEE_TYPES: EmployeeType[] = ['FULL_TIME', 'CONTRACTOR', 'INTERN']

export async function summary(req: Request, res: Response) {
  const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined
  const rawType = req.query.employeeType
  const employeeType =
    typeof rawType === 'string' && EMPLOYEE_TYPES.includes(rawType as EmployeeType)
      ? (rawType as EmployeeType)
      : undefined

  const data = await dashboardService.getDashboard({ departmentId, employeeType })
  ok(res, { message: 'Dashboard', data })
}

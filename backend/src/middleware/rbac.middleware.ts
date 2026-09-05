import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@prisma/client'

import { fail } from '../utils/apiResponse.js'

// Route guard: allow only the listed roles. Enforced on the server, not just the UI.
export function authorize(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, { statusCode: 401, message: 'Authentication required' })
    }
    if (!req.user.roles.some((r) => allowed.includes(r))) {
      return fail(res, { statusCode: 403, message: 'You do not have permission for this action' })
    }
    return next()
  }
}

// Handy role bundles mapped from the PS role table.
export const HR_ROLES: UserRole[] = [
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
]
export const PAYROLL_WRITE_ROLES: UserRole[] = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']
export const PAYROLL_CONFIG_ROLES: UserRole[] = ['HR_PAYROLL_MANAGER', 'ADMIN']

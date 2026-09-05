import { Router } from 'express'

import * as controller from '../controllers/payrun.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, PAYROLL_WRITE_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const payrunRouter = Router()

payrunRouter.use(authenticate)

payrunRouter.get('/', asyncHandler(controller.list))
payrunRouter.get('/payslips/all', asyncHandler(controller.listAllPayslips))
payrunRouter.get('/payslips/mine', asyncHandler(controller.listMyPayslips))
payrunRouter.get('/payslips/:payslipId/pdf', asyncHandler(controller.downloadPayslip))
payrunRouter.get('/payslips/:payslipId', asyncHandler(controller.getPayslip))
payrunRouter.get('/:id', asyncHandler(controller.getOne))

payrunRouter.post('/', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.create))
payrunRouter.patch('/:id', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.update))
payrunRouter.delete('/:id', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.remove))

payrunRouter.post('/:id/compute', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.compute))
payrunRouter.post('/:id/validate', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.validate))
payrunRouter.post('/:id/pay', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.markPaid))
payrunRouter.post('/:id/send', authorize(...PAYROLL_WRITE_ROLES), asyncHandler(controller.sendPayslips))

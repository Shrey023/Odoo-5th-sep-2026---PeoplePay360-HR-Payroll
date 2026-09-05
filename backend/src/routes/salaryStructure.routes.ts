import { Router } from 'express'

import * as controller from '../controllers/salaryStructure.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, PAYROLL_CONFIG_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const salaryStructureRouter = Router()

salaryStructureRouter.use(authenticate)

salaryStructureRouter.get('/preview', asyncHandler(controller.preview))
salaryStructureRouter.get('/', asyncHandler(controller.list))
salaryStructureRouter.get('/:id', asyncHandler(controller.getOne))

salaryStructureRouter.post('/', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.create))
salaryStructureRouter.patch('/:id', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.update))
salaryStructureRouter.delete('/:id', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.remove))

salaryStructureRouter.post('/:id/rules', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.addRule))
salaryStructureRouter.patch('/rules/:ruleId', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.updateRule))
salaryStructureRouter.delete('/rules/:ruleId', authorize(...PAYROLL_CONFIG_ROLES), asyncHandler(controller.removeRule))

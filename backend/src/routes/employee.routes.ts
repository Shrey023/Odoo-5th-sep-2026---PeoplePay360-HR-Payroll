import { Router } from 'express'

import * as employeeController from '../controllers/employee.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const employeeRouter = Router()

employeeRouter.use(authenticate)

employeeRouter.get('/me', asyncHandler(employeeController.getMe))
employeeRouter.get('/', asyncHandler(employeeController.list))
employeeRouter.get('/:id', asyncHandler(employeeController.getOne))
employeeRouter.post('/', authorize(...HR_ROLES), asyncHandler(employeeController.create))
employeeRouter.patch('/:id', authorize(...HR_ROLES), asyncHandler(employeeController.update))
employeeRouter.delete('/:id', authorize(...HR_ROLES), asyncHandler(employeeController.remove))

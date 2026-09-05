import { Router } from 'express'

import * as userController from '../controllers/user.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const userRouter = Router()

// All user management endpoints require authentication and ADMIN role
userRouter.use(authenticate)
userRouter.use(authorize('ADMIN'))

userRouter.get('/', asyncHandler(userController.list))
userRouter.post('/', asyncHandler(userController.create))
userRouter.patch('/:id/roles', asyncHandler(userController.updateRoles))

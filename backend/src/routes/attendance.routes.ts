import { Router } from 'express'

import * as controller from '../controllers/attendance.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const attendanceRouter = Router()

attendanceRouter.use(authenticate)

attendanceRouter.get('/active', asyncHandler(controller.getActive))
attendanceRouter.post('/checkin', asyncHandler(controller.checkIn))
attendanceRouter.post('/checkout', asyncHandler(controller.checkOut))
attendanceRouter.get('/', asyncHandler(controller.list))
attendanceRouter.post('/', authorize(...HR_ROLES), asyncHandler(controller.create))
attendanceRouter.patch('/:id', authorize(...HR_ROLES), asyncHandler(controller.update))
attendanceRouter.delete('/:id', authorize(...HR_ROLES), asyncHandler(controller.remove))

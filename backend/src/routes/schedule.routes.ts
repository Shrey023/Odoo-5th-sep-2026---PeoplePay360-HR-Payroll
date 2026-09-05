import { Router } from 'express'

import * as controller from '../controllers/schedule.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const scheduleRouter = Router()

scheduleRouter.use(authenticate)

scheduleRouter.get('/', asyncHandler(controller.list))
scheduleRouter.get('/:id', asyncHandler(controller.getOne))
scheduleRouter.put('/:id/lines', authorize(...HR_ROLES), asyncHandler(controller.upsertLines))

import { Router } from 'express'

import * as controller from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const dashboardRouter = Router()

dashboardRouter.use(authenticate)

dashboardRouter.get('/', asyncHandler(controller.summary))

import { Router } from 'express'

import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authRouter = Router()

authRouter.post('/register', asyncHandler(authController.register))
authRouter.post('/login', asyncHandler(authController.login))
authRouter.get('/me', authenticate, asyncHandler(authController.me))

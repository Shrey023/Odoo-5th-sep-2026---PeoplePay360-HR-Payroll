import { Router } from 'express'

import * as contractController from '../controllers/contract.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const contractRouter = Router()

contractRouter.use(authenticate)

contractRouter.get('/', asyncHandler(contractController.list))
contractRouter.get('/resolve', asyncHandler(contractController.resolve))
contractRouter.get('/:id', asyncHandler(contractController.getOne))
contractRouter.post('/', authorize(...HR_ROLES), asyncHandler(contractController.create))
contractRouter.patch('/:id', authorize(...HR_ROLES), asyncHandler(contractController.update))
contractRouter.delete('/:id', authorize(...HR_ROLES), asyncHandler(contractController.remove))

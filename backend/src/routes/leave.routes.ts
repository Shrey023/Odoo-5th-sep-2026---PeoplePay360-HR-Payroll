import { Router } from 'express'

import * as controller from '../controllers/leave.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize, HR_ROLES } from '../middleware/rbac.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const leaveRouter = Router()

leaveRouter.use(authenticate)

// Types
leaveRouter.get('/types', asyncHandler(controller.listTypes))
leaveRouter.post('/types', authorize(...HR_ROLES), asyncHandler(controller.createType))
leaveRouter.patch('/types/:id', authorize(...HR_ROLES), asyncHandler(controller.updateType))
leaveRouter.delete('/types/:id', authorize(...HR_ROLES), asyncHandler(controller.removeType))

// Allocations
leaveRouter.get('/allocations', asyncHandler(controller.listAllocations))
leaveRouter.post('/allocations', authorize(...HR_ROLES), asyncHandler(controller.createAllocation))
leaveRouter.post('/allocations/:id/decide', authorize(...HR_ROLES), asyncHandler(controller.decideAllocation))
leaveRouter.delete('/allocations/:id', authorize(...HR_ROLES), asyncHandler(controller.removeAllocation))

// Requests
leaveRouter.get('/requests', asyncHandler(controller.listRequests))
leaveRouter.post('/requests', authorize(...HR_ROLES), asyncHandler(controller.createRequest))
leaveRouter.post('/requests/:id/decide', authorize(...HR_ROLES), asyncHandler(controller.decideRequest))
leaveRouter.delete('/requests/:id', authorize(...HR_ROLES), asyncHandler(controller.removeRequest))

// Balances
leaveRouter.get('/balances/:employeeId', asyncHandler(controller.getBalances))

import type { Request, Response } from 'express'

import * as leaveService from '../services/leave.service.js'
import { ok } from '../utils/apiResponse.js'
import {
  createAllocationSchema,
  createRequestSchema,
  createTypeSchema,
  decisionSchema,
  updateTypeSchema,
} from '../validators/leave.validator.js'

// Types

export async function listTypes(_req: Request, res: Response) {
  const data = await leaveService.listTypes()
  ok(res, { message: 'Time off types', data })
}

export async function createType(req: Request, res: Response) {
  const input = createTypeSchema.parse(req.body)
  const data = await leaveService.createType(input)
  ok(res, { statusCode: 201, message: 'Time off type created', data })
}

export async function updateType(req: Request, res: Response) {
  const input = updateTypeSchema.parse(req.body)
  const data = await leaveService.updateType(req.params.id, input)
  ok(res, { message: 'Time off type updated', data })
}

export async function removeType(req: Request, res: Response) {
  await leaveService.removeType(req.params.id)
  ok(res, { message: 'Time off type deleted' })
}

// Allocations

export async function listAllocations(req: Request, res: Response) {
  const data = await leaveService.listAllocations({
    employeeId: req.query.employeeId as string | undefined,
    status: req.query.status as string | undefined,
  })
  ok(res, { message: 'Allocations', data })
}

export async function createAllocation(req: Request, res: Response) {
  const input = createAllocationSchema.parse(req.body)
  const data = await leaveService.createAllocation(input)
  ok(res, { statusCode: 201, message: 'Allocation created', data })
}

export async function decideAllocation(req: Request, res: Response) {
  const { status } = decisionSchema.parse(req.body)
  const data = await leaveService.setAllocationStatus(req.params.id, status)
  ok(res, { message: 'Allocation updated', data })
}

export async function removeAllocation(req: Request, res: Response) {
  await leaveService.removeAllocation(req.params.id)
  ok(res, { message: 'Allocation deleted' })
}

// Requests

export async function getRequest(req: Request, res: Response) {
  const data = await leaveService.getRequest(req.params.id)
  ok(res, { message: 'Time off request', data })
}

export async function listRequests(req: Request, res: Response) {
  const data = await leaveService.listRequests({
    employeeId: req.query.employeeId as string | undefined,
    status: req.query.status as string | undefined,
  })
  ok(res, { message: 'Time off requests', data })
}

export async function createRequest(req: Request, res: Response) {
  const input = createRequestSchema.parse(req.body)
  const data = await leaveService.createRequest(input)
  ok(res, { statusCode: 201, message: 'Time off request created', data })
}

export async function decideRequest(req: Request, res: Response) {
  const { status } = decisionSchema.parse(req.body)
  const data = await leaveService.setRequestStatus(req.params.id, status)
  ok(res, { message: 'Time off request updated', data })
}

export async function removeRequest(req: Request, res: Response) {
  await leaveService.removeRequest(req.params.id)
  ok(res, { message: 'Time off request deleted' })
}

// Balances

export async function getBalances(req: Request, res: Response) {
  const data = await leaveService.getBalances(req.params.employeeId)
  ok(res, { message: 'Leave balances', data })
}

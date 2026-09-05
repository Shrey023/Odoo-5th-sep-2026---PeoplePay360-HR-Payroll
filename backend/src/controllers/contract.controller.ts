import type { Request, Response } from 'express'

import * as contractService from '../services/contract.service.js'
import { ok } from '../utils/apiResponse.js'
import { createContractSchema, updateContractSchema } from '../validators/contract.validator.js'

export async function list(req: Request, res: Response) {
  const { employeeId, status } = req.query
  const data = await contractService.list({
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  })
  ok(res, { message: 'Contracts', data })
}

export async function getOne(req: Request, res: Response) {
  const data = await contractService.getById(req.params.id)
  ok(res, { message: 'Contract', data })
}

export async function create(req: Request, res: Response) {
  const input = createContractSchema.parse(req.body)
  const data = await contractService.create(input)
  ok(res, { statusCode: 201, message: 'Contract created', data })
}

export async function update(req: Request, res: Response) {
  const input = updateContractSchema.parse(req.body)
  const data = await contractService.update(req.params.id, input)
  ok(res, { message: 'Contract updated', data })
}

export async function remove(req: Request, res: Response) {
  await contractService.remove(req.params.id)
  ok(res, { message: 'Contract deleted' })
}

export async function resolve(req: Request, res: Response) {
  const { employeeId, periodStart, periodEnd } = req.query
  const data = await contractService.resolveForPeriod(
    employeeId as string,
    new Date(periodStart as string),
    new Date(periodEnd as string),
  )
  ok(res, { message: 'Resolved contract', data })
}

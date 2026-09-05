import type { Request, Response } from 'express'

import * as service from '../services/salaryStructure.service.js'
import { ok } from '../utils/apiResponse.js'
import {
  createRuleSchema,
  createStructureSchema,
  updateRuleSchema,
  updateStructureSchema,
} from '../validators/salaryStructure.validator.js'

export async function list(_req: Request, res: Response) {
  const data = await service.list()
  ok(res, { message: 'Salary structures', data })
}

export async function getOne(req: Request, res: Response) {
  const data = await service.getById(req.params.id)
  ok(res, { message: 'Salary structure', data })
}

export async function create(req: Request, res: Response) {
  const input = createStructureSchema.parse(req.body)
  const data = await service.create(input)
  ok(res, { statusCode: 201, message: 'Salary structure created', data })
}

export async function update(req: Request, res: Response) {
  const input = updateStructureSchema.parse(req.body)
  const data = await service.update(req.params.id, input)
  ok(res, { message: 'Salary structure updated', data })
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.params.id)
  ok(res, { message: 'Salary structure deleted' })
}

export async function addRule(req: Request, res: Response) {
  const input = createRuleSchema.parse(req.body)
  const data = await service.addRule(req.params.id, input)
  ok(res, { statusCode: 201, message: 'Salary rule added', data })
}

export async function updateRule(req: Request, res: Response) {
  const input = updateRuleSchema.parse(req.body)
  const data = await service.updateRule(req.params.ruleId, input)
  ok(res, { message: 'Salary rule updated', data })
}

export async function removeRule(req: Request, res: Response) {
  await service.removeRule(req.params.ruleId)
  ok(res, { message: 'Salary rule deleted' })
}

export async function preview(req: Request, res: Response) {
  const { contractId, employeeId, periodStart, periodEnd } = req.query
  if (contractId) {
    const data = await service.previewForContract(contractId as string)
    return ok(res, { message: 'Payslip preview', data })
  }
  const data = await service.previewForEmployeePeriod(
    employeeId as string,
    new Date(periodStart as string),
    new Date(periodEnd as string),
  )
  ok(res, { message: 'Payslip preview', data })
}

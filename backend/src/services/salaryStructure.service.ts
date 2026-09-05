import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type {
  CreateRuleInput,
  CreateStructureInput,
  UpdateRuleInput,
  UpdateStructureInput,
} from '../validators/salaryStructure.validator.js'
import { resolveForPeriod } from './contract.service.js'
import { computePayslip, type EngineRule } from './payslip.engine.js'

const withRules = {
  rules: { orderBy: { sequence: 'asc' } },
} satisfies Prisma.SalaryStructureInclude

export async function list() {
  return prisma.salaryStructure.findMany({
    include: { _count: { select: { rules: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function getById(id: string) {
  const structure = await prisma.salaryStructure.findUnique({ where: { id }, include: withRules })
  if (!structure) throw new HttpError(404, 'Salary structure not found')
  return structure
}

export async function create(input: CreateStructureInput) {
  return prisma.salaryStructure.create({ data: input, include: withRules })
}

export async function update(id: string, input: UpdateStructureInput) {
  await getById(id)
  return prisma.salaryStructure.update({ where: { id }, data: input, include: withRules })
}

export async function remove(id: string) {
  await getById(id)
  await prisma.salaryStructure.delete({ where: { id } })
}

export async function addRule(structureId: string, input: CreateRuleInput) {
  await getById(structureId)
  return prisma.salaryRule.create({ data: { ...input, structureId } })
}

export async function updateRule(ruleId: string, input: UpdateRuleInput) {
  const rule = await prisma.salaryRule.findUnique({ where: { id: ruleId } })
  if (!rule) throw new HttpError(404, 'Salary rule not found')
  return prisma.salaryRule.update({ where: { id: ruleId }, data: input })
}

export async function removeRule(ruleId: string) {
  const rule = await prisma.salaryRule.findUnique({ where: { id: ruleId } })
  if (!rule) throw new HttpError(404, 'Salary rule not found')
  await prisma.salaryRule.delete({ where: { id: ruleId } })
}

// Compute a payslip for a contract without saving. Powers the preview + Slice 4 payrun.
export async function previewForContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { employee: { select: { id: true, name: true } } },
  })
  if (!contract) throw new HttpError(404, 'Contract not found')
  if (!contract.structureId) throw new HttpError(422, 'Contract has no salary structure')

  const structure = await getById(contract.structureId)
  const rules: EngineRule[] = structure.rules.map((r) => ({
    code: r.code,
    name: r.name,
    category: r.category,
    sequence: r.sequence,
    computeType: r.computeType,
    amount: r.amount ? Number(r.amount) : null,
    percent: r.percent ? Number(r.percent) : null,
    percentBase: r.percentBase,
    expression: r.expression,
  }))

  const result = computePayslip(Number(contract.wage), rules)
  return {
    contract: { id: contract.id, reference: contract.reference, wage: Number(contract.wage) },
    employee: contract.employee,
    structure: { id: structure.id, name: structure.name },
    ...result,
  }
}

// Resolve the running contract for a period, then compute. Used by curl + payrun.
export async function previewForEmployeePeriod(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const contract = await resolveForPeriod(employeeId, periodStart, periodEnd)
  return previewForContract(contract.id)
}

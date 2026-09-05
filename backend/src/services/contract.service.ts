import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { CreateContractInput, UpdateContractInput } from '../validators/contract.validator.js'

const include = {
  employee: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  structure: { select: { id: true, name: true } },
  schedule: { select: { id: true, name: true } },
} satisfies Prisma.ContractInclude

function periodsOverlap(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null) {
  const aEndTime = aEnd ? aEnd.getTime() : Infinity
  const bEndTime = bEnd ? bEnd.getTime() : Infinity
  return aStart.getTime() <= bEndTime && bStart.getTime() <= aEndTime
}

// One RUNNING contract per employee per overlapping period. Rejects a second.
async function assertNoRunningOverlap(
  employeeId: string,
  startDate: Date,
  endDate: Date | null,
  ignoreId?: string,
) {
  const running = await prisma.contract.findMany({
    where: { employeeId, status: 'RUNNING', id: ignoreId ? { not: ignoreId } : undefined },
  })
  const clash = running.find((c) => periodsOverlap(startDate, endDate, c.startDate, c.endDate))
  if (clash) {
    throw new HttpError(
      409,
      `Employee already has a running contract (${clash.reference}) overlapping this period`,
    )
  }
}

async function nextReference() {
  const year = new Date().getFullYear()
  const count = await prisma.contract.count()
  return `CON/${year}/${String(count + 1).padStart(4, '0')}`
}

export async function list(filters: { employeeId?: string; status?: string }) {
  const where: Prisma.ContractWhereInput = {}
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status as Prisma.EnumContractStatusFilter['equals']
  return prisma.contract.findMany({ where, include, orderBy: { startDate: 'desc' } })
}

export async function getById(id: string) {
  const contract = await prisma.contract.findUnique({ where: { id }, include })
  if (!contract) throw new HttpError(404, 'Contract not found')
  return contract
}

export async function create(input: CreateContractInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } })
  if (!employee) throw new HttpError(404, 'Employee not found')

  if (input.status === 'RUNNING') {
    await assertNoRunningOverlap(input.employeeId, input.startDate, input.endDate ?? null)
  }

  const reference = input.reference ?? (await nextReference())
  const { reference: _r, ...rest } = input
  return prisma.contract.create({ data: { ...rest, reference }, include })
}

export async function update(id: string, input: UpdateContractInput) {
  const current = await getById(id)

  const nextStatus = input.status ?? current.status
  const nextStart = input.startDate ?? current.startDate
  const nextEnd = input.endDate === undefined ? current.endDate : input.endDate

  if (nextStatus === 'RUNNING') {
    await assertNoRunningOverlap(current.employeeId, nextStart, nextEnd ?? null, id)
  }

  return prisma.contract.update({ where: { id }, data: input, include })
}

export async function remove(id: string) {
  await getById(id)
  await prisma.contract.delete({ where: { id } })
}

// Payrun calls this: the running contract covering a period. Slice 4 dependency.
export async function resolveForPeriod(employeeId: string, periodStart: Date, periodEnd: Date) {
  const running = await prisma.contract.findMany({
    where: { employeeId, status: 'RUNNING' },
    include,
  })
  const match = running.find((c) => periodsOverlap(c.startDate, c.endDate, periodStart, periodEnd))
  if (!match) {
    throw new HttpError(422, 'No running contract covers this period for the employee')
  }
  return match
}

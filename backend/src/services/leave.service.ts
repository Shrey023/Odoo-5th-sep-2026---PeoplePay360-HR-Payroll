import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type {
  CreateAllocationInput,
  CreateRequestInput,
  CreateTypeInput,
  UpdateTypeInput,
} from '../validators/leave.validator.js'

// --- Time Off Types ---

export function listTypes() {
  return prisma.timeOffType.findMany({ orderBy: { name: 'asc' } })
}

export async function createType(input: CreateTypeInput) {
  const existing = await prisma.timeOffType.findUnique({ where: { name: input.name } })
  if (existing) throw new HttpError(409, 'A time off type with this name already exists')
  return prisma.timeOffType.create({ data: input })
}

export async function updateType(id: string, input: UpdateTypeInput) {
  const type = await prisma.timeOffType.findUnique({ where: { id } })
  if (!type) throw new HttpError(404, 'Time off type not found')
  return prisma.timeOffType.update({ where: { id }, data: input })
}

export async function removeType(id: string) {
  const type = await prisma.timeOffType.findUnique({ where: { id } })
  if (!type) throw new HttpError(404, 'Time off type not found')
  await prisma.timeOffType.delete({ where: { id } })
}

// --- Allocations (grant leave) ---

const allocationInclude = {
  employee: { select: { id: true, name: true } },
  type: { select: { id: true, name: true, unit: true } },
} satisfies Prisma.AllocationInclude

export function listAllocations(filters: { employeeId?: string; status?: string }) {
  const where: Prisma.AllocationWhereInput = {}
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status as Prisma.EnumAllocationStatusFilter['equals']
  return prisma.allocation.findMany({ where, include: allocationInclude, orderBy: { createdAt: 'desc' } })
}

export async function createAllocation(input: CreateAllocationInput) {
  const [employee, type] = await Promise.all([
    prisma.employee.findUnique({ where: { id: input.employeeId } }),
    prisma.timeOffType.findUnique({ where: { id: input.typeId } }),
  ])
  if (!employee) throw new HttpError(404, 'Employee not found')
  if (!type) throw new HttpError(404, 'Time off type not found')
  if (input.validTo < input.validFrom) throw new HttpError(400, 'Valid-to must be on or after valid-from')
  return prisma.allocation.create({
    data: { ...input, amount: String(input.amount) },
    include: allocationInclude,
  })
}

export async function setAllocationStatus(id: string, status: 'APPROVED' | 'REFUSED') {
  const allocation = await prisma.allocation.findUnique({ where: { id } })
  if (!allocation) throw new HttpError(404, 'Allocation not found')
  if (allocation.status !== 'DRAFT') throw new HttpError(409, 'Only a draft allocation can be updated')
  return prisma.allocation.update({ where: { id }, data: { status }, include: allocationInclude })
}

export async function removeAllocation(id: string) {
  const allocation = await prisma.allocation.findUnique({ where: { id } })
  if (!allocation) throw new HttpError(404, 'Allocation not found')
  await prisma.allocation.delete({ where: { id } })
}

// --- Time Off Requests (take leave) ---

const requestInclude = {
  employee: { select: { id: true, name: true } },
  type: { select: { id: true, name: true, unit: true, requiresAllocation: true } },
} satisfies Prisma.TimeOffRequestInclude

export function listRequests(filters: { employeeId?: string; status?: string }) {
  const where: Prisma.TimeOffRequestWhereInput = {}
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.status) where.status = filters.status as Prisma.EnumRequestStatusFilter['equals']
  return prisma.timeOffRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: 'desc' } })
}

export async function createRequest(input: CreateRequestInput) {
  const [employee, type] = await Promise.all([
    prisma.employee.findUnique({ where: { id: input.employeeId } }),
    prisma.timeOffType.findUnique({ where: { id: input.typeId } }),
  ])
  if (!employee) throw new HttpError(404, 'Employee not found')
  if (!type) throw new HttpError(404, 'Time off type not found')
  if (input.endDate < input.startDate) throw new HttpError(400, 'End date must be on or after start date')

  const status = type.approvalRequired ? 'TO_APPROVE' : 'APPROVED'
  return prisma.timeOffRequest.create({ data: { ...input, status }, include: requestInclude })
}

export async function setRequestStatus(id: string, status: 'APPROVED' | 'REFUSED') {
  const request = await prisma.timeOffRequest.findUnique({ where: { id }, include: { type: true } })
  if (!request) throw new HttpError(404, 'Time off request not found')
  if (request.status === 'APPROVED' || request.status === 'REFUSED') {
    throw new HttpError(409, 'This request has already been decided')
  }

  // Approving a request that consumes an allocation must not exceed the balance.
  if (status === 'APPROVED' && request.type.requiresAllocation) {
    const balance = await getBalanceForType(request.employeeId, request.typeId)
    if (Number(request.duration) > balance.remaining) {
      throw new HttpError(
        422,
        `Insufficient balance: ${balance.remaining} left, ${request.duration} requested`,
      )
    }
  }
  return prisma.timeOffRequest.update({ where: { id }, data: { status }, include: requestInclude })
}

export async function removeRequest(id: string) {
  const request = await prisma.timeOffRequest.findUnique({ where: { id } })
  if (!request) throw new HttpError(404, 'Time off request not found')
  await prisma.timeOffRequest.delete({ where: { id } })
}

// --- Balance ledger ---
// Remaining = approved allocations granted - approved requests taken, per type.

async function getBalanceForType(employeeId: string, typeId: string) {
  const [allocated, taken] = await Promise.all([
    prisma.allocation.aggregate({
      where: { employeeId, typeId, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.timeOffRequest.aggregate({
      where: { employeeId, typeId, status: 'APPROVED' },
      _sum: { duration: true },
    }),
  ])
  const allocatedNum = Number(allocated._sum.amount ?? 0)
  const takenNum = Number(taken._sum.duration ?? 0)
  return { allocated: allocatedNum, taken: takenNum, remaining: allocatedNum - takenNum }
}

export async function getBalances(employeeId: string) {
  const types = await prisma.timeOffType.findMany({ orderBy: { name: 'asc' } })
  const balances = await Promise.all(
    types.map(async (type) => {
      const b = await getBalanceForType(employeeId, type.id)
      return {
        typeId: type.id,
        typeName: type.name,
        unit: type.unit,
        requiresAllocation: type.requiresAllocation,
        ...b,
      }
    }),
  )
  return balances
}

import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { CreateEmployeeInput, UpdateEmployeeInput } from '../validators/employee.validator.js'

const listInclude = {
  department: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
  manager: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeInclude

export async function list(filters: { departmentId?: string; status?: string; search?: string }) {
  const where: Prisma.EmployeeWhereInput = {}
  if (filters.departmentId) where.departmentId = filters.departmentId
  if (filters.status) where.status = filters.status as Prisma.EnumEmployeeStatusFilter['equals']
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { workEmail: { contains: filters.search, mode: 'insensitive' } },
      { jobPosition: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return prisma.employee.findMany({
    where,
    include: listInclude,
    orderBy: { createdAt: 'desc' },
  })
}

// Employee form is the hub: return the record plus counts for smart buttons.
export async function getById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      ...listInclude,
      schedule: { select: { id: true, name: true, weeklyHours: true } },
    },
  })
  if (!employee) throw new HttpError(404, 'Employee not found')

  const [contracts, attendances, requests, allocations] = await Promise.all([
    prisma.contract.count({ where: { employeeId: id } }),
    prisma.attendance.count({ where: { employeeId: id } }),
    prisma.timeOffRequest.count({ where: { employeeId: id } }),
    prisma.allocation.count({ where: { employeeId: id } }),
  ])

  return { ...employee, counts: { contracts, attendances, requests, allocations } }
}

export async function create(input: CreateEmployeeInput) {
  const existing = await prisma.employee.findUnique({ where: { workEmail: input.workEmail } })
  if (existing) throw new HttpError(409, 'Work email already in use')
  return prisma.employee.create({ data: input, include: listInclude })
}

export async function update(id: string, input: UpdateEmployeeInput) {
  await getById(id)
  return prisma.employee.update({ where: { id }, data: input, include: listInclude })
}

export async function remove(id: string) {
  await getById(id)
  await prisma.employee.delete({ where: { id } })
}

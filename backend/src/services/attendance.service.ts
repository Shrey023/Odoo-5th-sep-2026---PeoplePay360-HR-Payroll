import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { CreateAttendanceInput, UpdateAttendanceInput } from '../validators/attendance.validator.js'

const include = {
  employee: { select: { id: true, name: true } },
} satisfies Prisma.AttendanceInclude

// Hours between check-in and check-out; 0 if still checked in.
function hoursBetween(checkIn: Date, checkOut: Date | null | undefined) {
  if (!checkOut) return 0
  const ms = checkOut.getTime() - checkIn.getTime()
  return Math.round((ms / 3_600_000 + Number.EPSILON) * 100) / 100
}

export function list(filters: { employeeId?: string }) {
  const where: Prisma.AttendanceWhereInput = {}
  if (filters.employeeId) where.employeeId = filters.employeeId
  return prisma.attendance.findMany({ where, include, orderBy: { checkIn: 'desc' } })
}

export async function create(input: CreateAttendanceInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } })
  if (!employee) throw new HttpError(404, 'Employee not found')
  if (input.checkOut && input.checkOut < input.checkIn) {
    throw new HttpError(400, 'Check-out must be after check-in')
  }
  const workedHours = String(hoursBetween(input.checkIn, input.checkOut))
  return prisma.attendance.create({
    data: { ...input, workedHours, manualEdit: true },
    include,
  })
}

export async function update(id: string, input: UpdateAttendanceInput) {
  const current = await prisma.attendance.findUnique({ where: { id } })
  if (!current) throw new HttpError(404, 'Attendance record not found')

  const checkIn = input.checkIn ?? current.checkIn
  const checkOut = input.checkOut === undefined ? current.checkOut : input.checkOut
  if (checkOut && checkOut < checkIn) throw new HttpError(400, 'Check-out must be after check-in')

  return prisma.attendance.update({
    where: { id },
    data: { ...input, workedHours: String(hoursBetween(checkIn, checkOut)), manualEdit: true },
    include,
  })
}

export async function remove(id: string) {
  const current = await prisma.attendance.findUnique({ where: { id } })
  if (!current) throw new HttpError(404, 'Attendance record not found')
  await prisma.attendance.delete({ where: { id } })
}

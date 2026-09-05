import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { UpsertScheduleInput } from '../validators/schedule.validator.js'

const include = { lines: { orderBy: { dayOfWeek: 'asc' } } } satisfies Prisma.WorkingScheduleInclude

// "HH:MM" -> minutes since midnight.
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Weekly hours = sum of each line's (worked minutes - break) / 60.
// Days per week = number of lines. Derived, never entered by hand (gap #17/#19).
function deriveTotals(lines: { startTime: string; endTime: string; breakMinutes: number }[]) {
  const totalMinutes = lines.reduce((sum, l) => {
    const span = toMinutes(l.endTime) - toMinutes(l.startTime) - l.breakMinutes
    return sum + Math.max(0, span)
  }, 0)
  return {
    daysPerWeek: lines.length,
    weeklyHours: Math.round((totalMinutes / 60 + Number.EPSILON) * 100) / 100,
  }
}

export function list() {
  return prisma.workingSchedule.findMany({ include, orderBy: { name: 'asc' } })
}

export function createSchedule(name: string, calendarType: string) {
  return prisma.workingSchedule.create({
    data: { name, calendarType, daysPerWeek: 0, weeklyHours: 0 },
    include,
  })
}

export async function getById(id: string) {
  const schedule = await prisma.workingSchedule.findUnique({ where: { id }, include })
  if (!schedule) throw new HttpError(404, 'Working schedule not found')
  return schedule
}

// Replace the schedule's lines and recompute weekly hours + days per week.
export async function upsertLines(id: string, input: UpsertScheduleInput) {
  await getById(id)
  const totals = deriveTotals(
    input.lines.map((l) => ({
      startTime: l.startTime,
      endTime: l.endTime,
      breakMinutes: l.breakMinutes ?? 60,
    })),
  )
  await prisma.$transaction([
    prisma.scheduleLine.deleteMany({ where: { scheduleId: id } }),
    prisma.workingSchedule.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        daysPerWeek: totals.daysPerWeek,
        weeklyHours: totals.weeklyHours,
        lines: {
          create: input.lines.map((l) => ({
            dayOfWeek: l.dayOfWeek,
            startTime: l.startTime,
            endTime: l.endTime,
            breakMinutes: l.breakMinutes ?? 60,
          })),
        },
      },
    }),
  ])
  return getById(id)
}

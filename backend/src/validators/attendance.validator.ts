import { z } from 'zod'

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date().nullish(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'OVERTIME']).optional(),
})

export const updateAttendanceSchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().nullish(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'OVERTIME']).optional(),
})

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>

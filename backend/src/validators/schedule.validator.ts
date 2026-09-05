import { z } from 'zod'

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')

export const upsertScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  lines: z
    .array(
      z.object({
        dayOfWeek: z.coerce.number().int().min(0).max(6),
        startTime: time,
        endTime: time,
        breakMinutes: z.coerce.number().int().nonnegative().optional(),
      }),
    )
    .min(1, 'At least one working day is required'),
})

export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>

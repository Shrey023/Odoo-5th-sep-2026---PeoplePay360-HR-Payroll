import { z } from 'zod'

export const createPayrunSchema = z.object({
  name: z.string().min(1),
  structureId: z.string().uuid(),
  employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']).nullish(),
  employeeIds: z.array(z.string().uuid()).optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
})

export const updatePayrunSchema = z.object({
  name: z.string().min(1).optional(),
  structureId: z.string().uuid().optional(),
  employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']).nullish(),
  employeeIds: z.array(z.string().uuid()).optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
})

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>
export type UpdatePayrunInput = z.infer<typeof updatePayrunSchema>

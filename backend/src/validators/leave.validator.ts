import { z } from 'zod'

export const createTypeSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(['DAYS', 'HOURS']).optional(),
  requiresAllocation: z.boolean().optional(),
  approvalRequired: z.boolean().optional(),
  color: z.string().optional(),
})

export const updateTypeSchema = createTypeSchema.partial()

export const createAllocationSchema = z
  .object({
    employeeId: z.string().uuid(),
    typeId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
  })
  .refine((a) => a.validTo >= a.validFrom, {
    message: 'Valid-to must be on or after valid-from',
    path: ['validTo'],
  })

export const createRequestSchema = z
  .object({
    employeeId: z.string().uuid(),
    typeId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    duration: z.coerce.number().positive(),
  })
  .refine((r) => r.endDate >= r.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const decisionSchema = z.object({
  status: z.enum(['APPROVED', 'REFUSED']),
})

export type CreateTypeInput = z.infer<typeof createTypeSchema>
export type UpdateTypeInput = z.infer<typeof updateTypeSchema>
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>
export type CreateRequestInput = z.infer<typeof createRequestSchema>

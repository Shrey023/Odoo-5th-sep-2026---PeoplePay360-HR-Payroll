import { z } from 'zod'

export const createContractSchema = z
  .object({
    employeeId: z.string().uuid(),
    reference: z.string().min(1).optional(),
    jobPosition: z.string().min(1).nullish(),
    employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    wage: z.coerce.number().positive(),
    status: z.enum(['DRAFT', 'RUNNING', 'EXPIRED']).optional(),
    departmentId: z.string().uuid().nullish(),
    structureId: z.string().uuid().nullish(),
    scheduleId: z.string().uuid().nullish(),
  })
  .refine((c) => !c.endDate || c.endDate >= c.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const updateContractSchema = z
  .object({
    reference: z.string().min(1).optional(),
    jobPosition: z.string().min(1).nullish(),
    employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullish(),
    wage: z.coerce.number().positive().optional(),
    status: z.enum(['DRAFT', 'RUNNING', 'EXPIRED']).optional(),
    departmentId: z.string().uuid().nullish(),
    structureId: z.string().uuid().nullish(),
    scheduleId: z.string().uuid().nullish(),
  })
  .refine((c) => !c.startDate || !c.endDate || c.endDate >= c.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>

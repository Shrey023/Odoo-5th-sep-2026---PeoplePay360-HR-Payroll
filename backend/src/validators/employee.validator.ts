import { z } from 'zod'

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  workEmail: z.string().email(),
  jobPosition: z.string().min(1),
  employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  bankAccount: z.string().nullish(),
  departmentId: z.string().uuid().nullish(),
  companyId: z.string().uuid().nullish(),
  managerId: z.string().uuid().nullish(),
  scheduleId: z.string().uuid().nullish(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>

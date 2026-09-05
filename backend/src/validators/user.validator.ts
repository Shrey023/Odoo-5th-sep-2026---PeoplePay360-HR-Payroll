import { UserRole } from '@prisma/client'
import { z } from 'zod'

const userRoles = Object.values(UserRole)

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roles: z
    .array(z.enum(userRoles as [UserRole, ...UserRole[]]))
    .min(1, 'At least one role is required')
    .refine((roles) => roles.length > 0, 'At least one role is required'),
  employeeId: z.string().uuid().optional().nullable(),
})

export const updateUserRolesSchema = z.object({
  roles: z
    .array(z.enum(userRoles as [UserRole, ...UserRole[]]))
    .min(1, 'At least one role is required')
    .refine((roles) => roles.length > 0, 'At least one role is required'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>

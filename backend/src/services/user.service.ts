import bcrypt from 'bcryptjs'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { CreateUserInput, UpdateUserRolesInput } from '../validators/user.validator.js'

// Sanitize user object - never return passwordHash
function sanitizeUser(user: { id: string; name: string; email: string; roles: string[] }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
  }
}

export async function list() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return users
}

export async function create(input: CreateUserInput) {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new HttpError(409, 'Email already registered')
  }

  // Hash password using bcrypt
  const passwordHash = await bcrypt.hash(input.password, 10)

  // If employeeId provided, link user to employee
  if (input.employeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: input.employeeId } })
    if (!emp) throw new HttpError(404, 'Employee not found')
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roles: input.roles,
      ...(input.employeeId ? { employee: { connect: { id: input.employeeId } } } : {}),
    },
  })

  // Update employee record to link back to this user
  if (input.employeeId) {
    await prisma.employee.update({
      where: { id: input.employeeId },
      data: { userId: user.id },
    })
  }

  return sanitizeUser(user)
}

export async function updateRoles(userId: string, requesterId: string, input: UpdateUserRolesInput) {
  // Critical security check: prevent self-role modification
  if (userId === requesterId) {
    throw new HttpError(403, 'You cannot change your own roles')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roles: input.roles },
  })

  return sanitizeUser(updated)
}

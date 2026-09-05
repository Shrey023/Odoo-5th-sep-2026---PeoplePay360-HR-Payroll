import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js'

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

function publicUser(u: { id: string; name: string; email: string; roles: string[] }) {
  return { id: u.id, name: u.name, email: u.email, roles: u.roles }
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new HttpError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roles: input.role ? [input.role] : ['EMPLOYEE'],
    },
  })

  return { token: signToken(user.id), user: publicUser(user) }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new HttpError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new HttpError(401, 'Invalid credentials')

  return { token: signToken(user.id), user: publicUser(user) }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: { select: { id: true, name: true } } },
  })
  if (!user) throw new HttpError(404, 'User not found')
  return { ...publicUser(user), employee: user.employee }
}

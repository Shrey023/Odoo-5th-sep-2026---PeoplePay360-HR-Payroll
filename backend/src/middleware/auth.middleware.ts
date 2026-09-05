import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { fail } from '../utils/apiResponse.js'
import type { UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  name: string
  email: string
  roles: UserRole[]
}

// Adds req.user from a valid Bearer token.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return fail(res, { statusCode: 401, message: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(header.slice(7), env.jwtSecret) as { sub: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, roles: true },
    })
    if (!user) return fail(res, { statusCode: 401, message: 'Invalid token' })

    req.user = user
    return next()
  } catch {
    return fail(res, { statusCode: 401, message: 'Invalid or expired token' })
  }
}

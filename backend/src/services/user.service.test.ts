import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import * as userService from './user.service.js'

describe('User Service', () => {
  // Clean up before each test
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  describe('list', () => {
    it('returns all users without passwordHash', async () => {
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: 'hashed',
          roles: ['EMPLOYEE'],
        },
      })

      const users = await userService.list()

      expect(users).toHaveLength(1)
      expect(users[0]).toHaveProperty('id')
      expect(users[0]).toHaveProperty('name', 'John Doe')
      expect(users[0]).toHaveProperty('email', 'john@example.com')
      expect(users[0]).toHaveProperty('roles')
      expect(users[0]).not.toHaveProperty('passwordHash')
    })

    it('returns multiple users ordered by creation date', async () => {
      await prisma.user.create({
        data: {
          name: 'User 1',
          email: 'user1@example.com',
          passwordHash: 'hash1',
          roles: ['EMPLOYEE'],
        },
      })
      await prisma.user.create({
        data: {
          name: 'User 2',
          email: 'user2@example.com',
          passwordHash: 'hash2',
          roles: ['HR_MANAGER'],
        },
      })

      const users = await userService.list()

      expect(users).toHaveLength(2)
      expect(users[0].name).toBe('User 2') // Most recent first
    })
  })

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      const input = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        roles: ['EMPLOYEE'] as const,
      }

      const user = await userService.create(input)

      expect(user).toHaveProperty('id')
      expect(user.name).toBe('Jane Smith')
      expect(user.email).toBe('jane@example.com')
      expect(user.roles).toEqual(['EMPLOYEE'])
      expect(user).not.toHaveProperty('passwordHash')

      // Verify password is hashed in database
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(dbUser?.passwordHash).not.toBe('password123')
      const isValid = await bcrypt.compare('password123', dbUser!.passwordHash)
      expect(isValid).toBe(true)
    })

    it('supports multiple roles', async () => {
      const input = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN'] as const,
      }

      const user = await userService.create(input)

      expect(user.roles).toHaveLength(3)
      expect(user.roles).toContain('EMPLOYEE')
      expect(user.roles).toContain('HR_MANAGER')
      expect(user.roles).toContain('ADMIN')
    })

    it('throws error for duplicate email', async () => {
      const input = {
        name: 'User',
        email: 'duplicate@example.com',
        password: 'password',
        roles: ['EMPLOYEE'] as const,
      }

      await userService.create(input)

      await expect(userService.create(input)).rejects.toThrow(HttpError)
      await expect(userService.create(input)).rejects.toThrow('Email already registered')
    })

    it('created user can subsequently log in', async () => {
      const input = {
        name: 'Login Test',
        email: 'login@example.com',
        password: 'mypassword',
        roles: ['EMPLOYEE'] as const,
      }

      await userService.create(input)

      // Verify user can authenticate with created password
      const dbUser = await prisma.user.findUnique({ where: { email: input.email } })
      expect(dbUser).not.toBeNull()
      const canLogin = await bcrypt.compare(input.password, dbUser!.passwordHash)
      expect(canLogin).toBe(true)
    })
  })

  describe('updateRoles', () => {
    it('updates user roles successfully', async () => {
      const user1 = await prisma.user.create({
        data: {
          name: 'User 1',
          email: 'user1@example.com',
          passwordHash: 'hash',
          roles: ['EMPLOYEE'],
        },
      })
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const updated = await userService.updateRoles(user1.id, admin.id, {
        roles: ['EMPLOYEE', 'HR_MANAGER'],
      })

      expect(updated.roles).toHaveLength(2)
      expect(updated.roles).toContain('EMPLOYEE')
      expect(updated.roles).toContain('HR_MANAGER')
      expect(updated).not.toHaveProperty('passwordHash')
    })

    it('throws 403 when user tries to modify own roles', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const promise = userService.updateRoles(admin.id, admin.id, {
        roles: ['ADMIN', 'HR_MANAGER'],
      })

      await expect(promise).rejects.toThrow(HttpError)
      await expect(promise).rejects.toThrow('You cannot change your own roles')

      // Verify error has correct status code
      try {
        await promise
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(403)
      }
    })

    it('throws 404 for non-existent user', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const promise = userService.updateRoles('non-existent-id', admin.id, {
        roles: ['EMPLOYEE'],
      })

      await expect(promise).rejects.toThrow(HttpError)
      await expect(promise).rejects.toThrow('User not found')
    })

    it('allows admin to assign all valid roles', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'User',
          email: 'user@example.com',
          passwordHash: 'hash',
          roles: ['EMPLOYEE'],
        },
      })
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const updated = await userService.updateRoles(user.id, admin.id, {
        roles: ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'],
      })

      expect(updated.roles).toHaveLength(5)
    })
  })
})

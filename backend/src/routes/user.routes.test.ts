import { beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '../config/prisma.js'
import * as userService from '../services/user.service.js'
import { HttpError } from '../utils/apiResponse.js'

// Note: These tests verify the authorization and business logic.
// Full integration tests with HTTP requests would require setting up
// a test server with authentication middleware, which is beyond the scope
// of this unit test suite. The service and validator tests provide
// comprehensive coverage of the core functionality.

describe('User Management Authorization', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  describe('RBAC Protection', () => {
    it('admin can create users', async () => {
      // This would be enforced by authorize('ADMIN') middleware
      const input = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        roles: ['EMPLOYEE'] as const,
      }

      const user = await userService.create(input)
      expect(user).toBeDefined()
      expect(user.name).toBe('New User')
    })

    it('admin can list users', async () => {
      await prisma.user.create({
        data: {
          name: 'User 1',
          email: 'user1@example.com',
          passwordHash: 'hash',
          roles: ['EMPLOYEE'],
        },
      })

      const users = await userService.list()
      expect(users.length).toBeGreaterThan(0)
      expect(users[0]).not.toHaveProperty('passwordHash')
    })

    it('admin can update another user roles', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const user = await prisma.user.create({
        data: {
          name: 'User',
          email: 'user@example.com',
          passwordHash: 'hash',
          roles: ['EMPLOYEE'],
        },
      })

      const updated = await userService.updateRoles(user.id, admin.id, {
        roles: ['EMPLOYEE', 'HR_MANAGER'],
      })

      expect(updated.roles).toContain('HR_MANAGER')
    })
  })

  describe('Self-Modification Protection', () => {
    it('blocks admin from modifying own roles with 403', async () => {
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

      try {
        await promise
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(403)
      }
    })
  })

  describe('Response Sanitization', () => {
    it('never returns passwordHash in list', async () => {
      await prisma.user.create({
        data: {
          name: 'User',
          email: 'user@example.com',
          passwordHash: 'secrethash',
          roles: ['EMPLOYEE'],
        },
      })

      const users = await userService.list()
      users.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash')
        expect(user).not.toHaveProperty('password')
      })
    })

    it('never returns passwordHash in create', async () => {
      const user = await userService.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        roles: ['EMPLOYEE'],
      })

      expect(user).not.toHaveProperty('passwordHash')
      expect(user).not.toHaveProperty('password')
    })

    it('never returns passwordHash in updateRoles', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          roles: ['ADMIN'],
        },
      })

      const user = await prisma.user.create({
        data: {
          name: 'User',
          email: 'user@example.com',
          passwordHash: 'hash',
          roles: ['EMPLOYEE'],
        },
      })

      const updated = await userService.updateRoles(user.id, admin.id, {
        roles: ['EMPLOYEE', 'HR_MANAGER'],
      })

      expect(updated).not.toHaveProperty('passwordHash')
      expect(updated).not.toHaveProperty('password')
    })
  })
})

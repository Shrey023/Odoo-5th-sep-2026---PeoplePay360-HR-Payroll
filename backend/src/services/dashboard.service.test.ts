import { beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '../config/prisma.js'
import * as dashboardService from './dashboard.service.js'

describe('Dashboard Service - Leave Balances by Type', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.timeOffRequest.deleteMany()
    await prisma.allocation.deleteMany()
    await prisma.timeOffType.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.department.deleteMany()
  })

  describe('byType aggregation', () => {
    it('aggregates leave balances per type across all employees', async () => {
      // Create test data
      const dept = await prisma.department.create({
        data: { name: 'Engineering' },
      })

      const emp1 = await prisma.employee.create({
        data: {
          name: 'Alice',
          workEmail: 'alice@test.com',
          jobPosition: 'Dev',
          departmentId: dept.id,
          status: 'ACTIVE',
        },
      })

      const emp2 = await prisma.employee.create({
        data: {
          name: 'Bob',
          workEmail: 'bob@test.com',
          jobPosition: 'Dev',
          departmentId: dept.id,
          status: 'ACTIVE',
        },
      })

      const vacationType = await prisma.timeOffType.create({
        data: {
          name: 'Vacation',
          unit: 'DAYS',
          requiresAllocation: true,
        },
      })

      const sickType = await prisma.timeOffType.create({
        data: {
          name: 'Sick Leave',
          unit: 'DAYS',
          requiresAllocation: true,
        },
      })

      // Alice: 20 vacation days allocated, 5 taken
      await prisma.allocation.create({
        data: {
          employeeId: emp1.id,
          typeId: vacationType.id,
          amount: 20,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp1.id,
          typeId: vacationType.id,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-05'),
          duration: 5,
          status: 'APPROVED',
        },
      })

      // Bob: 15 vacation days allocated, 3 taken
      await prisma.allocation.create({
        data: {
          employeeId: emp2.id,
          typeId: vacationType.id,
          amount: 15,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp2.id,
          typeId: vacationType.id,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-04-03'),
          duration: 3,
          status: 'APPROVED',
        },
      })

      // Alice: 10 sick days allocated, 2 taken
      await prisma.allocation.create({
        data: {
          employeeId: emp1.id,
          typeId: sickType.id,
          amount: 10,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp1.id,
          typeId: sickType.id,
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-02'),
          duration: 2,
          status: 'APPROVED',
        },
      })

      const result = await dashboardService.getDashboard({})

      expect(result.timeOff.byType).toBeDefined()
      expect(result.timeOff.byType).toHaveLength(2)

      const vacation = result.timeOff.byType.find((t) => t.typeName === 'Vacation')
      expect(vacation).toBeDefined()
      expect(vacation!.allocated).toBe(35) // 20 + 15
      expect(vacation!.taken).toBe(8) // 5 + 3
      expect(vacation!.remaining).toBe(27) // 35 - 8

      const sick = result.timeOff.byType.find((t) => t.typeName === 'Sick Leave')
      expect(sick).toBeDefined()
      expect(sick!.allocated).toBe(10)
      expect(sick!.taken).toBe(2)
      expect(sick!.remaining).toBe(8)
    })

    it('only includes approved allocations and requests', async () => {
      const dept = await prisma.department.create({
        data: { name: 'Sales' },
      })

      const emp = await prisma.employee.create({
        data: {
          name: 'Charlie',
          workEmail: 'charlie@test.com',
          jobPosition: 'Sales Rep',
          departmentId: dept.id,
          status: 'ACTIVE',
        },
      })

      const leaveType = await prisma.timeOffType.create({
        data: {
          name: 'Annual Leave',
          unit: 'DAYS',
          requiresAllocation: true,
        },
      })

      // Approved allocation
      await prisma.allocation.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          amount: 20,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      // Draft allocation (should NOT count)
      await prisma.allocation.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          amount: 10,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'DRAFT',
        },
      })

      // Approved request
      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-03'),
          duration: 3,
          status: 'APPROVED',
        },
      })

      // Pending request (should NOT count)
      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-04-05'),
          duration: 5,
          status: 'TO_APPROVE',
        },
      })

      const result = await dashboardService.getDashboard({})

      const leave = result.timeOff.byType.find((t) => t.typeName === 'Annual Leave')
      expect(leave).toBeDefined()
      expect(leave!.allocated).toBe(20) // Only approved allocation
      expect(leave!.taken).toBe(3) // Only approved request
      expect(leave!.remaining).toBe(17)
    })

    it('respects employeeType filter', async () => {
      const dept = await prisma.department.create({
        data: { name: 'Tech' },
      })

      const fullTime = await prisma.employee.create({
        data: {
          name: 'Dave',
          workEmail: 'dave@test.com',
          jobPosition: 'Engineer',
          departmentId: dept.id,
          employeeType: 'FULL_TIME',
          status: 'ACTIVE',
        },
      })

      const contractor = await prisma.employee.create({
        data: {
          name: 'Eve',
          workEmail: 'eve@test.com',
          jobPosition: 'Contractor',
          departmentId: dept.id,
          employeeType: 'CONTRACTOR',
          status: 'ACTIVE',
        },
      })

      const leaveType = await prisma.timeOffType.create({
        data: {
          name: 'PTO',
          unit: 'DAYS',
          requiresAllocation: true,
        },
      })

      // Full-time allocation
      await prisma.allocation.create({
        data: {
          employeeId: fullTime.id,
          typeId: leaveType.id,
          amount: 25,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      // Contractor allocation
      await prisma.allocation.create({
        data: {
          employeeId: contractor.id,
          typeId: leaveType.id,
          amount: 10,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
        },
      })

      // Filter by FULL_TIME only
      const result = await dashboardService.getDashboard({ employeeType: 'FULL_TIME' })

      const pto = result.timeOff.byType.find((t) => t.typeName === 'PTO')
      expect(pto).toBeDefined()
      expect(pto!.allocated).toBe(25) // Only full-time employee
      expect(pto!.taken).toBe(0)
      expect(pto!.remaining).toBe(25)
    })

    it('handles types with no allocations or requests', async () => {
      const dept = await prisma.department.create({
        data: { name: 'HR' },
      })

      await prisma.employee.create({
        data: {
          name: 'Frank',
          workEmail: 'frank@test.com',
          jobPosition: 'HR Manager',
          departmentId: dept.id,
          status: 'ACTIVE',
        },
      })

      await prisma.timeOffType.create({
        data: {
          name: 'Unused Type',
          unit: 'DAYS',
          requiresAllocation: false,
        },
      })

      const result = await dashboardService.getDashboard({})

      const unusedType = result.timeOff.byType.find((t) => t.typeName === 'Unused Type')
      expect(unusedType).toBeDefined()
      expect(unusedType!.allocated).toBe(0)
      expect(unusedType!.taken).toBe(0)
      expect(unusedType!.remaining).toBe(0)
    })

    it('preserves existing timeOff fields', async () => {
      const dept = await prisma.department.create({
        data: { name: 'Operations' },
      })

      const emp = await prisma.employee.create({
        data: {
          name: 'Grace',
          workEmail: 'grace@test.com',
          jobPosition: 'Ops',
          departmentId: dept.id,
          status: 'ACTIVE',
        },
      })

      const leaveType = await prisma.timeOffType.create({
        data: {
          name: 'Leave',
          unit: 'DAYS',
          requiresAllocation: true,
        },
      })

      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          startDate: new Date('2026-05-01'),
          endDate: new Date('2026-05-10'),
          duration: 10,
          status: 'APPROVED',
        },
      })

      await prisma.timeOffRequest.create({
        data: {
          employeeId: emp.id,
          typeId: leaveType.id,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-05'),
          duration: 5,
          status: 'TO_APPROVE',
        },
      })

      const result = await dashboardService.getDashboard({})

      // Existing fields should still work
      expect(result.timeOff.approvedDays).toBe(10)
      expect(result.timeOff.pendingRequests).toBe(1)

      // New byType field
      expect(result.timeOff.byType).toBeDefined()
      expect(Array.isArray(result.timeOff.byType)).toBe(true)
    })
  })
})

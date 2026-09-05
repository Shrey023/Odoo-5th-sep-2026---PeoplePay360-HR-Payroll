import type { EmployeeType, Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'

export interface DashboardFilters {
  departmentId?: string
  employeeType?: EmployeeType
}

function toNumber(value: { toString(): string } | null | undefined): number {
  return value ? Number(value.toString()) : 0
}

export async function getDashboard(filters: DashboardFilters) {
  const employeeWhere: Prisma.EmployeeWhereInput = {
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.employeeType ? { employeeType: filters.employeeType } : {}),
  }

  const [employees, departments, payslips, contracts, requests, allocations, attendance, payruns] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true, status: true, bankAccount: true, departmentId: true },
    }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.payslip.findMany({
      where: { employee: employeeWhere },
      select: { net: true, status: true, employeeId: true },
    }),
    prisma.contract.findMany({
      where: { status: 'RUNNING', employee: employeeWhere },
      select: { id: true, endDate: true, employeeId: true, reference: true },
    }),
    prisma.timeOffRequest.findMany({
      where: { employee: employeeWhere },
      select: { status: true, duration: true, typeId: true, type: { select: { id: true, name: true } } },
    }),
    prisma.allocation.findMany({
      where: { employee: employeeWhere, status: 'APPROVED' },
      select: { amount: true, typeId: true, type: { select: { id: true, name: true } } },
    }),
    prisma.attendance.findMany({
      where: { employee: employeeWhere },
      select: { status: true, checkOut: true },
    }),
    prisma.payrun.findMany({
      where: { status: { in: ['VALIDATED', 'PAID'] } },
      select: { name: true, periodStart: true, periodEnd: true, payslips: { where: { employee: employeeWhere }, select: { net: true } } },
      orderBy: { periodStart: 'asc' },
      take: 6,
    }),
  ])

  const employeeIds = new Set(employees.map((e) => e.id))
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length

  const totalNet = payslips.reduce((sum, p) => sum + toNumber(p.net), 0)
  const paidCount = payslips.filter((p) => p.status === 'PAID').length
  const pendingCount = payslips.length - paidCount

  const deptMap = new Map(departments.map((d) => [d.id, d.name]))
  const byDept = new Map<string, { name: string; headcount: number; net: number }>()
  for (const e of employees) {
    const key = e.departmentId ?? 'none'
    const name = e.departmentId ? deptMap.get(e.departmentId) ?? 'Unknown' : 'Unassigned'
    const row = byDept.get(key) ?? { name, headcount: 0, net: 0 }
    row.headcount += 1
    byDept.set(key, row)
  }
  for (const p of payslips) {
    const emp = employees.find((e) => e.id === p.employeeId)
    if (!emp) continue
    const key = emp.departmentId ?? 'none'
    const row = byDept.get(key)
    if (row) row.net += toNumber(p.net)
  }

  const approvedRequests = requests.filter((r) => r.status === 'APPROVED')
  const pendingRequests = requests.filter((r) => r.status === 'TO_APPROVE').length
  const approvedDays = approvedRequests.reduce((sum, r) => sum + toNumber(r.duration), 0)

  // Per-type time-off: allocated, taken, remaining
  const typeMap = new Map<string, { id: string; name: string; allocated: number; taken: number }>()
  for (const a of allocations) {
    const key = a.typeId
    const row = typeMap.get(key) ?? { id: a.type.id, name: a.type.name, allocated: 0, taken: 0 }
    row.allocated += toNumber(a.amount)
    typeMap.set(key, row)
  }
  for (const r of approvedRequests) {
    const key = r.typeId
    const row = typeMap.get(key)
    if (row) row.taken += toNumber(r.duration)
  }
  const byType = [...typeMap.values()].map((t) => ({
    name: t.name,
    approvedDays: t.taken,
    pending: requests.filter((r) => r.typeId === t.id && r.status === 'TO_APPROVE').length,
    remainingBalance: Math.max(0, t.allocated - t.taken),
  }))

  // Monthly salary trend (last 6 validated/paid payruns)
  const trend = payruns.map((pr) => ({
    month: pr.periodStart.toISOString().slice(0, 7),
    net: pr.payslips.reduce((sum, p) => sum + toNumber(p.net), 0),
  }))

  const attendanceByStatus = { PRESENT: 0, LATE: 0, ABSENT: 0, OVERTIME: 0 }
  let missingCheckouts = 0
  for (const a of attendance) {
    attendanceByStatus[a.status] += 1
    if (!a.checkOut) missingCheckouts += 1
  }

  const warnings: { type: string; message: string }[] = []

  const missingBank = employees.filter((e) => e.status === 'ACTIVE' && !e.bankAccount)
  if (missingBank.length > 0) {
    warnings.push({
      type: 'missing_bank',
      message: `${missingBank.length} active employee(s) missing a bank account`,
    })
  }

  const noContract = employees.filter(
    (e) => e.status === 'ACTIVE' && !contracts.some((c) => c.employeeId === e.id),
  )
  if (noContract.length > 0) {
    warnings.push({
      type: 'no_contract',
      message: `${noContract.length} active employee(s) without a running contract`,
    })
  }

  const soon = new Date()
  soon.setDate(soon.getDate() + 30)
  const expiring = contracts.filter(
    (c) => c.endDate && c.endDate <= soon && employeeIds.has(c.employeeId),
  )
  if (expiring.length > 0) {
    warnings.push({
      type: 'expiring_contract',
      message: `${expiring.length} running contract(s) expiring within 30 days`,
    })
  }

  const draftPayruns = await prisma.payrun.count({ where: { status: { in: ['DRAFT', 'COMPUTED'] } } })
  if (draftPayruns > 0) {
    warnings.push({
      type: 'unvalidated_payrun',
      message: `${draftPayruns} payrun(s) not yet validated`,
    })
  }

  const avgSalary = activeEmployees > 0 ? Math.round(totalNet / activeEmployees) : 0
  const totalAttendance = Object.values(attendanceByStatus).reduce((s, v) => s + v, 0)
  const attendanceHealth = totalAttendance > 0
    ? Math.round(((attendanceByStatus.PRESENT + attendanceByStatus.OVERTIME) / totalAttendance) * 100)
    : 0

  return {
    kpis: {
      activeEmployees,
      totalNet,
      payslips: payslips.length,
      paid: paidCount,
      pending: pendingCount,
      avgSalary,
      attendanceHealth,
    },
    byDepartment: [...byDept.values()].sort((a, b) => b.headcount - a.headcount),
    timeOff: {
      approvedDays,
      pendingRequests,
      byType,
    },
    attendance: {
      byStatus: attendanceByStatus,
      missingCheckouts,
    },
    trend,
    warnings,
  }
}

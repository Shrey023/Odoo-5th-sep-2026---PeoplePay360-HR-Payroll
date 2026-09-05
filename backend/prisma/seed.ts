import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding PeoplePay360...')

  await prisma.payslipLine.deleteMany()
  await prisma.payslip.deleteMany()
  await prisma.payrun.deleteMany()
  await prisma.salaryRule.deleteMany()
  await prisma.timeOffRequest.deleteMany()
  await prisma.allocation.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.scheduleLine.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.salaryStructure.deleteMany()
  await prisma.timeOffType.deleteMany()
  await prisma.workingSchedule.deleteMany()
  await prisma.department.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  const pw = await bcrypt.hash('password123', 10)
  const users = await Promise.all(
    [
      { name: 'Admin', email: 'admin@oxp.com', roles: ['ADMIN'] as const },
      { name: 'Payroll Manager', email: 'payroll@oxp.com', roles: ['HR_PAYROLL_MANAGER'] as const },
      { name: 'HR Manager', email: 'hr@oxp.com', roles: ['HR_MANAGER'] as const },
      { name: 'Aarav Mehta', email: 'aarav@oxp.com', roles: ['EMPLOYEE'] as const },
    ].map((u) => prisma.user.create({ data: { ...u, roles: [...u.roles], passwordHash: pw } })),
  )
  const aaravUser = users.find((u) => u.email === 'aarav@oxp.com')!

  const company = await prisma.company.create({ data: { name: 'OXP Technologies' } })

  const [finance, hr, engineering] = await Promise.all(
    ['Finance', 'HR', 'Engineering'].map((name) =>
      prisma.department.create({ data: { name, companyId: company.id } }),
    ),
  )

  // Standard week: Mon-Fri, 9-6 with 1h break = 8h/day, 40h/week.
  const scheduleLines = [0, 1, 2, 3, 4].map((d) => ({
    dayOfWeek: d,
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
  }))
  const schedule = await prisma.workingSchedule.create({
    data: {
      name: 'Standard 40h/week',
      calendarType: 'Standard',
      companyId: company.id,
      daysPerWeek: scheduleLines.length,
      weeklyHours: 40,
      lines: { create: scheduleLines },
    },
  })

  const structure = await prisma.salaryStructure.create({ data: { name: 'Regular Salary' } })
  await prisma.salaryRule.createMany({
    data: [
      { structureId: structure.id, name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, computeType: 'PERCENTAGE', percent: '50', percentBase: 'CONTRACT_WAGE' },
      { structureId: structure.id, name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 20, computeType: 'PERCENTAGE', percent: '20', percentBase: 'BASIC' },
      { structureId: structure.id, name: 'Meal Allowance', code: 'MEAL', category: 'ALLOWANCE', sequence: 30, computeType: 'FIXED', amount: '2000' },
      { structureId: structure.id, name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 40, computeType: 'FORMULA', expression: "categories['BASIC'] + categories['ALLOWANCE']" },
      { structureId: structure.id, name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 50, computeType: 'PERCENTAGE', percent: '12', percentBase: 'BASIC' },
      { structureId: structure.id, name: 'Professional Tax', code: 'PT', category: 'DEDUCTION', sequence: 60, computeType: 'FIXED', amount: '200' },
      { structureId: structure.id, name: 'Net Salary', code: 'NET', category: 'NET', sequence: 70, computeType: 'FORMULA', expression: "categories['GROSS'] - categories['DEDUCTION']" },
    ],
  })

  // The four named demo employees the walkthrough relies on.
  // Neha has no bank account on purpose (drives the payroll warning demo).
  const employeesData: Array<{
    name: string
    workEmail: string
    jobPosition: string
    departmentId: string
    userId?: string
    wage: string
    bankAccount: string | null
  }> = [
    {
      name: 'Aarav Mehta',
      workEmail: 'aarav@oxp.com',
      jobPosition: 'Payroll Specialist',
      departmentId: finance.id,
      userId: aaravUser.id,
      wage: '85000',
      bankAccount: 'HDFC-0001',
    },
    {
      name: 'Sara Khan',
      workEmail: 'sara@oxp.com',
      jobPosition: 'HR Officer',
      departmentId: hr.id,
      wage: '95000',
      bankAccount: 'ICICI-0002',
    },
    {
      name: 'John Dsouza',
      workEmail: 'john@oxp.com',
      jobPosition: 'Developer',
      departmentId: engineering.id,
      wage: '78000',
      bankAccount: 'SBI-0003',
    },
    {
      name: 'Neha Patel',
      workEmail: 'neha@oxp.com',
      jobPosition: 'Recruiter',
      departmentId: hr.id,
      wage: '60000',
      bankAccount: null,
    },
  ]

  let contractSeq = 1
  for (const e of employeesData) {
    const emp = await prisma.employee.create({
      data: {
        name: e.name,
        workEmail: e.workEmail,
        jobPosition: e.jobPosition,
        departmentId: e.departmentId,
        companyId: company.id,
        scheduleId: schedule.id,
        userId: e.userId ?? null,
        bankAccount: e.bankAccount,
      },
    })
    await prisma.contract.create({
      data: {
        reference: `CON/2026/00${contractSeq++}`,
        employeeId: emp.id,
        jobPosition: e.jobPosition,
        employeeType: 'FULL_TIME',
        departmentId: e.departmentId,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        wage: e.wage,
        status: 'RUNNING',
        structureId: structure.id,
        scheduleId: schedule.id,
      },
    })
  }

  const annual = await prisma.timeOffType.create({
    data: { name: 'Annual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, color: '#1971c2' },
  })
  await prisma.timeOffType.create({
    data: { name: 'Unpaid Leave', unit: 'DAYS', requiresAllocation: false, approvalRequired: true, color: '#e8590c' },
  })

  const aarav = await prisma.employee.findUniqueOrThrow({ where: { workEmail: 'aarav@oxp.com' } })
  await prisma.allocation.create({
    data: {
      employeeId: aarav.id,
      typeId: annual.id,
      amount: '20',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      status: 'APPROVED',
    },
  })
  await prisma.timeOffRequest.create({
    data: {
      employeeId: aarav.id,
      typeId: annual.id,
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-11'),
      duration: '2',
      status: 'APPROVED',
    },
  })

  await prisma.attendance.createMany({
    data: [
      { employeeId: aarav.id, checkIn: new Date('2026-02-02T09:05:00'), checkOut: new Date('2026-02-02T18:10:00'), workedHours: '8.08', status: 'PRESENT' },
      { employeeId: aarav.id, checkIn: new Date('2026-02-03T09:32:00'), checkOut: new Date('2026-02-03T18:02:00'), workedHours: '7.5', status: 'LATE' },
    ],
  })

  // Demo payrun: August 2026, all 4 employees, status PAID so dashboard shows real numbers.
  const rules = await prisma.salaryRule.findMany({
    where: { structureId: structure.id },
    orderBy: { sequence: 'asc' },
  })

  const payrun = await prisma.payrun.create({
    data: {
      name: 'August 2026',
      structureId: structure.id,
      periodStart: new Date('2026-08-01'),
      periodEnd: new Date('2026-08-31'),
      status: 'PAID',
      employeeIds: [],
    },
  })

  const allEmployees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } })

  for (const emp of allEmployees) {
    const contract = await prisma.contract.findFirst({
      where: { employeeId: emp.id, status: 'RUNNING' },
    })
    if (!contract) continue

    const wage = Number(contract.wage)
    const cats: Record<string, number> = { BASIC: 0, ALLOWANCE: 0, GROSS: 0, DEDUCTION: 0, NET: 0 }
    const lines: { ruleCode: string; ruleName: string; category: string; sequence: number; amount: number }[] = []

    for (const rule of rules) {
      let amount = 0
      if (rule.computeType === 'FIXED') {
        amount = Number(rule.amount ?? 0)
      } else if (rule.computeType === 'PERCENTAGE') {
        const base = rule.percentBase === 'CONTRACT_WAGE' ? wage : (cats[rule.percentBase ?? ''] ?? 0)
        amount = (base * Number(rule.percent ?? 0)) / 100
      } else if (rule.computeType === 'FORMULA' && rule.expression) {
        const fn = new Function('categories', `"use strict"; return (${rule.expression});`)
        amount = fn(cats)
      }
      amount = Math.round((amount + Number.EPSILON) * 100) / 100
      if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE' || rule.category === 'DEDUCTION') {
        cats[rule.category] += amount
      } else {
        cats[rule.category] = amount
      }
      lines.push({ ruleCode: rule.code, ruleName: rule.name, category: rule.category, sequence: rule.sequence, amount })
    }

    const gross = Math.round((cats.GROSS || cats.BASIC + cats.ALLOWANCE) * 100) / 100
    const deductions = Math.round(cats.DEDUCTION * 100) / 100
    const net = Math.round((cats.NET || gross - deductions) * 100) / 100

    await prisma.payslip.create({
      data: {
        payrunId: payrun.id,
        employeeId: emp.id,
        contractId: contract.id,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        gross,
        deductions,
        net,
        status: 'PAID',
        workedDays: '23',
        lines: {
          create: lines.map((l) => ({
            ruleCode: l.ruleCode,
            ruleName: l.ruleName,
            category: l.category as any,
            sequence: l.sequence,
            amount: l.amount,
          })),
        },
      },
    })
  }

  console.log('Seed complete:')
  console.log(`  users: ${users.length} (login password: password123)`)
  console.log(`  company: ${company.name}, employees: ${employeesData.length}, contracts: ${employeesData.length}, rules: 7`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

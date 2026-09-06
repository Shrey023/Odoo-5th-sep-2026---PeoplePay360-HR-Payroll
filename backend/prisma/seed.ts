import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function computePayslipLines(wage: number, rules: { code: string; name: string; category: string; sequence: number; computeType: string; amount: string | null; percent: string | null; percentBase: string | null; expression: string | null }[]) {
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
  return { lines, gross, deductions, net }
}

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

  const scheduleLines = [0, 1, 2, 3, 4].map((d) => ({
    dayOfWeek: d, startTime: '09:00', endTime: '18:00', breakMinutes: 60,
  }))
  const schedule = await prisma.workingSchedule.create({
    data: {
      name: 'Standard 40h/week',
      calendarType: 'Standard',
      companyId: company.id,
      daysPerWeek: 5,
      weeklyHours: 40,
      lines: { create: scheduleLines },
    },
  })

  const flexSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Flexible 35h/week',
      calendarType: 'Standard',
      companyId: company.id,
      daysPerWeek: 5,
      weeklyHours: 35,
      lines: {
        create: [0, 1, 2, 3, 4].map((d) => ({
          dayOfWeek: d, startTime: '10:00', endTime: '17:00', breakMinutes: 0,
        })),
      },
    },
  })

  const structure = await prisma.salaryStructure.create({ data: { name: 'Regular Salary' } })
  const rules = await prisma.salaryRule.createManyAndReturn({
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

  // 15 employees across 3 departments.
  const employeesData = [
    // Finance (5)
    { name: 'Aarav Mehta',    email: 'aarav@oxp.com',    job: 'Payroll Specialist',  dept: finance,     wage: 85000,  bank: 'HDFC-0001', userId: aaravUser.id, type: 'FULL_TIME', sched: schedule },
    { name: 'Priya Sharma',   email: 'priya@oxp.com',    job: 'Finance Analyst',     dept: finance,     wage: 92000,  bank: 'ICICI-0010', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Rohan Verma',    email: 'rohan@oxp.com',    job: 'Accounts Manager',    dept: finance,     wage: 110000, bank: 'HDFC-0011', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Divya Nair',     email: 'divya@oxp.com',    job: 'Tax Consultant',      dept: finance,     wage: 75000,  bank: 'SBI-0012',  userId: null, type: 'CONTRACTOR', sched: flexSchedule },
    { name: 'Karan Joshi',    email: 'karan@oxp.com',    job: 'Financial Controller',dept: finance,     wage: 130000, bank: 'AXIS-0013', userId: null, type: 'FULL_TIME', sched: schedule },
    // HR (5)
    { name: 'Sara Khan',      email: 'sara@oxp.com',     job: 'HR Officer',          dept: hr,          wage: 95000,  bank: 'ICICI-0002', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Neha Patel',     email: 'neha@oxp.com',     job: 'Recruiter',           dept: hr,          wage: 60000,  bank: 'KOTAK-0021', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Amit Singh',     email: 'amit@oxp.com',     job: 'HR Business Partner', dept: hr,          wage: 88000,  bank: 'HDFC-0014', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Pooja Iyer',     email: 'pooja@oxp.com',    job: 'L&D Specialist',      dept: hr,          wage: 72000,  bank: 'SBI-0015',  userId: null, type: 'FULL_TIME', sched: flexSchedule },
    { name: 'Rahul Gupta',    email: 'rahulg@oxp.com',   job: 'Talent Acquisition',  dept: hr,          wage: 65000,  bank: 'ICICI-0016', userId: null, type: 'INTERN', sched: flexSchedule },
    // Engineering (5)
    { name: 'John Dsouza',    email: 'john@oxp.com',     job: 'Senior Developer',    dept: engineering, wage: 120000, bank: 'SBI-0003',  userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Ananya Roy',     email: 'ananya@oxp.com',   job: 'Backend Engineer',    dept: engineering, wage: 105000, bank: 'HDFC-0017', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Vikram Bose',    email: 'vikram@oxp.com',   job: 'DevOps Engineer',     dept: engineering, wage: 98000,  bank: 'AXIS-0018', userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Meera Pillai',   email: 'meera@oxp.com',    job: 'QA Engineer',         dept: engineering, wage: 82000,  bank: 'SBI-0019',  userId: null, type: 'FULL_TIME', sched: schedule },
    { name: 'Siddharth Das',  email: 'sid@oxp.com',      job: 'Frontend Developer',  dept: engineering, wage: 90000,  bank: 'HDFC-0020', userId: null, type: 'CONTRACTOR', sched: flexSchedule },
  ]

  let contractSeq = 1
  const createdEmployees: { id: string; name: string; email: string; wage: number }[] = []

  for (const e of employeesData) {
    // Create user account for every named employee (Aarav already has one from above)
    let userId = e.userId ?? null
    if (!userId) {
      const u = await prisma.user.create({
        data: { name: e.name, email: e.email, roles: ['EMPLOYEE'], passwordHash: pw },
      })
      userId = u.id
    }
    const emp = await prisma.employee.create({
      data: {
        name: e.name,
        workEmail: e.email,
        jobPosition: e.job,
        departmentId: e.dept.id,
        companyId: company.id,
        scheduleId: e.sched.id,
        userId,
        bankAccount: e.bank,
        employeeType: e.type as any,
      },
    })
    const seq = String(contractSeq++).padStart(3, '0')
    await prisma.contract.create({
      data: {
        reference: `CON/2026/${seq}`,
        employeeId: emp.id,
        jobPosition: e.job,
        employeeType: e.type as any,
        departmentId: e.dept.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        wage: String(e.wage),
        status: 'RUNNING',
        structureId: structure.id,
        scheduleId: e.sched.id,
      },
    })
    createdEmployees.push({ id: emp.id, name: e.name, email: e.email, wage: e.wage })
  }

  // Time off types
  const annual = await prisma.timeOffType.create({
    data: { name: 'Annual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, color: '#1971c2' },
  })
  const sick = await prisma.timeOffType.create({
    data: { name: 'Sick Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: false, color: '#e03131' },
  })
  await prisma.timeOffType.create({
    data: { name: 'Unpaid Leave', unit: 'DAYS', requiresAllocation: false, approvalRequired: true, color: '#e8590c' },
  })
  await prisma.timeOffType.create({
    data: { name: 'Compensatory Off', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, color: '#2f9e44' },
  })

  // Allocations - all employees get annual leave, most get sick leave
  for (const emp of createdEmployees) {
    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        typeId: annual.id,
        amount: '21',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        status: 'APPROVED',
      },
    })
    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        typeId: sick.id,
        amount: '10',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        status: 'APPROVED',
      },
    })
  }

  // A couple DRAFT allocations for realism
  await prisma.allocation.create({
    data: {
      employeeId: createdEmployees[2].id,
      typeId: annual.id,
      amount: '5',
      validFrom: new Date('2026-07-01'),
      validTo: new Date('2026-12-31'),
      status: 'DRAFT',
    },
  })

  // Time off requests - varied statuses
  const requestsData = [
    { emp: 'aarav@oxp.com', type: annual, start: '2026-02-10', end: '2026-02-12', dur: '3', status: 'APPROVED' },
    { emp: 'sara@oxp.com',  type: annual, start: '2026-03-05', end: '2026-03-07', dur: '3', status: 'APPROVED' },
    { emp: 'john@oxp.com',  type: annual, start: '2026-04-14', end: '2026-04-18', dur: '5', status: 'APPROVED' },
    { emp: 'priya@oxp.com', type: annual, start: '2026-05-01', end: '2026-05-02', dur: '2', status: 'APPROVED' },
    { emp: 'rohan@oxp.com', type: sick,   start: '2026-06-10', end: '2026-06-11', dur: '2', status: 'APPROVED' },
    { emp: 'ananya@oxp.com',type: sick,   start: '2026-07-03', end: '2026-07-03', dur: '1', status: 'APPROVED' },
    { emp: 'amit@oxp.com',  type: annual, start: '2026-09-15', end: '2026-09-17', dur: '3', status: 'TO_APPROVE' },
    { emp: 'meera@oxp.com', type: annual, start: '2026-09-22', end: '2026-09-24', dur: '3', status: 'TO_APPROVE' },
    { emp: 'vikram@oxp.com',type: sick,   start: '2026-08-20', end: '2026-08-21', dur: '2', status: 'TO_APPROVE' },
    { emp: 'divya@oxp.com', type: annual, start: '2026-07-28', end: '2026-07-30', dur: '3', status: 'REFUSED' },
    { emp: 'pooja@oxp.com', type: annual, start: '2026-06-23', end: '2026-06-25', dur: '3', status: 'APPROVED' },
    { emp: 'neha@oxp.com',  type: sick,   start: '2026-08-05', end: '2026-08-06', dur: '2', status: 'APPROVED' },
  ]

  for (const r of requestsData) {
    const emp = createdEmployees.find((e) => e.email === r.emp)
    if (!emp) continue
    await prisma.timeOffRequest.create({
      data: {
        employeeId: emp.id,
        typeId: r.type.id,
        startDate: new Date(r.start),
        endDate: new Date(r.end),
        duration: r.dur,
        status: r.status as any,
      },
    })
  }

  // Attendance - last 2 weeks for all employees, varied statuses
  const attendanceDays = [
    { date: '2026-08-18', checkIn: '09:02', checkOut: '18:05', hours: '8.05', status: 'PRESENT' },
    { date: '2026-08-19', checkIn: '09:35', checkOut: '18:10', hours: '7.58', status: 'LATE' },
    { date: '2026-08-20', checkIn: '09:00', checkOut: '18:00', hours: '8.00', status: 'PRESENT' },
    { date: '2026-08-21', checkIn: '09:10', checkOut: '19:30', hours: '9.33', status: 'OVERTIME' },
    { date: '2026-08-22', checkIn: '10:15', checkOut: '18:00', hours: '6.75', status: 'LATE' },
    { date: '2026-08-25', checkIn: '09:00', checkOut: '18:00', hours: '8.00', status: 'PRESENT' },
    { date: '2026-08-26', checkIn: '09:05', checkOut: '18:00', hours: '7.92', status: 'PRESENT' },
    { date: '2026-08-27', checkIn: '09:00', checkOut: null,    hours: '0',    status: 'ABSENT' },
    { date: '2026-08-28', checkIn: '09:00', checkOut: '20:00', hours: '10.00', status: 'OVERTIME' },
    { date: '2026-08-29', checkIn: '09:20', checkOut: '18:00', hours: '7.67', status: 'PRESENT' },
  ]

  for (const emp of createdEmployees) {
    const shuffle = [...attendanceDays].sort(() => Math.random() - 0.5).slice(0, 6)
    for (const d of shuffle) {
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          checkIn: new Date(`${d.date}T${d.checkIn}:00`),
          checkOut: d.checkOut ? new Date(`${d.date}T${d.checkOut}:00`) : null,
          workedHours: d.hours,
          status: d.status as any,
        },
      })
    }
  }

  // Helper: create payrun + payslips for a given month
  async function createPayrun(name: string, periodStart: Date, periodEnd: Date, workedDays: string, limit?: number) {
    const pr = await prisma.payrun.create({
      data: {
        name,
        structureId: structure.id,
        periodStart,
        periodEnd,
        status: 'PAID',
        employeeIds: [],
      },
    })
    const allEmps = await prisma.employee.findMany({ where: { status: 'ACTIVE' } })
    const emps = limit ? allEmps.slice(0, limit) : allEmps
    for (const emp of emps) {
      const contract = await prisma.contract.findFirst({ where: { employeeId: emp.id, status: 'RUNNING' } })
      if (!contract) continue
      const { lines, gross, deductions, net } = computePayslipLines(Number(contract.wage), rules)
      await prisma.payslip.create({
        data: {
          payrunId: pr.id,
          employeeId: emp.id,
          contractId: contract.id,
          periodStart,
          periodEnd,
          gross,
          deductions,
          net,
          status: 'PAID',
          workedDays,
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
    return pr
  }

  // 200 bulk employees across all 3 departments with realistic Indian names
  const firstNames = [
    'Arjun','Kavya','Raj','Sneha','Vivek','Nisha','Sanjay','Deepa','Arun','Lakshmi',
    'Suresh','Preethi','Manoj','Anjali','Ravi','Swati','Ganesh','Rekha','Vijay','Usha',
    'Nikhil','Pallavi','Harish','Shweta','Ashok','Jyoti','Mohan','Preeti','Sunil','Geeta',
    'Ajay','Madhuri','Ramesh','Sunita','Prakash','Kavitha','Gopal','Asha','Anil','Radha',
    'Dinesh','Mala','Suresh','Chitra','Rajesh','Meena','Umesh','Latha','Naresh','Sarala',
    'Abhishek','Rashmi','Vinod','Nandini','Santosh','Revathi','Mahesh','Sudha','Sudhir','Gayatri',
    'Prasad','Saranya','Girish','Shobha','Venkat','Hema','Srinivas','Bhavana','Raghu','Vanitha',
    'Karthik','Divyashree','Madan','Sowmya','Satish','Archana','Naveen','Priyadarshini','Lokesh','Sindhu',
    'Shiva','Mythili','Balu','Nirmala','Kishore','Pavithra','Madhu','Jayanthi','Subramaniam','Vijayalakshmi',
    'Anand','Vasantha','Chandru','Mangala','Senthil','Bhagyalakshmi','Murali','Saraswathi','Selvam','Kamala',
  ]
  const lastNames = [
    'Kumar','Sharma','Patel','Singh','Reddy','Nair','Iyer','Pillai','Rao','Gupta',
    'Joshi','Menon','Verma','Mehta','Shah','Desai','Bhat','Hegde','Naik','Patil',
    'Gowda','Shetty','Kamath','Pai','Alva','Bangera','Shenoy','Kudva','Mallya','Prabhu',
    'Ghosh','Bose','Roy','Das','Sen','Mukherjee','Chatterjee','Banerjee','Dutta','Mitra',
    'Mishra','Tripathi','Pandey','Tiwari','Shukla','Dwivedi','Chaturvedi','Bajpai','Srivastava','Agarwal',
  ]
  const jobsByDept: Record<string, string[]> = {
    finance: ['Junior Analyst','Senior Analyst','Finance Executive','Accounts Officer','Budget Analyst','Audit Associate','Treasury Analyst','Cost Accountant','Finance Associate','Compliance Officer'],
    hr: ['HR Executive','Recruitment Specialist','HR Coordinator','Payroll Assistant','Training Coordinator','HR Analyst','Talent Manager','HR Associate','Onboarding Specialist','HR Intern'],
    engineering: ['Software Engineer','Junior Developer','Tech Lead','System Analyst','Database Admin','Network Engineer','Security Engineer','Cloud Engineer','ML Engineer','Full Stack Developer'],
  }
  const banks = ['HDFC','ICICI','SBI','AXIS','KOTAK','BOB','PNB','CANARA','UNION','FEDERAL']
  const types = ['FULL_TIME','FULL_TIME','FULL_TIME','FULL_TIME','CONTRACTOR','INTERN'] as const
  const depts = [
    { dept: finance,     key: 'finance',      wageMin: 45000, wageMax: 95000 },
    { dept: finance,     key: 'finance',      wageMin: 45000, wageMax: 95000 },
    { dept: hr,          key: 'hr',           wageMin: 40000, wageMax: 80000 },
    { dept: hr,          key: 'hr',           wageMin: 40000, wageMax: 80000 },
    { dept: engineering, key: 'engineering',  wageMin: 55000, wageMax: 130000 },
    { dept: engineering, key: 'engineering',  wageMin: 55000, wageMax: 130000 },
    { dept: engineering, key: 'engineering',  wageMin: 55000, wageMax: 130000 },
  ]

  const usedEmails = new Set(employeesData.map(e => e.email))
  let bulkSeq = contractSeq

  for (let i = 0; i < 200; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
    const name = `${fn} ${ln}`
    let email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@oxp.com`
    if (usedEmails.has(email)) email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}x@oxp.com`
    usedEmails.add(email)

    const deptEntry = depts[i % depts.length]
    const jobs = jobsByDept[deptEntry.key]
    const job = jobs[i % jobs.length]
    const wage = deptEntry.wageMin + Math.floor(((i * 1337) % (deptEntry.wageMax - deptEntry.wageMin)))
    const bank = `${banks[i % banks.length]}-${String(1000 + i).padStart(4, '0')}`
    const empType = types[i % types.length]
    const sched = i % 5 === 0 ? flexSchedule : schedule

    const bulkUser = await prisma.user.create({
      data: { name, email, roles: ['EMPLOYEE'], passwordHash: pw },
    })
    const emp = await prisma.employee.create({
      data: {
        name,
        workEmail: email,
        jobPosition: job,
        departmentId: deptEntry.dept.id,
        companyId: company.id,
        scheduleId: sched.id,
        bankAccount: bank,
        employeeType: empType,
        userId: bulkUser.id,
      },
    })
    const seq = String(bulkSeq++).padStart(3, '0')
    await prisma.contract.create({
      data: {
        reference: `CON/2026/${seq}`,
        employeeId: emp.id,
        jobPosition: job,
        employeeType: empType,
        departmentId: deptEntry.dept.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        wage: String(wage),
        status: 'RUNNING',
        structureId: structure.id,
        scheduleId: sched.id,
      },
    })
    createdEmployees.push({ id: emp.id, name, email, wage })

    // Allocations for bulk employees
    await prisma.allocation.createMany({
      data: [
        { employeeId: emp.id, typeId: annual.id, amount: '21', validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31'), status: 'APPROVED' },
        { employeeId: emp.id, typeId: sick.id,   amount: '10', validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31'), status: 'APPROVED' },
      ],
    })

    // 4-5 attendance records per bulk employee
    const pickDays = [...attendanceDays].sort(() => 0.5 - Math.random()).slice(0, 4 + (i % 2))
    await prisma.attendance.createMany({
      data: pickDays.map((d) => ({
        employeeId: emp.id,
        checkIn: new Date(`${d.date}T${d.checkIn}:00`),
        checkOut: d.checkOut ? new Date(`${d.date}T${d.checkOut}:00`) : null,
        workedHours: d.hours,
        status: d.status as any,
      })),
    })
  }

  await createPayrun('June 2026',  new Date('2026-06-01'), new Date('2026-06-30'), '21', 160)
  await createPayrun('July 2026',  new Date('2026-07-01'), new Date('2026-07-31'), '23', 190)
  await createPayrun('August 2026',new Date('2026-08-01'), new Date('2026-08-31'), '23')

  const allCount = createdEmployees.length
  console.log('Seed complete:')
  console.log(`  users: ${users.length} (password: password123)`)
  console.log(`  employees: ${allCount} (15 named + 200 bulk) | contracts: ${allCount} | payruns: 3 (Jun/Jul/Aug PAID)`)
  console.log(`  allocations: ~${allCount * 2} | requests: ${requestsData.length} | attendance: ~${allCount * 5}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

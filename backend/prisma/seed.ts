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

  // Generate 200 employee dummy data
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advaith', 'Aarush', 'Kabir', 'Rudra', 'Rohan', 'Aadhya', 'Diya', 'Ananya', 'Pari', 'Aarohi', 'Sara', 'Aanya', 'Navya', 'Angel', 'Pari', 'Myra', 'Anika', 'Saanvi', 'Prisha', 'Avni', 'Shanaya', 'Anaya', 'Kiara', 'Ishika', 'Neha', 'Priya', 'Kavya', 'Riya', 'Pooja', 'Sneha', 'Anjali', 'Divya', 'Simran', 'Tanvi', 'Shruti', 'Megha', 'Swati', 'Rakesh', 'Suresh', 'Ramesh', 'Dinesh', 'Mahesh', 'Rajesh', 'Mukesh', 'Naresh', 'Hitesh', 'Nilesh', 'Amit', 'Sumit', 'Rohit', 'Mohit', 'Lalit', 'Ajit', 'Karan', 'Varun', 'Tarun', 'Arun', 'Vikram', 'Ashok', 'Vinod', 'Manoj', 'Sanjay', 'Vijay', 'Ajay', 'Deepak', 'Praveen', 'Sandeep']
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Mehta', 'Agarwal', 'Reddy', 'Rao', 'Khan', 'Joshi', 'Desai', 'Nair', 'Iyer', 'Menon', 'Bhat', 'Kulkarni', 'Jain', 'Shetty', 'Pandey', 'Mishra', 'Tiwari', 'Dubey', 'Saxena', 'Kapoor', 'Malhotra', 'Chopra', 'Arora', 'Bhatia', 'Sethi', 'Khanna', 'Bansal', 'Goyal', 'Mittal', 'Agrawal', 'Singhal', 'Garg', 'Jindal', 'Shah']
  const jobPositions = [
    { title: 'Software Engineer', dept: 'engineering', wage: 65000 },
    { title: 'Senior Developer', dept: 'engineering', wage: 85000 },
    { title: 'Frontend Developer', dept: 'engineering', wage: 60000 },
    { title: 'Backend Developer', dept: 'engineering', wage: 70000 },
    { title: 'Full Stack Developer', dept: 'engineering', wage: 75000 },
    { title: 'DevOps Engineer', dept: 'engineering', wage: 80000 },
    { title: 'QA Engineer', dept: 'engineering', wage: 55000 },
    { title: 'Tech Lead', dept: 'engineering', wage: 95000 },
    { title: 'Payroll Specialist', dept: 'finance', wage: 50000 },
    { title: 'Accountant', dept: 'finance', wage: 48000 },
    { title: 'Senior Accountant', dept: 'finance', wage: 62000 },
    { title: 'Financial Analyst', dept: 'finance', wage: 58000 },
    { title: 'Finance Manager', dept: 'finance', wage: 90000 },
    { title: 'HR Officer', dept: 'hr', wage: 45000 },
    { title: 'Recruiter', dept: 'hr', wage: 42000 },
    { title: 'HR Manager', dept: 'hr', wage: 75000 },
    { title: 'Talent Acquisition Specialist', dept: 'hr', wage: 52000 },
    { title: 'HR Business Partner', dept: 'hr', wage: 68000 },
  ]
  const banks = ['HDFC', 'ICICI', 'SBI', 'AXIS', 'PNB', 'BOB', 'KOTAK', 'YES', 'IDBI', 'UNION']
  
  const employeesData: Array<{
    name: string
    workEmail: string
    jobPosition: string
    departmentId: string
    userId?: string
    wage: string
    bankAccount: string | null
  }> = []

  // Original named employees the demo walkthrough relies on. Neha has no
  // bank account on purpose (drives the payroll warning demo).
  employeesData.push(
    {
      name: 'Aarav Mehta',
      workEmail: 'aarav@oxp.com',
      jobPosition: 'Payroll Specialist',
      departmentId: finance.id,
      userId: aaravUser.id,
      wage: '50000',
      bankAccount: 'HDFC-0001',
    },
    {
      name: 'Sara Khan',
      workEmail: 'sara@oxp.com',
      jobPosition: 'HR Officer',
      departmentId: hr.id,
      wage: '45000',
      bankAccount: 'ICICI-0002',
    },
    {
      name: 'John Dsouza',
      workEmail: 'john@oxp.com',
      jobPosition: 'Developer',
      departmentId: engineering.id,
      wage: '60000',
      bankAccount: 'SBI-0003',
    },
    {
      name: 'Neha Patel',
      workEmail: 'neha@oxp.com',
      jobPosition: 'Recruiter',
      departmentId: hr.id,
      wage: '40000',
      bankAccount: null,
    },
  )

  // Generate 197 more random employees (4 named above + 197 = ~201 total)
  for (let i = 1; i < 197; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `${firstName} ${lastName}`
    const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`
    const workEmail = `${emailName}@oxp.com`
    
    const job = jobPositions[Math.floor(Math.random() * jobPositions.length)]
    const departmentId = job.dept === 'engineering' ? engineering.id : job.dept === 'finance' ? finance.id : hr.id
    
    // Vary wages by ±15%
    const wageVariation = 0.85 + Math.random() * 0.3
    const wage = Math.floor(job.wage * wageVariation).toString()
    
    // 90% have bank accounts
    const hasBankAccount = Math.random() < 0.9
    const bankAccount = hasBankAccount 
      ? `${banks[Math.floor(Math.random() * banks.length)]}-${String(i + 1).padStart(4, '0')}`
      : null

    employeesData.push({
      name,
      workEmail,
      jobPosition: job.title,
      departmentId,
      wage,
      bankAccount
    })
  }

  let contractSeq = 40
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

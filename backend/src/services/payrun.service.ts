import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'
import type { CreatePayrunInput, UpdatePayrunInput } from '../validators/payrun.validator.js'
import { sendMail } from './mailer.js'
import { computePayslip, type EngineRule } from './payslip.engine.js'
import { getPayslipPdf } from './payslip.pdf.js'

const detailInclude = {
  structure: { select: { id: true, name: true } },
  payslips: {
    include: {
      employee: { select: { id: true, name: true, bankAccount: true } },
      lines: { orderBy: { sequence: 'asc' } },
    },
    orderBy: { employee: { name: 'asc' } },
  },
} satisfies Prisma.PayrunInclude

export async function list() {
  return prisma.payrun.findMany({
    include: { structure: { select: { id: true, name: true } }, _count: { select: { payslips: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(id: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id }, include: detailInclude })
  if (!payrun) throw new HttpError(404, 'Payrun not found')
  return payrun
}

export async function create(input: CreatePayrunInput) {
  const structure = await prisma.salaryStructure.findUnique({ where: { id: input.structureId } })
  if (!structure) throw new HttpError(404, 'Salary structure not found')
  if (input.periodEnd < input.periodStart) {
    throw new HttpError(400, 'Period end must be on or after period start')
  }
  return prisma.payrun.create({
    data: {
      name: input.name,
      structureId: input.structureId,
      employeeType: input.employeeType ?? null,
      employeeIds: input.employeeIds ?? [],
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    },
    include: detailInclude,
  })
}

export async function update(id: string, input: UpdatePayrunInput) {
  const payrun = await getById(id)
  if (payrun.status !== 'DRAFT') throw new HttpError(409, 'Only a draft payrun can be edited')
  return prisma.payrun.update({ where: { id }, data: input, include: detailInclude })
}

export async function remove(id: string) {
  const payrun = await getById(id)
  if (payrun.status === 'PAID') throw new HttpError(409, 'A paid payrun cannot be deleted')
  await prisma.payrun.delete({ where: { id } })
}

// Which employees fall in scope: the hand-picked selection if one was made,
// otherwise all active employees optionally filtered by employee type.
function scopeWhere(employeeType: string | null, employeeIds: string[]): Prisma.EmployeeWhereInput {
  if (employeeIds.length > 0) return { id: { in: employeeIds } }
  const where: Prisma.EmployeeWhereInput = { status: 'ACTIVE' }
  if (employeeType) where.employeeType = employeeType as Prisma.EnumEmployeeTypeFilter['equals']
  return where
}

function toEngineRules(rules: Prisma.SalaryRuleGetPayload<object>[]): EngineRule[] {
  return rules.map((r) => ({
    code: r.code,
    name: r.name,
    category: r.category,
    sequence: r.sequence,
    computeType: r.computeType,
    amount: r.amount ? Number(r.amount) : null,
    percent: r.percent ? Number(r.percent) : null,
    percentBase: r.percentBase,
    expression: r.expression,
  }))
}

// Compute the payrun: for each in-scope employee, resolve the contract running in
// the period, run the engine, and persist a payslip + its lines. All-or-nothing.
export async function compute(id: string) {
  const payrun = await getById(id)
  if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
    throw new HttpError(409, 'Only a draft or computed payrun can be recomputed')
  }

  const structure = await prisma.salaryStructure.findUnique({
    where: { id: payrun.structureId },
    include: { rules: { orderBy: { sequence: 'asc' } } },
  })
  if (!structure) throw new HttpError(404, 'Salary structure not found')
  const engineRules = toEngineRules(structure.rules)

  const employees = await prisma.employee.findMany({
    where: scopeWhere(payrun.employeeType, payrun.employeeIds),
  })

  const computed: {
    employeeId: string
    contractId: string
    gross: number
    deductions: number
    net: number
    lines: { ruleCode: string; ruleName: string; category: string; sequence: number; amount: number }[]
  }[] = []
  const skipped: { employeeId: string; name: string; reason: string }[] = []

  for (const emp of employees) {
    const contract = await prisma.contract.findFirst({
      where: {
        employeeId: emp.id,
        status: 'RUNNING',
        startDate: { lte: payrun.periodEnd },
        OR: [{ endDate: null }, { endDate: { gte: payrun.periodStart } }],
      },
    })
    if (!contract) {
      skipped.push({ employeeId: emp.id, name: emp.name, reason: 'No running contract for period' })
      continue
    }
    const result = computePayslip(Number(contract.wage), engineRules)
    computed.push({
      employeeId: emp.id,
      contractId: contract.id,
      gross: result.gross,
      deductions: result.deductions,
      net: result.net,
      lines: result.lines,
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.payslip.deleteMany({ where: { payrunId: id } })
    for (const c of computed) {
      await tx.payslip.create({
        data: {
          payrunId: id,
          employeeId: c.employeeId,
          contractId: c.contractId,
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          gross: c.gross,
          deductions: c.deductions,
          net: c.net,
          status: 'COMPUTED',
          lines: {
            create: c.lines.map((l) => ({
              ruleCode: l.ruleCode,
              ruleName: l.ruleName,
              category: l.category as EngineRule['category'],
              sequence: l.sequence,
              amount: l.amount,
            })),
          },
        },
      })
    }
    await tx.payrun.update({ where: { id }, data: { status: 'COMPUTED' } })
  })

  const payrun2 = await getById(id)
  return { payrun: payrun2, warnings: buildWarnings(payrun2), skipped }
}

export async function validate(id: string) {
  const payrun = await getById(id)
  if (payrun.status !== 'COMPUTED') throw new HttpError(409, 'Payrun must be computed before validation')
  if (payrun.payslips.length === 0) throw new HttpError(409, 'Payrun has no payslips')
  await prisma.$transaction([
    prisma.payslip.updateMany({ where: { payrunId: id }, data: { status: 'VALIDATED' } }),
    prisma.payrun.update({ where: { id }, data: { status: 'VALIDATED' } }),
  ])
  return getById(id)
}

export async function markPaid(id: string) {
  const payrun = await getById(id)
  if (payrun.status !== 'VALIDATED') throw new HttpError(409, 'Payrun must be validated before it can be paid')
  await prisma.$transaction([
    prisma.payslip.updateMany({ where: { payrunId: id }, data: { status: 'PAID' } }),
    prisma.payrun.update({ where: { id }, data: { status: 'PAID' } }),
  ])
  return getById(id)
}

// Email every payslip in the run to its employee, PDF attached. Requires a
// validated (or paid) run so nobody emails draft numbers.
export async function sendPayslips(id: string) {
  const payrun = await getById(id)
  if (payrun.status !== 'VALIDATED' && payrun.status !== 'PAID') {
    throw new HttpError(409, 'Validate the payrun before sending payslips')
  }

  const results: { to: string; previewUrl: string | false }[] = []
  for (const slip of payrun.payslips) {
    const { buffer, fileName } = await getPayslipPdf(slip.id)
    const employee = await prisma.employee.findUnique({
      where: { id: slip.employeeId },
      select: { workEmail: true, name: true },
    })
    if (!employee) continue
    const sent = await sendMail({
      to: employee.workEmail,
      subject: `Payslip - ${payrun.name}`,
      text: `Hi ${employee.name},\n\nYour payslip for ${payrun.name} is attached.\n\nNet pay: ${Number(slip.net).toLocaleString('en-IN')}\n\nPeoplePay360`,
      attachments: [{ filename: fileName, content: buffer }],
    })
    results.push(sent)
  }
  return { sent: results.length, results }
}

type PayrunWithSlips = Awaited<ReturnType<typeof getById>>

// Surface issues to review before finalizing: employees missing a bank account.
export function buildWarnings(payrun: PayrunWithSlips) {
  const warnings: { type: string; message: string; employeeId?: string }[] = []
  for (const slip of payrun.payslips) {
    if (!slip.employee.bankAccount) {
      warnings.push({
        type: 'MISSING_BANK_ACCOUNT',
        message: `${slip.employee.name} has no bank account on file`,
        employeeId: slip.employee.id,
      })
    }
  }
  return warnings
}

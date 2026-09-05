import { describe, expect, it } from 'vitest'

import { computePayslip, type EngineRule } from './payslip.engine.js'

// The seed's "Regular Salary" structure. Kept in sync with prisma/seed.ts.
const regularSalary: EngineRule[] = [
  { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 10, computeType: 'PERCENTAGE', percent: 50, percentBase: 'CONTRACT_WAGE' },
  { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, computeType: 'PERCENTAGE', percent: 20, percentBase: 'BASIC' },
  { code: 'MEAL', name: 'Meal Allowance', category: 'ALLOWANCE', sequence: 30, computeType: 'FIXED', amount: 2000 },
  { code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 40, computeType: 'FORMULA', expression: "categories['BASIC'] + categories['ALLOWANCE']" },
  { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 50, computeType: 'PERCENTAGE', percent: 12, percentBase: 'BASIC' },
  { code: 'PT', name: 'Professional Tax', category: 'DEDUCTION', sequence: 60, computeType: 'FIXED', amount: 200 },
  { code: 'NET', name: 'Net Salary', category: 'NET', sequence: 70, computeType: 'FORMULA', expression: "categories['GROSS'] - categories['DEDUCTION']" },
]

describe('computePayslip', () => {
  it('computes the seed structure to a known net (wage 60000)', () => {
    const r = computePayslip(60000, regularSalary)
    const byCode = Object.fromEntries(r.lines.map((l) => [l.ruleCode, l.amount]))

    expect(byCode.BASIC).toBe(30000) // 50% of 60000
    expect(byCode.HRA).toBe(6000) // 20% of BASIC
    expect(byCode.MEAL).toBe(2000)
    expect(byCode.GROSS).toBe(38000) // BASIC + ALLOWANCE (6000 + 2000)
    expect(byCode.PF).toBe(3600) // 12% of BASIC
    expect(byCode.PT).toBe(200)
    expect(byCode.NET).toBe(34200) // GROSS - DEDUCTION (3600 + 200)

    expect(r.gross).toBe(38000)
    expect(r.deductions).toBe(3800)
    expect(r.net).toBe(34200)
  })

  it('runs rules in sequence order regardless of input order', () => {
    const shuffled = [...regularSalary].reverse()
    const r = computePayslip(60000, shuffled)
    expect(r.lines.map((l) => l.ruleCode)).toEqual(['BASIC', 'HRA', 'MEAL', 'GROSS', 'PF', 'PT', 'NET'])
    expect(r.net).toBe(34200)
  })

  it('FIXED rule uses its amount directly', () => {
    const r = computePayslip(50000, [
      { code: 'MEAL', name: 'Meal', category: 'ALLOWANCE', sequence: 10, computeType: 'FIXED', amount: 1500 },
    ])
    expect(r.lines[0].amount).toBe(1500)
  })

  it('PERCENTAGE off CONTRACT_WAGE vs off a prior category', () => {
    const r = computePayslip(100000, [
      { code: 'BASIC', name: 'Basic', category: 'BASIC', sequence: 10, computeType: 'PERCENTAGE', percent: 40, percentBase: 'CONTRACT_WAGE' },
      { code: 'HRA', name: 'HRA', category: 'ALLOWANCE', sequence: 20, computeType: 'PERCENTAGE', percent: 50, percentBase: 'BASIC' },
    ])
    expect(r.categories.BASIC).toBe(40000)
    expect(r.categories.ALLOWANCE).toBe(20000) // 50% of BASIC
  })

  it('rounds to 2 decimals', () => {
    const r = computePayslip(33333, [
      { code: 'BASIC', name: 'Basic', category: 'BASIC', sequence: 10, computeType: 'PERCENTAGE', percent: 33.333, percentBase: 'CONTRACT_WAGE' },
    ])
    expect(r.lines[0].amount).toBe(11110.89) // 33333 * 33.333%
  })

  it('rejects a formula that reaches outside categories (injection guard)', () => {
    expect(() =>
      computePayslip(60000, [
        { code: 'HACK', name: 'Hack', category: 'NET', sequence: 10, computeType: 'FORMULA', expression: 'process.exit(1)' },
      ]),
    ).toThrow(/Unsafe salary formula/)
  })

  it('rejects a formula that calls a function', () => {
    expect(() =>
      computePayslip(60000, [
        { code: 'HACK', name: 'Hack', category: 'NET', sequence: 10, computeType: 'FORMULA', expression: "categories['BASIC'].toString()" },
      ]),
    ).toThrow(/Unsafe salary formula/)
  })
})

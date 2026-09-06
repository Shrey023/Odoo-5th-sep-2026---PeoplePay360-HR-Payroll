import type { ComputeType, PercentBase, RuleCategory } from '@prisma/client'

export interface EngineRule {
  code: string
  name: string
  category: RuleCategory
  sequence: number
  computeType: ComputeType
  amount?: number | null
  percent?: number | null
  percentBase?: PercentBase | null
  expression?: string | null
}

export interface ComputedLine {
  ruleCode: string
  ruleName: string
  category: RuleCategory
  sequence: number
  amount: number
}

export interface EngineResult {
  lines: ComputedLine[]
  categories: Record<string, number>
  gross: number
  deductions: number
  net: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// A rule's PERCENTAGE base reads from either the contract wage or a running category total.
function resolveBase(base: PercentBase, contractWage: number, categories: Record<string, number>) {
  if (base === 'CONTRACT_WAGE') return contractWage
  return categories[base] ?? 0
}

// Only allow FORMULA expressions to reference categories[...], workedDays, and arithmetic.
const FORMULA_ALLOWED = /^[\s\d+\-*/().[\]'workedDays]*(categories\['[A-Z_]+'\][\s\d+\-*/().[\]']*)*$/

function evalFormula(expression: string, categories: Record<string, number>, workedDays: number): number {
  const normalized = expression.replace(/categories\["([A-Z_]+)"\]/g, "categories['$1']")
  if (!FORMULA_ALLOWED.test(normalized)) {
    throw new Error(`Unsafe salary formula: ${expression}`)
  }
  const fn = new Function('categories', 'workedDays', `"use strict"; return (${normalized});`)
  const value = fn(categories, workedDays)
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Salary formula did not return a number: ${expression}`)
  }
  return value
}

export interface EngineResult {
  lines: ComputedLine[]
  categories: Record<string, number>
  gross: number
  deductions: number
  net: number
  workedDays: number
}

// Run salary rules in sequence order against a contract wage.
// workedDays is the count of actual PRESENT/LATE/OVERTIME attendance records for the period.
// FORMULA rules can reference workedDays directly, e.g. categories['BASIC'] * (workedDays / 22)
export function computePayslip(contractWage: number, rules: EngineRule[], workedDays = 22): EngineResult {
  const ordered = [...rules].sort((a, b) => a.sequence - b.sequence)
  const categories: Record<string, number> = {
    BASIC: 0,
    ALLOWANCE: 0,
    GROSS: 0,
    DEDUCTION: 0,
    NET: 0,
  }
  const lines: ComputedLine[] = []

  for (const rule of ordered) {
    let amount: number

    switch (rule.computeType) {
      case 'FIXED':
        amount = Number(rule.amount ?? 0)
        break
      case 'PERCENTAGE': {
        const base = resolveBase(rule.percentBase ?? 'CONTRACT_WAGE', contractWage, categories)
        amount = (base * Number(rule.percent ?? 0)) / 100
        break
      }
      case 'FORMULA':
        amount = evalFormula(rule.expression ?? '0', categories, workedDays)
        break
      default:
        amount = 0
    }

    amount = round2(amount)

    // GROSS/NET are formula totals of other categories; don't double-count them
    // back into a running bucket. Only the component categories accumulate.
    if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE' || rule.category === 'DEDUCTION') {
      categories[rule.category] += amount
    } else {
      categories[rule.category] = amount
    }

    lines.push({
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount,
    })
  }

  const gross = round2(categories.GROSS || categories.BASIC + categories.ALLOWANCE)
  const deductions = round2(categories.DEDUCTION)
  const net = round2(categories.NET || gross - deductions)

  return { lines, categories, gross, deductions, net, workedDays }
}

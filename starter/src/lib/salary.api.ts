import { http } from './http'

export type RuleCategory = 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET'
export type ComputeType = 'FIXED' | 'PERCENTAGE' | 'FORMULA'
export type PercentBase = 'CONTRACT_WAGE' | 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION'

export interface SalaryRule {
  id: string
  structureId: string
  name: string
  code: string
  category: RuleCategory
  sequence: number
  computeType: ComputeType
  amount: string | null
  percent: string | null
  percentBase: PercentBase | null
  expression: string | null
}

export interface StructureSummary {
  id: string
  name: string
  status: string
  _count: { rules: number }
}

export interface StructureDetail {
  id: string
  name: string
  status: string
  rules: SalaryRule[]
}

export interface RuleInput {
  name: string
  code: string
  category: RuleCategory
  sequence: number
  computeType: ComputeType
  amount?: number | null
  percent?: number | null
  percentBase?: PercentBase | null
  expression?: string | null
}

export interface PayslipPreview {
  contract: { id: string; reference: string; wage: number }
  employee: { id: string; name: string }
  structure: { id: string; name: string }
  lines: { ruleCode: string; ruleName: string; category: RuleCategory; sequence: number; amount: number }[]
  categories: Record<string, number>
  gross: number
  deductions: number
  net: number
}

export const salaryApi = {
  listStructures: () => http<StructureSummary[]>('/salary-structures'),
  getStructure: (id: string) => http<StructureDetail>(`/salary-structures/${id}`),
  createStructure: (input: { name: string }) =>
    http<StructureDetail>('/salary-structures', { method: 'POST', body: JSON.stringify(input) }),
  addRule: (structureId: string, input: RuleInput) =>
    http<SalaryRule>(`/salary-structures/${structureId}/rules`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateRule: (ruleId: string, input: Partial<RuleInput>) =>
    http<SalaryRule>(`/salary-structures/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  removeRule: (ruleId: string) =>
    http<null>(`/salary-structures/rules/${ruleId}`, { method: 'DELETE' }),
  previewContract: (contractId: string) =>
    http<PayslipPreview>(`/salary-structures/preview?contractId=${contractId}`),
}

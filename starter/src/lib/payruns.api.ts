import { http } from './http'

export type PayrunStatus = 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID'

export interface PayrunSummary {
  id: string
  name: string
  status: PayrunStatus
  periodStart: string
  periodEnd: string
  structure: { id: string; name: string }
  _count: { payslips: number }
}

export interface PayslipLine {
  id: string
  ruleCode: string
  ruleName: string
  category: string
  sequence: number
  amount: string
}

export interface Payslip {
  id: string
  net: string
  gross: string
  deductions: string
  status: string
  employee: { id: string; name: string; bankAccount: string | null }
  lines: PayslipLine[]
}

export interface Warning {
  type: string
  message: string
  employeeId?: string
}

export interface PayrunDetail {
  id: string
  name: string
  status: PayrunStatus
  periodStart: string
  periodEnd: string
  structure: { id: string; name: string }
  payslips: Payslip[]
  warnings: Warning[]
}

export interface CreatePayrunInput {
  name: string
  structureId: string
  employeeType?: string | null
  periodStart: string
  periodEnd: string
}

export const payrunsApi = {
  list: () => http<PayrunSummary[]>('/payruns'),
  get: (id: string) => http<PayrunDetail>(`/payruns/${id}`),
  create: (input: CreatePayrunInput) =>
    http<PayrunDetail>('/payruns', { method: 'POST', body: JSON.stringify(input) }),
  compute: (id: string) =>
    http<{ payrun: PayrunDetail; warnings: Warning[]; skipped: { name: string; reason: string }[] }>(
      `/payruns/${id}/compute`,
      { method: 'POST' },
    ),
  validate: (id: string) => http<PayrunDetail>(`/payruns/${id}/validate`, { method: 'POST' }),
  markPaid: (id: string) => http<PayrunDetail>(`/payruns/${id}/pay`, { method: 'POST' }),
  send: (id: string) =>
    http<{ sent: number; results: { to: string; previewUrl: string | false }[] }>(
      `/payruns/${id}/send`,
      { method: 'POST' },
    ),
  payslipPdfUrl: (payslipId: string) => `/payruns/payslips/${payslipId}/pdf`,
}

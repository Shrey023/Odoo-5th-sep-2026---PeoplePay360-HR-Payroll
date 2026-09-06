import { http } from './http'
import type { Ref } from './employees.api'

export type ContractStatus = 'DRAFT' | 'RUNNING' | 'EXPIRED'

export interface Contract {
  id: string
  reference: string
  employeeId: string
  jobPosition: string | null
  employeeType: 'FULL_TIME' | 'CONTRACTOR' | 'INTERN'
  startDate: string
  endDate: string | null
  wage: string
  status: ContractStatus
  department: Ref | null
  structure: Ref | null
  schedule: Ref | null
}

export interface ContractInput {
  employeeId: string
  jobPosition?: string | null
  employeeType?: Contract['employeeType']
  startDate: string
  endDate?: string | null
  wage: number
  status?: ContractStatus
  departmentId?: string | null
  structureId?: string | null
}

export const contractsApi = {
  listAll: () => http<(Contract & { employee: { id: string; name: string } })[]>('/contracts'),
  listForEmployee: (employeeId: string) =>
    http<Contract[]>(`/contracts?employeeId=${employeeId}`),
  create: (input: ContractInput) =>
    http<Contract>('/contracts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Partial<ContractInput>) =>
    http<Contract>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => http<null>(`/contracts/${id}`, { method: 'DELETE' }),
}

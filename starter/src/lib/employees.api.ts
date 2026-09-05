import { http } from './http'

export interface Ref {
  id: string
  name: string
}

export interface Employee {
  id: string
  name: string
  workEmail: string
  jobPosition: string
  employeeType: 'FULL_TIME' | 'CONTRACTOR' | 'INTERN'
  status: 'ACTIVE' | 'INACTIVE'
  bankAccount: string | null
  department: Ref | null
  company: Ref | null
  manager: Ref | null
  createdAt: string
}

export interface EmployeeDetail extends Employee {
  schedule: { id: string; name: string; weeklyHours: string } | null
  counts: { contracts: number; attendances: number; requests: number; allocations: number }
}

export interface EmployeeInput {
  name: string
  workEmail: string
  jobPosition: string
  employeeType?: Employee['employeeType']
  status?: Employee['status']
  bankAccount?: string | null
  departmentId?: string | null
  managerId?: string | null
}

export const employeesApi = {
  list: (params?: { search?: string; status?: string; departmentId?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString()
    return http<Employee[]>(`/employees${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => http<EmployeeDetail>(`/employees/${id}`),
  create: (input: EmployeeInput) =>
    http<Employee>('/employees', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Partial<EmployeeInput>) =>
    http<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => http<null>(`/employees/${id}`, { method: 'DELETE' }),
}

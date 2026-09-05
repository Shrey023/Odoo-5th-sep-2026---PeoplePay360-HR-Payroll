import { http } from './http'

export interface DashboardData {
  kpis: {
    activeEmployees: number
    totalNet: number
    payslips: number
    paid: number
    pending: number
  }
  byDepartment: { name: string; headcount: number; net: number }[]
  timeOff: {
    approvedDays: number
    pendingRequests: number
  }
  attendance: {
    byStatus: { PRESENT: number; LATE: number; ABSENT: number; OVERTIME: number }
    missingCheckouts: number
  }
  warnings: { type: string; message: string }[]
}

export const dashboardApi = {
  get: (filters?: { employeeType?: string; departmentId?: string }) => {
    const params = new URLSearchParams()
    if (filters?.employeeType) params.set('employeeType', filters.employeeType)
    if (filters?.departmentId) params.set('departmentId', filters.departmentId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return http<DashboardData>(`/dashboard${qs}`)
  },
}

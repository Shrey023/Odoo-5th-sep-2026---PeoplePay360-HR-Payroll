import { http } from './http'

export type LeaveUnit = 'DAYS' | 'HOURS'
export type RequestStatus = 'DRAFT' | 'TO_APPROVE' | 'APPROVED' | 'REFUSED'
export type AllocationStatus = 'DRAFT' | 'APPROVED' | 'REFUSED'

export interface TimeOffType {
  id: string
  name: string
  unit: LeaveUnit
  requiresAllocation: boolean
  approvalRequired: boolean
  color: string
}

export interface Allocation {
  id: string
  amount: string
  validFrom: string
  validTo: string
  status: AllocationStatus
  employee: { id: string; name: string }
  type: { id: string; name: string; unit: LeaveUnit }
}

export interface TimeOffRequest {
  id: string
  startDate: string
  endDate: string
  duration: string
  status: RequestStatus
  employee: { id: string; name: string }
  type: { id: string; name: string; unit: LeaveUnit; requiresAllocation: boolean }
}

export interface Balance {
  typeId: string
  typeName: string
  unit: LeaveUnit
  requiresAllocation: boolean
  allocated: number
  taken: number
  remaining: number
}

export interface TypeInput {
  name: string
  unit?: LeaveUnit
  requiresAllocation?: boolean
  approvalRequired?: boolean
}

export interface AllocationInput {
  employeeId: string
  typeId: string
  amount: number
  validFrom: string
  validTo: string
}

export interface RequestInput {
  employeeId: string
  typeId: string
  startDate: string
  endDate: string
  duration: number
}

export const timeOffApi = {
  listTypes: () => http<TimeOffType[]>('/time-off/types'),
  createType: (input: TypeInput) =>
    http<TimeOffType>('/time-off/types', { method: 'POST', body: JSON.stringify(input) }),
  removeType: (id: string) => http<null>(`/time-off/types/${id}`, { method: 'DELETE' }),

  listAllocations: (employeeId?: string) =>
    http<Allocation[]>(`/time-off/allocations${employeeId ? `?employeeId=${employeeId}` : ''}`),
  createAllocation: (input: AllocationInput) =>
    http<Allocation>('/time-off/allocations', { method: 'POST', body: JSON.stringify(input) }),
  decideAllocation: (id: string, status: AllocationStatus) =>
    http<Allocation>(`/time-off/allocations/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  listRequests: (employeeId?: string) =>
    http<TimeOffRequest[]>(`/time-off/requests${employeeId ? `?employeeId=${employeeId}` : ''}`),
  getRequest: (id: string) => http<TimeOffRequest>(`/time-off/requests/${id}`),
  createRequest: (input: RequestInput) =>
    http<TimeOffRequest>('/time-off/requests', { method: 'POST', body: JSON.stringify(input) }),
  decideRequest: (id: string, status: RequestStatus) =>
    http<TimeOffRequest>(`/time-off/requests/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  balances: (employeeId: string) => http<Balance[]>(`/time-off/balances/${employeeId}`),
}

export interface Attendance {
  id: string
  checkIn: string
  checkOut: string | null
  workedHours: string
  status: string
  employee: { id: string; name: string }
}

export const attendanceApi = {
  list: (employeeId: string) => http<Attendance[]>(`/attendance?employeeId=${employeeId}`),
}

import { http } from './http'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'OVERTIME'

export interface Attendance {
  id: string
  checkIn: string
  checkOut: string | null
  workedHours: string
  status: AttendanceStatus
  manualEdit: boolean
  employee: { id: string; name: string }
}

export interface CreateAttendanceInput {
  employeeId: string
  checkIn: string
  checkOut?: string
  status?: AttendanceStatus
}

export interface UpdateAttendanceInput {
  checkIn?: string
  checkOut?: string | null
  status?: AttendanceStatus
}

export const attendanceApi = {
  list: (employeeId?: string) =>
    http<Attendance[]>(`/attendance${employeeId ? `?employeeId=${employeeId}` : ''}`),
  create: (input: CreateAttendanceInput) =>
    http<Attendance>('/attendance', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateAttendanceInput) =>
    http<Attendance>(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => http<null>(`/attendance/${id}`, { method: 'DELETE' }),
}

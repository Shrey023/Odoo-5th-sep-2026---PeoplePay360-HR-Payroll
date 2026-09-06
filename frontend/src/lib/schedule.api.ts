import { http } from './http'

export interface ScheduleLine {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakMinutes: number
}

export interface WorkingSchedule {
  id: string
  name: string
  calendarType: string
  daysPerWeek: number
  weeklyHours: string
  status: string
  company: { id: string; name: string } | null
  lines: ScheduleLine[]
}

export interface UpsertLinesInput {
  name?: string
  lines: {
    dayOfWeek: number
    startTime: string
    endTime: string
    breakMinutes?: number
  }[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function dayName(n: number) {
  return DAY_NAMES[n] ?? String(n)
}

export const scheduleApi = {
  list: () => http<WorkingSchedule[]>('/schedules'),
  get: (id: string) => http<WorkingSchedule>(`/schedules/${id}`),
  create: (name: string, calendarType?: string) =>
    http<WorkingSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify({ name, calendarType: calendarType ?? 'Standard' }),
    }),
  upsertLines: (id: string, input: UpsertLinesInput) =>
    http<WorkingSchedule>(`/schedules/${id}/lines`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
}

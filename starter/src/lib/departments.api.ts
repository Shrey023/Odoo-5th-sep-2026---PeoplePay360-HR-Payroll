import { http } from './http'

export interface Department {
  id: string
  name: string
  companyId: string | null
  company: { id: string; name: string } | null
}

export const departmentsApi = {
  list: () => http<Department[]>('/departments'),
}

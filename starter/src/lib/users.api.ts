import { http } from './http'
import type { Role } from './auth'

export interface User {
  id: string
  name: string
  email: string
  roles: Role[]
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  roles: Role[]
}

export interface UpdateUserRolesInput {
  roles: Role[]
}

export const usersApi = {
  list: () => http<User[]>('/users'),
  create: (input: CreateUserInput) =>
    http<User>('/users', { method: 'POST', body: JSON.stringify(input) }),
  updateRoles: (id: string, input: UpdateUserRolesInput) =>
    http<User>(`/users/${id}/roles`, { method: 'PATCH', body: JSON.stringify(input) }),
}

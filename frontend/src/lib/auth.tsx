import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { queryClient } from '../main'
import { getToken, http, setToken } from './http'

export type Role =
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'HR_PAYROLL_MANAGER'
  | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  roles: Role[]
}

interface AuthResult {
  token: string
  user: User
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    http<User>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await http<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(res.token)
    setUser(res.user)
  }

  async function register(name: string, email: string, password: string) {
    const res = await http<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setToken(res.token)
    setUser(res.user)
  }

  function logout() {
    setToken(null)
    setUser(null)
    queryClient.clear()
  }

  function hasRole(...roles: Role[]) {
    return !!user && user.roles.some((r) => roles.includes(r))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="flex min-h-svh items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

export const HR_ROLES: Role[] = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']
export const PAYROLL_CONFIG_ROLES: Role[] = ['HR_PAYROLL_MANAGER', 'ADMIN']
export const PAYROLL_WRITE_ROLES: Role[] = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']

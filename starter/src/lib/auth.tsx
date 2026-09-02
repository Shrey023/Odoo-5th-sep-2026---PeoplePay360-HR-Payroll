import { createContext, type ReactNode, useContext, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Mock auth. Swap the login/register/logout bodies for real API calls
 * (Supabase auth or your Express+JWT endpoint) on event day. The rest of
 * the app only depends on this hook's shape, so nothing else changes.
 */

export type Role = 'user' | 'admin'
export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)
const STORAGE_KEY = 'app.user'

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStored)

  function persist(u: User | null) {
    setUser(u)
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_KEY)
  }

  async function login(email: string, _password: string) {
    // TODO: replace with real API call.
    const role: Role = email.startsWith('admin') ? 'admin' : 'user'
    persist({ id: '1', name: email.split('@')[0], email, role })
  }

  async function register(name: string, email: string, _password: string) {
    // TODO: replace with real API call.
    persist({ id: '1', name, email, role: 'user' })
  }

  function logout() {
    persist(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
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
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

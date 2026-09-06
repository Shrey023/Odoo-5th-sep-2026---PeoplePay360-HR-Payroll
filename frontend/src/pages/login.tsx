import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="size-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">PeoplePay360</span>
          </div>
          <h1 className="text-3xl font-bold text-sidebar-foreground leading-tight mb-4">
            HR & Payroll,<br />done right.
          </h1>
          <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-xs">
            Manage employees, run payroll, track attendance and leave - all in one place.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-sidebar-foreground/50 leading-relaxed">
            Sign in with your work email to access your account. Contact your administrator if you need access.
          </p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-7 rounded-md bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="size-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-foreground">PeoplePay360</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in to continue to your workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are created by an administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

import { Calculator, LayoutDashboard, LogOut, Plane, Receipt, ShieldCheck, Users } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/salary-structures', label: 'Salary Structures', icon: Calculator },
  { to: '/payruns', label: 'Payruns', icon: Receipt },
  { to: '/time-off', label: 'Time Off', icon: Plane },
  { to: '/users', label: 'Users', icon: ShieldCheck, adminOnly: true },
]

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

export function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  const { pathname } = useLocation()
  const current = nav.find((n) => isActive(pathname, n.to))

  // Filter navigation items based on role
  const visibleNav = nav.filter((item) => {
    if (item.adminOnly) {
      return hasRole('ADMIN')
    }
    return true
  })

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold">PeoplePay360</div>
        <nav className="flex flex-1 flex-col gap-1">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(pathname, to)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <div className="mb-2 px-2 text-sm">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-muted-foreground">
              {user?.roles.map((r) => r.replace(/_/g, ' ')).join(', ').toLowerCase()}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-6">
          <h1 className="text-base font-semibold capitalize">
            {current?.label ?? 'App'}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

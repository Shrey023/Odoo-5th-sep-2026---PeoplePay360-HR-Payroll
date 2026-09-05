import {
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Plane,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string }
type NavGroup = {
  label: string
  icon: React.ElementType
  items: NavItem[]
  adminOnly?: boolean
  hrOnly?: boolean
}
type NavLink = {
  to: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  hrOnly?: boolean
}
type NavEntry = NavGroup | NavLink

function isNavGroup(e: NavEntry): e is NavGroup {
  return 'items' in e
}

const nav: NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, hrOnly: true },
  { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
  { to: '/my-profile', label: 'My Profile', icon: Users },
  {
    label: 'Employees',
    icon: Users,
    hrOnly: true,
    items: [
      { to: '/employees', label: 'Employees' },
      { to: '/contracts', label: 'Contracts' },
      { to: '/departments', label: 'Departments' },
      { to: '/working-schedules', label: 'Working Schedules' },
    ],
  },
  { to: '/attendance', label: 'Attendance', icon: CalendarClock, hrOnly: true },
  {
    label: 'Time Off',
    icon: Plane,
    hrOnly: true,
    items: [
      { to: '/time-off/requests', label: 'Time Offs' },
      { to: '/time-off/allocations', label: 'Allocations' },
      { to: '/time-off/types', label: 'Time Off Types' },
    ],
  },
  {
    label: 'Payroll',
    icon: Receipt,
    hrOnly: true,
    items: [
      { to: '/payruns', label: 'Payruns' },
      { to: '/payslips', label: 'Payslips' },
      { to: '/salary-structures', label: 'Salary Structures' },
      { to: '/salary-rules', label: 'Salary Rules' },
    ],
  },
  { to: '/users', label: 'Users', icon: ShieldCheck, adminOnly: true },
]

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

function groupActive(pathname: string, items: NavItem[]) {
  return items.some((i) => isActive(pathname, i.to))
}

export function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  const { pathname } = useLocation()

  const defaultOpen = nav
    .filter(isNavGroup)
    .filter((g) => groupActive(pathname, g.items))
    .map((g) => g.label)

  const [open, setOpen] = useState<string[]>(defaultOpen)

  function toggle(label: string) {
    setOpen((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    )
  }

  const pageLabel = (() => {
    for (const entry of nav) {
      if (isNavGroup(entry)) {
        const match = entry.items.find((i) => isActive(pathname, i.to))
        if (match) return match.label
      } else {
        if (isActive(pathname, entry.to)) return entry.label
      }
    }
    return 'HR'
  })()

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold">PeoplePay360</div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((entry) => {
            const isHR = hasRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER')
            const isEmployee = !isHR
            if (!isNavGroup(entry)) {
              if (entry.adminOnly && !hasRole('ADMIN')) return null
              if (entry.hrOnly && isEmployee) return null
              if (!entry.hrOnly && !['My Payslips', 'My Profile'].includes(entry.label) && isEmployee) return null
              const Icon = entry.icon
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(pathname, entry.to)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60',
                  )}
                >
                  <Icon className="size-4" />
                  {entry.label}
                </Link>
              )
            }

            if (entry.adminOnly && !hasRole('ADMIN')) return null
            if (entry.hrOnly && isEmployee) return null
            const Icon = entry.icon
            const isOpen = open.includes(entry.label)
            const active = groupActive(pathname, entry.items)

            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggle(entry.label)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">
                    {entry.label} ▼
                  </span>
                  <ChevronDown
                    className={cn('size-3 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen && (
                  <div className="ml-7 mt-0.5 flex flex-col gap-0.5">
                    {entry.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-sm transition-colors',
                          isActive(pathname, item.to)
                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60',
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
          <h1 className="text-base font-semibold">{pageLabel}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

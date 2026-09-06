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
  employeeOnly?: boolean
}
type NavLink = {
  to: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  hrOnly?: boolean
  employeeOnly?: boolean
}
type NavEntry = NavGroup | NavLink

function isNavGroup(e: NavEntry): e is NavGroup {
  return 'items' in e
}

const nav: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hrOnly: true },
  { to: '/my-dashboard', label: 'My Dashboard', icon: LayoutDashboard, employeeOnly: true },
  { to: '/my-payslips', label: 'My Payslips', icon: Receipt, employeeOnly: true },
  { to: '/my-profile', label: 'My Profile', icon: Users, employeeOnly: true },
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
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar md:flex h-screen sticky top-0 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="size-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="size-4 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight">PeoplePay360</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto min-h-0">
          {nav.map((entry) => {
            const isHR = hasRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER')
            const isEmployee = !isHR
            if (!isNavGroup(entry)) {
              if (entry.adminOnly && !hasRole('ADMIN')) return null
              if (entry.hrOnly && isEmployee) return null
              if (entry.employeeOnly && isHR) return null
              const Icon = entry.icon
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(pathname, entry.to)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {entry.label}
                </Link>
              )
            }

            if (entry.adminOnly && !hasRole('ADMIN')) return null
            if (entry.hrOnly && isEmployee) return null
            if (entry.employeeOnly && isHR) return null
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
                      ? 'text-sidebar-foreground'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
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
                            : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
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

        {/* User card */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
              <div className="text-xs text-sidebar-foreground/50 truncate capitalize">
                {user?.roles[0]?.replace(/_/g, ' ').toLowerCase()}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="size-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 shrink-0" onClick={logout} title="Logout">
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <header className="flex h-12 items-center border-b bg-card/80 backdrop-blur px-6 gap-3 sticky top-0 z-10">
          <span className="text-xs text-muted-foreground">PeoplePay360</span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <h1 className="text-sm font-semibold text-foreground">{pageLabel}</h1>
        </header>
        <main className="flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

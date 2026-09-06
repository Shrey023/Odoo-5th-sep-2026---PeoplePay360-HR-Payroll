import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Banknote, CalendarCheck, Clock, Receipt, Users } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dashboardApi } from '@/lib/dashboard.api'
import { departmentsApi } from '@/lib/departments.api'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'INTERN', label: 'Intern' },
]

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: '#16a34a',
  LATE: '#f59e0b',
  ABSENT: '#dc2626',
  OVERTIME: '#2563eb',
}

const currency = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString('en-IN')}`

export function DashboardPage() {
  const [employeeType, setEmployeeType] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', employeeType, departmentId],
    queryFn: () =>
      dashboardApi.get({
        employeeType: employeeType || undefined,
        departmentId: departmentId || undefined,
      }),
  })

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading dashboard...</p>
  }

  const { kpis, byDepartment, timeOff, attendance, trend, warnings } = data

  const trendPct = (() => {
    if (trend.length < 2) return null
    const prev = trend[trend.length - 2].net
    const curr = trend[trend.length - 1].net
    if (prev === 0) return null
    return (((curr - prev) / prev) * 100).toFixed(1)
  })()

  const kpiCards = [
    {
      label: 'Total Net Salary Paid',
      value: currency(kpis.totalNet),
      sub: trendPct ? `${Number(trendPct) >= 0 ? '+' : ''}${trendPct}% vs previous month` : `${kpis.paid} paid, ${kpis.pending} pending`,
      icon: Banknote,
    },
    {
      label: 'Payslips Generated',
      value: kpis.payslips,
      sub: `${kpis.paid} paid · ${kpis.pending} pending`,
      icon: Receipt,
    },
    {
      label: 'Avg Salary / Employee',
      value: currency(kpis.avgSalary),
      sub: `Across ${kpis.activeEmployees} active employees`,
      icon: Users,
    },
    {
      label: 'Approved Time Off Days',
      value: `${timeOff.approvedDays} Days`,
      sub: `${timeOff.pendingRequests} pending requests`,
      icon: CalendarCheck,
    },
    {
      label: 'Attendance Health',
      value: `${kpis.attendanceHealth}%`,
      sub: 'Present / reviewed records',
      icon: Clock,
    },
  ]

  const attendanceData = Object.entries(attendance.byStatus)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }))

  const trendData = trend.map((t) => ({
    month: t.month.slice(5),
    net: t.net,
  }))

  const payslipStatusData = [
    { name: 'Paid', value: kpis.paid, color: '#16a34a' },
    { name: 'Pending', value: kpis.pending, color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold">Payroll Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Live payroll and HR overview across the company.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={departmentId}
            onChange={(ev) => setDepartmentId(ev.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={employeeType}
            onChange={(ev) => setEmployeeType(ev.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue="oxp">
            <option value="oxp">OXP Pvt Ltd</option>
          </select>
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="size-4" /> Payroll Alerts
            </div>
            <ul className="space-y-1 text-sm text-amber-900">
              {warnings.map((w) => (
                <li key={w.type}>• {w.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpiCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <c.icon className="size-4" />
                <span className="text-xs">{c.label}</span>
              </div>
              <div className="text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Salary Cost by Department</CardTitle>
            <p className="text-xs text-muted-foreground">Source: Payslips + Employee Department</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => currency(v as number)} />
                <Bar dataKey="net" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Net Salary Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Source: historical Payslips / Payruns</p>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No validated payruns yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip formatter={(v) => currency(v as number)} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payslip Status &amp; Payroll Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">Source: Payrun + Payslip validation</p>
          </CardHeader>
          <CardContent>
            {/* Stacked status bar */}
            <p className="text-xs text-muted-foreground mb-1">Status split</p>
            {(() => {
              const total = kpis.paid + kpis.pending
              const paidPct = total > 0 ? (kpis.paid / total) * 100 : 0
              const pendingPct = total > 0 ? (kpis.pending / total) * 100 : 0
              return (
                <div className="mb-1 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className="bg-green-500 transition-all" style={{ width: `${paidPct}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${pendingPct}%` }} />
                </div>
              )
            })()}
            <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500 inline-block" /> Paid <strong className="text-foreground">{kpis.paid}</strong></span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400 inline-block" /> Pending <strong className="text-foreground">{kpis.pending}</strong></span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Current alerts</p>
              {warnings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No alerts.</p>
              ) : (
                warnings.map((w) => {
                  const isRed = w.type === 'missing_bank' || w.type === 'duplicate'
                  return (
                    <div key={w.type} className={`text-xs ${isRed ? 'text-red-600' : 'text-muted-foreground'}`}>
                      • {w.message}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Source: Attendance</p>
          </CardHeader>
          <CardContent>
            {attendanceData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No attendance records.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        strokeWidth={2}
                      >
                        {attendanceData.map((d) => (
                          <Cell key={d.name} fill={ATTENDANCE_COLORS[d.name] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Records']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {attendanceData.map((d) => {
                      const total = attendanceData.reduce((s, x) => s + x.value, 0)
                      const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                      return (
                        <div key={d.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full flex-shrink-0" style={{ background: ATTENDANCE_COLORS[d.name] ?? '#94a3b8' }} />
                            <span className="text-xs text-muted-foreground capitalize">{d.name.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{d.value}</span>
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-3 flex gap-4 border-t pt-3 text-xs text-muted-foreground">
                  <span>Missing check-outs: <strong>{attendance.missingCheckouts}</strong></span>
                  <span>Coverage: <strong>{kpis.attendanceHealth}%</strong></span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Time Off Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Source: Time Off Requests + Allocations</p>
          </CardHeader>
          <CardContent>
            {timeOff.byType.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No time off data.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-right text-xs">Approved</TableHead>
                    <TableHead className="text-right text-xs">Pending</TableHead>
                    <TableHead className="text-right text-xs">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOff.byType.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell className="text-xs py-2">{t.name}</TableCell>
                      <TableCell className="text-right text-xs py-2">{t.approvedDays}</TableCell>
                      <TableCell className="text-right text-xs py-2">{t.pending}</TableCell>
                      <TableCell className="text-right text-xs py-2">{t.remainingBalance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Department Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Source: Employee + Contract + Payslip totals</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-right text-xs">Headcount</TableHead>
                  <TableHead className="text-right text-xs">Monthly Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDepartment.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="text-xs py-2">{d.name}</TableCell>
                    <TableCell className="text-right text-xs py-2">{d.headcount}</TableCell>
                    <TableCell className="text-right text-xs py-2">{currency(d.net)}</TableCell>
                  </TableRow>
                ))}
                {byDepartment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-muted-foreground">
                      No data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

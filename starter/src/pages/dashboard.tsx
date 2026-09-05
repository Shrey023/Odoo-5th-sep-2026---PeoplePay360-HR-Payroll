import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Banknote, CalendarCheck, Receipt, Users } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardApi } from '@/lib/dashboard.api'
import { departmentsApi } from '@/lib/departments.api'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'INTERN', label: 'Intern' },
]

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: '#16a34a',
  LATE: '#f59e0b',
  ABSENT: '#dc2626',
  OVERTIME: '#2563eb',
}

const currency = (n: number) => `₹${n.toLocaleString()}`

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

  const { kpis, byDepartment, timeOff, attendance, warnings } = data

  const kpiCards = [
    { label: 'Active Employees', value: kpis.activeEmployees, icon: Users },
    { label: 'Total Net Pay', value: currency(kpis.totalNet), icon: Banknote },
    { label: 'Payslips (Paid / Pending)', value: `${kpis.paid} / ${kpis.pending}`, icon: Receipt },
    { label: 'Approved Leave Days', value: timeOff.approvedDays, icon: CalendarCheck },
  ]

  const attendanceData = Object.entries(attendance.byStatus)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Live payroll overview across the company.</p>
        <div className="flex gap-2">
          <select
            value={departmentId}
            onChange={(ev) => setDepartmentId(ev.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={employeeType}
            onChange={(ev) => setEmployeeType(ev.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="size-4" /> Attention needed
            </div>
            <ul className="space-y-1 text-sm text-amber-900">
              {warnings.map((w) => (
                <li key={w.type}>- {w.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Salary by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => currency(v as number)} />
                <Bar dataKey="net" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No attendance records.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={attendanceData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {attendanceData.map((d) => (
                      <Cell key={d.name} fill={ATTENDANCE_COLORS[d.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {byDepartment.map((d) => (
              <div key={d.name} className="rounded-md border p-3">
                <div className="text-sm font-medium">{d.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {d.headcount} people · {currency(d.net)} net
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

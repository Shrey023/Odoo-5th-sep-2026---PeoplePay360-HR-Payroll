import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Clock, DollarSign, Plane, Plus } from 'lucide-react'
import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { http } from '@/lib/http'
import type { EmployeeDetail } from '@/lib/employees.api'
import { RequestFormDialog } from './request-form-dialog'

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: '#16a34a',
  LATE: '#f59e0b',
  ABSENT: '#dc2626',
  OVERTIME: '#2563eb',
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PRESENT:  { bg: 'bg-green-100',  text: 'text-green-700' },
  LATE:     { bg: 'bg-amber-100',  text: 'text-amber-700' },
  ABSENT:   { bg: 'bg-red-100',    text: 'text-red-700' },
  OVERTIME: { bg: 'bg-blue-100',   text: 'text-blue-700' },
}

export function MyDashboardPage() {
  const [requestOpen, setRequestOpen] = useState(false)
  const qc = useQueryClient()

  const { data: emp } = useQuery<EmployeeDetail | null>({
    queryKey: ['my-profile'],
    queryFn: () => http<EmployeeDetail | null>('/employees/me'),
  })

  const { data: payslips = [] } = useQuery<any[]>({
    queryKey: ['my-payslips'],
    queryFn: () => http<any[]>('/payruns/payslips/mine'),
  })

  const { data: attendance = [] } = useQuery<any[]>({
    queryKey: ['my-attendance'],
    enabled: !!emp,
    queryFn: () => http<any[]>(`/attendance?employeeId=${emp!.id}`),
  })

  const { data: balances = [] } = useQuery<any[]>({
    queryKey: ['my-balances'],
    enabled: !!emp,
    queryFn: () => http<any[]>(`/time-off/balances/${emp!.id}`),
  })

  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ['my-requests'],
    enabled: !!emp,
    queryFn: () => http<any[]>(`/time-off/requests?employeeId=${emp!.id}`),
  })

  if (!emp) return <p className="text-sm text-muted-foreground">Loading...</p>

  const latestPayslip = payslips[0]
  const totalPaid = payslips.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + Number(p.net), 0)

  const attendanceByStatus: Record<string, number> = {}
  for (const a of attendance) {
    attendanceByStatus[a.status] = (attendanceByStatus[a.status] ?? 0) + 1
  }
  const attendancePie = Object.entries(attendanceByStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const presentPct = attendance.length > 0
    ? Math.round(((attendanceByStatus.PRESENT ?? 0) + (attendanceByStatus.OVERTIME ?? 0)) / attendance.length * 100)
    : 0

  const pendingLeave = requests.filter((r: any) => r.status === 'TO_APPROVE').length
  const approvedLeave = requests.filter((r: any) => r.status === 'APPROVED').reduce((s: number, r: any) => s + Number(r.duration), 0)

  const kpis = [
    {
      label: 'Latest Net Pay',
      value: latestPayslip ? money(Number(latestPayslip.net)) : '-',
      sub: latestPayslip ? latestPayslip.payrun?.name : 'No payslips yet',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Total Earned (YTD)',
      value: money(totalPaid),
      sub: `${payslips.length} payslip(s)`,
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      label: 'Attendance Rate',
      value: `${presentPct}%`,
      sub: `${attendance.length} records logged`,
      icon: Clock,
      color: presentPct >= 90 ? 'text-green-600' : 'text-amber-600',
    },
    {
      label: 'Leave Taken',
      value: `${approvedLeave} days`,
      sub: `${pendingLeave} pending approval`,
      icon: Plane,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome, {emp.name.split(' ')[0]}</h2>
        <p className="text-sm text-muted-foreground">{emp.jobPosition} · {emp.department?.name}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <k.icon className="size-4" />
                <span className="text-xs">{k.label}</span>
              </div>
              <div className={`text-xl font-semibold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Attendance pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">{attendance.length} total records</p>
          </CardHeader>
          <CardContent>
            {attendancePie.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No attendance records.</p>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={attendancePie} dataKey="value" innerRadius={32} outerRadius={54} strokeWidth={2}>
                        {attendancePie.map((d) => (
                          <Cell key={d.name} fill={ATTENDANCE_COLORS[d.name] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Days']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {attendancePie.map((d) => {
                      const total = attendancePie.reduce((s, x) => s + x.value, 0)
                      const pct = Math.round((d.value / total) * 100)
                      return (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full" style={{ background: ATTENDANCE_COLORS[d.name] }} />
                            <span className="text-xs capitalize">{d.name.toLowerCase()}</span>
                          </div>
                          <span className="text-xs font-semibold">{d.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Leave balances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leave Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allocations.</p>
            ) : balances.map((b: any) => {
              const pct = b.allocated > 0 ? Math.round((b.taken / b.allocated) * 100) : 0
              return (
                <div key={b.typeId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{b.typeName}</span>
                    <span className="text-muted-foreground">{b.remaining} / {b.allocated} remaining</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Payslip summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payslip Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Recent months</p>
          </CardHeader>
          <CardContent>
            {payslips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payslips yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Month</TableHead>
                    <TableHead className="text-right text-xs">Net</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.slice(0, 5).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs py-2">{p.payrun?.name}</TableCell>
                      <TableCell className="text-right text-xs py-2 font-medium">{money(Number(p.net))}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={p.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent attendance with colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.slice(0, 8).map((a: any) => {
                  const s = STATUS_BADGE[a.status] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{new Date(a.checkIn).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{a.checkOut ? new Date(a.checkOut).toLocaleString() : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm">{a.workedHours}h</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
                          {a.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Leave Requests</CardTitle>
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="size-4" /> Request Leave
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.type?.name}</TableCell>
                    <TableCell className="text-sm">{r.startDate?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{r.endDate?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{r.duration}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'APPROVED' ? 'default' : r.status === 'REFUSED' ? 'destructive' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <RequestFormDialog
        open={requestOpen}
        fixedEmployeeId={emp?.id}
        onOpenChange={(o) => {
          setRequestOpen(o)
          if (!o) {
            qc.invalidateQueries({ queryKey: ['my-requests'] })
            qc.invalidateQueries({ queryKey: ['my-balances'] })
          }
        }}
      />
    </div>
  )
}

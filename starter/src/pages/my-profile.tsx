import { useQuery } from '@tanstack/react-query'
import { CalendarClock, FileText, Plane, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { http } from '@/lib/http'
import type { EmployeeDetail } from '@/lib/employees.api'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export function MyProfilePage() {
  const { data: emp, isLoading } = useQuery<EmployeeDetail | null>({
    queryKey: ['my-profile'],
    queryFn: () => http<EmployeeDetail | null>('/employees/me'),
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

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!emp) return <p className="text-sm text-muted-foreground">No employee profile linked to your account. Contact HR.</p>

  const smartButtons = [
    { label: 'Contracts', count: emp.counts.contracts, icon: FileText },
    { label: 'Attendance', count: emp.counts.attendances, icon: CalendarClock },
    { label: 'Time Off', count: emp.counts.requests, icon: Plane },
    { label: 'Allocations', count: emp.counts.allocations, icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{emp.name}</h2>
          <p className="text-muted-foreground">{emp.jobPosition}</p>
        </div>
        <Badge variant={emp.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {smartButtons.map((b) => (
          <Card key={b.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <b.icon className="size-5 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold">{b.count}</div>
                <div className="text-xs text-muted-foreground">{b.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Work Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4">Work Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Work Email" value={emp.workEmail} />
            <Field label="Job Position" value={emp.jobPosition ?? '-'} />
            <Field label="Department" value={emp.department?.name ?? '-'} />
            <Field label="Manager" value={emp.manager?.name ?? '-'} />
            <Field label="Working Schedule" value={emp.schedule ? `${emp.schedule.name} (${emp.schedule.weeklyHours}h/wk)` : '-'} />
            <Field label="Employee Type" value={emp.employeeType.replace(/_/g, ' ')} />
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Leave Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((b: any) => (
              <div key={b.typeId} className="rounded-md border p-3">
                <div className="text-sm font-medium">{b.typeName}</div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>Allocated {b.allocated}</span>
                  <span>Taken {b.taken}</span>
                  <span className="font-semibold text-foreground">Remaining {b.remaining} {b.unit?.toLowerCase()}</span>
                </div>
              </div>
            ))}
            {balances.length === 0 && <p className="text-sm text-muted-foreground">No leave types configured.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Time Off Requests */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">My Leave Requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
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
                {requests.slice(0, 10).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.type?.name}</TableCell>
                    <TableCell>{r.startDate?.slice(0, 10)}</TableCell>
                    <TableCell>{r.endDate?.slice(0, 10)}</TableCell>
                    <TableCell>{r.duration}</TableCell>
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

      {/* Recent Attendance */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Recent Attendance</h3>
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records.</p>
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
                {attendance.slice(0, 10).map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.checkIn).toLocaleString()}</TableCell>
                    <TableCell>{a.checkOut ? new Date(a.checkOut).toLocaleString() : '-'}</TableCell>
                    <TableCell>{a.workedHours}</TableCell>
                    <TableCell>
                      {(() => {
                        const c: Record<string,string> = { PRESENT:'bg-green-100 text-green-700', LATE:'bg-amber-100 text-amber-700', ABSENT:'bg-red-100 text-red-700', OVERTIME:'bg-blue-100 text-blue-700' }
                        return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c[a.status] ?? 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

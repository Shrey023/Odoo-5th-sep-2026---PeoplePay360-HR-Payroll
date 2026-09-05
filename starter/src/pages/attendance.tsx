import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { attendanceApi, type AttendanceStatus } from '@/lib/attendance.api'
import { employeesApi } from '@/lib/employees.api'

const statusVariant: Record<AttendanceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PRESENT: 'default',
  LATE: 'outline',
  ABSENT: 'destructive',
  OVERTIME: 'secondary',
}

export function AttendancePage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [newOpen, setNewOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceApi.list(),
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', ''],
    queryFn: () => employeesApi.list(),
  })

  const createMut = useMutation({
    mutationFn: (v: { employeeId: string; checkIn: string; checkOut: string; status: AttendanceStatus }) =>
      attendanceApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance record created')
      setNewOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = records.filter(
    (r) =>
      !search ||
      r.employee.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Attendance</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search attendance…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Worked Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee.name}</TableCell>
                  <TableCell>{new Date(r.checkIn).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.checkOut ? new Date(r.checkOut).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>{r.workedHours}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status as AttendanceStatus]}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <NewAttendanceDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        employees={employees}
        onSubmit={(v) => createMut.mutate(v)}
        isPending={createMut.isPending}
      />
    </div>
  )
}

function NewAttendanceDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  employees: { id: string; name: string }[]
  onSubmit: (v: { employeeId: string; checkIn: string; checkOut: string; status: AttendanceStatus }) => void
  isPending: boolean
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ employeeId, checkIn, checkOut, status })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Attendance Record</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Employee</Label>
            <select
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check In</Label>
              <Input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Check Out</Label>
              <Input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            >
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="OVERTIME">Overtime</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { attendanceApi, type Attendance, type AttendanceStatus } from '@/lib/attendance.api'
import { employeesApi } from '@/lib/employees.api'

const statusVariant: Record<AttendanceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PRESENT: 'default',
  LATE: 'outline',
  ABSENT: 'destructive',
  OVERTIME: 'secondary',
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AttendancePage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [newOpen, setNewOpen] = useState(false)
  const [editing, setEditing] = useState<Attendance | null>(null)
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

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { checkIn?: string; checkOut?: string | null; status?: AttendanceStatus } }) =>
      attendanceApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance updated')
      setEditing(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = records.filter(
    (r) => !search || r.employee.name.toLowerCase().includes(search.toLowerCase()),
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

      <Input
        placeholder="Search attendance…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

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
                <TableHead>Overtime</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link to={`/employees/${r.employee.id}`} className="hover:underline text-primary">{r.employee.name}</Link>
                  </TableCell>
                  <TableCell>{new Date(r.checkIn).toLocaleString()}</TableCell>
                  <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleString() : '-'}</TableCell>
                  <TableCell>{r.workedHours}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {Number(r.workedHours) > 8 ? `${(Number(r.workedHours) - 8).toFixed(2)} hrs` : '0.00'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status as AttendanceStatus]}>{r.status}</Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AttendanceDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        employees={employees}
        onSubmit={(v) => createMut.mutate(v)}
        isPending={createMut.isPending}
      />

      {editing && (
        <EditAttendanceDialog
          record={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMut.mutate({ id: editing.id, data })}
          isPending={updateMut.isPending}
        />
      )}
    </div>
  )
}

function AttendanceDialog({
  open, onOpenChange, employees, onSubmit, isPending,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Attendance Record</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ employeeId, checkIn, checkOut, status }) }}>
          <div className="space-y-2">
            <Label>Employee</Label>
            <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Select employee…</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check In</Label>
              <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Check Out</Label>
              <Input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="OVERTIME">Overtime</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditAttendanceDialog({
  record, onClose, onSubmit, isPending,
}: {
  record: Attendance
  onClose: () => void
  onSubmit: (data: { checkIn?: string; checkOut?: string | null; status?: AttendanceStatus }) => void
  isPending: boolean
}) {
  const [checkIn, setCheckIn] = useState(toLocalDatetime(record.checkIn))
  const [checkOut, setCheckOut] = useState(record.checkOut ? toLocalDatetime(record.checkOut) : '')
  const [status, setStatus] = useState<AttendanceStatus>(record.status as AttendanceStatus)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Attendance — {record.employee.name}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ checkIn, checkOut: checkOut || null, status }) }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check In</Label>
              <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Check Out</Label>
              <Input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="OVERTIME">Overtime</option>
            </select>
          </div>
          <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
            System-generated from check in/out or manually corrected by an authorized user.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

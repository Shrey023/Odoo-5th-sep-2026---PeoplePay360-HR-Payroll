import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarClock, FileText, Pencil, Plane, Plus, Receipt, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth, HR_ROLES } from '@/lib/auth'
import { type Contract, contractsApi } from '@/lib/contracts.api'
import { employeesApi } from '@/lib/employees.api'
import { attendanceApi, timeOffApi } from '@/lib/timeoff.api'
import { ContractFormDialog } from './contract-form-dialog'
import { PayslipPreviewDialog } from './payslip-preview-dialog'

const statusVariant: Record<Contract['status'], 'default' | 'secondary' | 'outline'> = {
  RUNNING: 'default',
  DRAFT: 'secondary',
  EXPIRED: 'outline',
}

export function EmployeeDetailPage() {
  const { id = '' } = useParams()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { data: e, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.get(id),
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', id],
    queryFn: () => contractsApi.listForEmployee(id),
  })

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceApi.list(id),
  })

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', id],
    queryFn: () => timeOffApi.balances(id),
  })

  const del = useMutation({
    mutationFn: (contractId: string) => contractsApi.remove(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts', id] })
      qc.invalidateQueries({ queryKey: ['employee', id] })
      toast.success('Contract deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!e) return <p className="text-sm text-muted-foreground">Employee not found.</p>

  const smartButtons = [
    { label: 'Contracts', count: e.counts.contracts, icon: FileText },
    { label: 'Attendance', count: e.counts.attendances, icon: CalendarClock },
    { label: 'Time Off', count: e.counts.requests, icon: Plane },
    { label: 'Allocations', count: e.counts.allocations, icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/employees">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{e.name}</h2>
          <p className="text-muted-foreground">{e.jobPosition}</p>
        </div>
        <Badge variant={e.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {e.status === 'ACTIVE' ? 'Active' : 'Inactive'}
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

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field label="Work Email" value={e.workEmail} />
          <Field label="Department" value={e.department?.name ?? '-'} />
          <Field label="Company" value={e.company?.name ?? '-'} />
          <Field label="Manager" value={e.manager?.name ?? '-'} />
          <Field label="Employee Type" value={e.employeeType.replace('_', ' ')} />
          <Field
            label="Working Schedule"
            value={e.schedule ? `${e.schedule.name} (${e.schedule.weeklyHours}h/wk)` : '-'}
          />
          <Field label="Bank Account" value={e.bankAccount ?? 'Not set'} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Contracts</h3>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-4" /> New
              </Button>
            )}
          </div>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contracts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Wage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.reference}</TableCell>
                    <TableCell>
                      {c.startDate.slice(0, 10)} - {c.endDate?.slice(0, 10) ?? 'Open'}
                    </TableCell>
                    <TableCell>{Number(c.wage).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Preview payslip"
                          onClick={() => setPreviewId(c.id)}
                        >
                          <Receipt className="size-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(c)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => del.mutate(c.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Leave Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((b) => (
              <div key={b.typeId} className="rounded-md border p-3">
                <div className="text-sm font-medium">{b.typeName}</div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>Allocated {b.allocated}</span>
                  <span>Taken {b.taken}</span>
                  <span className="font-semibold text-foreground">
                    Remaining {b.remaining} {b.unit.toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
            {balances.length === 0 && (
              <p className="text-sm text-muted-foreground">No leave types configured.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Attendance</h3>
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
                {attendance.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.checkIn).toLocaleString()}</TableCell>
                    <TableCell>
                      {a.checkOut ? new Date(a.checkOut).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{a.workedHours}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContractFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employeeId={id}
        contract={editing}
      />
      <PayslipPreviewDialog
        open={Boolean(previewId)}
        onOpenChange={(o) => !o && setPreviewId(null)}
        contractId={previewId}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

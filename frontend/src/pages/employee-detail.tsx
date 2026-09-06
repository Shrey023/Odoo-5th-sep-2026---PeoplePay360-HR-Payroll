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
import { timeOffApi } from '@/lib/timeoff.api'
import { attendanceApi } from '@/lib/attendance.api'
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

  const { data: requests = [] } = useQuery({
    queryKey: ['time-off-requests', id],
    queryFn: () => timeOffApi.listRequests(id),
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
    { label: 'Contracts', count: e.counts.contracts, icon: FileText, anchor: 'contracts' },
    { label: 'Attendance', count: e.counts.attendances, icon: CalendarClock, anchor: 'attendance' },
    { label: 'Time Off', count: e.counts.requests, icon: Plane, anchor: 'leave-balances' },
    { label: 'Allocations', count: e.counts.allocations, icon: Wallet, anchor: 'leave-balances' },
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
          <Card
            key={b.label}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => document.getElementById(b.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
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

      <EmployeeTabs e={e} />

      <Card id="contracts">
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
          <h3 id="leave-balances" className="mb-3 text-sm font-semibold">Leave Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((b) => {
              const approvedRequests = requests.filter(
                (r) => r.type.id === b.typeId && r.status === 'APPROVED' && r.type.requiresAllocation
              )
              return (
                <div key={b.typeId} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{b.typeName}</div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span>Allocated {b.allocated}</span>
                    <span>Taken {b.taken}</span>
                    <span className="font-semibold text-foreground">
                      Remaining {b.remaining} {b.unit.toLowerCase()}
                    </span>
                  </div>
                  {approvedRequests.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {approvedRequests.slice(0, 3).map((r) => (
                        <div key={r.id} className="text-xs text-muted-foreground">
                          • Consumed {r.duration} {r.type.unit.toLowerCase()} on{' '}
                          {r.startDate.slice(0, 10)}
                        </div>
                      ))}
                      {approvedRequests.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          + {approvedRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {balances.length === 0 && (
              <p className="text-sm text-muted-foreground">No leave types configured.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 id="attendance" className="mb-3 text-sm font-semibold">Attendance</h3>
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

import type { EmployeeDetail } from '@/lib/employees.api'

type EmployeeTabKey = 'work' | 'private' | 'hr'

function EmployeeTabs({ e }: { e: EmployeeDetail }) {
  const [tab, setTab] = useState<EmployeeTabKey>('work')
  const tabs: { key: EmployeeTabKey; label: string }[] = [
    { key: 'work', label: 'Work Information' },
    { key: 'private', label: 'Private Information' },
    { key: 'hr', label: 'HR Settings' },
  ]
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex border-b px-4 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {tab === 'work' && (
            <>
              <Field label="Work Email" value={e.workEmail} />
              <Field label="Job Position" value={e.jobPosition ?? '-'} />
              <Field label="Department" value={e.department?.name ?? '-'} />
              <Field label="Manager" value={e.manager?.name ?? '-'} />
              <Field label="Working Schedule" value={e.schedule ? `${e.schedule.name} (${e.schedule.weeklyHours}h/wk)` : '-'} />
              <Field label="Company" value={e.company?.name ?? '-'} />
            </>
          )}
          {tab === 'private' && (
            <>
              <Field label="Bank Account" value={e.bankAccount ?? 'Not set'} />
              <Field label="Employee Type" value={e.employeeType.replace(/_/g, ' ')} />
            </>
          )}
          {tab === 'hr' && (
            <>
              <Field label="Status" value={e.status} />
              <Field label="Employee Type" value={e.employeeType.replace(/_/g, ' ')} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
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

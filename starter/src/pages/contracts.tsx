import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { contractsApi, type ContractStatus } from '@/lib/contracts.api'
import { employeesApi } from '@/lib/employees.api'
import { ContractFormDialog } from './contract-form-dialog'

const statusVariant: Record<ContractStatus, 'default' | 'secondary' | 'destructive'> = {
  RUNNING: 'default',
  DRAFT: 'secondary',
  EXPIRED: 'destructive',
}

export function ContractsPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState('')

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => contractsApi.listAll(),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', ''],
    queryFn: () => employeesApi.list(),
    enabled: canEdit,
  })

  const filtered = contracts.filter(
    (c) =>
      !search ||
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      (c.employee as any)?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Contracts</h2>
        {canEdit && (
          <Button size="sm" onClick={() => { setSelectedEmpId(''); setDialogOpen(true) }}>
            <Plus className="size-4" /> New Contract
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search contracts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {canEdit && (
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value)
              if (e.target.value) setDialogOpen(true)
            }}
          >
            <option value="">Quick: pick employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Wage / Month</TableHead>
                <TableHead>Working Schedule</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link to={`/employees/${(c as any).employeeId}`} className="hover:underline">
                      {c.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{(c as any).employee?.name ?? '-'}</TableCell>
                  <TableCell>{c.startDate.slice(0, 10)}</TableCell>
                  <TableCell>{c.endDate ? c.endDate.slice(0, 10) : '-'}</TableCell>
                  <TableCell>₹{Number(c.wage).toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.schedule?.name ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ContractFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedEmpId('') }}
        employeeId={selectedEmpId}
        contract={null}
      />
    </div>
  )
}

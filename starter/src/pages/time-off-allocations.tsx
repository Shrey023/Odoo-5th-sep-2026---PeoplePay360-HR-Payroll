import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { type AllocationStatus, timeOffApi } from '@/lib/timeoff.api'
import { AllocationFormDialog } from './allocation-form-dialog'

const allocVariant: Record<AllocationStatus, 'default' | 'secondary' | 'destructive'> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  REFUSED: 'destructive',
}

export function TimeOffAllocationsPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [allocOpen, setAllocOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => timeOffApi.listAllocations(),
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: () => timeOffApi.listRequests(),
  })

  const decideAlloc = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AllocationStatus }) =>
      timeOffApi.decideAllocation(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
      toast.success('Allocation updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function getTaken(employeeId: string, typeId: string) {
    return requests
      .filter(
        (r) =>
          r.employee.id === employeeId &&
          r.type.id === typeId &&
          r.status === 'APPROVED' &&
          r.type.requiresAllocation,
      )
      .reduce((sum, r) => sum + Number(r.duration), 0)
  }

  const filtered = allocations.filter(
    (a) => !search || a.employee.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Allocations</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setAllocOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      <Input
        placeholder="Search allocations…"
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
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Taken</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const allocated = Number(a.amount)
                const taken = a.status === 'APPROVED' ? getTaken(a.employee.id, a.type.id) : 0
                const remaining = Math.max(0, allocated - taken)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.employee.name}</TableCell>
                    <TableCell>{a.type.name}</TableCell>
                    <TableCell className="text-right">
                      {allocated} {a.type.unit.toLowerCase()}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === 'APPROVED' ? `${taken} ${a.type.unit.toLowerCase()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {a.status === 'APPROVED' ? `${remaining} ${a.type.unit.toLowerCase()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {a.validFrom.slice(0, 10)} — {a.validTo.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={allocVariant[a.status]}>{a.status}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {a.status === 'DRAFT' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => decideAlloc.mutate({ id: a.id, status: 'APPROVED' })}
                            >
                              <Check className="size-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => decideAlloc.mutate({ id: a.id, status: 'REFUSED' })}
                            >
                              <X className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-muted-foreground">
                    No allocations yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AllocationFormDialog open={allocOpen} onOpenChange={setAllocOpen} />
    </div>
  )
}

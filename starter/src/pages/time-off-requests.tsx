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
import { type RequestStatus, timeOffApi } from '@/lib/timeoff.api'
import { RequestFormDialog } from './request-form-dialog'

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  TO_APPROVE: 'outline',
  APPROVED: 'default',
  REFUSED: 'destructive',
}

export function TimeOffRequestsPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [reqOpen, setReqOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: () => timeOffApi.listRequests(),
  })

  const decideReq = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      timeOffApi.decideRequest(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-off-requests'] })
      toast.success('Request updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = requests.filter(
    (r) => !search || r.employee.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Time Off Requests</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setReqOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      <Input
        placeholder="Search requests…"
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
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span>{r.type.name}</span>
                      {r.status === 'APPROVED' && r.type.requiresAllocation && (
                        <span className="text-xs text-muted-foreground">
                          Balance consumed: {r.duration} {r.type.unit.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{r.startDate.slice(0, 10)}</TableCell>
                  <TableCell>{r.endDate.slice(0, 10)}</TableCell>
                  <TableCell>
                    {r.duration} {r.type.unit.toLowerCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]}>{r.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      {r.status === 'TO_APPROVE' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => decideReq.mutate({ id: r.id, status: 'APPROVED' })}
                          >
                            <Check className="size-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => decideReq.mutate({ id: r.id, status: 'REFUSED' })}
                          >
                            <X className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <RequestFormDialog open={reqOpen} onOpenChange={setReqOpen} />
    </div>
  )
}

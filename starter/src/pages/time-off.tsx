import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
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
import { HR_ROLES, useAuth } from '@/lib/auth'
import {
  type AllocationStatus,
  type RequestStatus,
  timeOffApi,
} from '@/lib/timeoff.api'
import { AllocationFormDialog } from './allocation-form-dialog'
import { RequestFormDialog } from './request-form-dialog'
import { TimeOffTypeDialog } from './time-off-type-dialog'

type Tab = 'requests' | 'allocations' | 'types'

const requestVariant: Record<RequestStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  TO_APPROVE: 'outline',
  APPROVED: 'default',
  REFUSED: 'destructive',
}
const allocVariant: Record<AllocationStatus, 'default' | 'secondary' | 'destructive'> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  REFUSED: 'destructive',
}

export function TimeOffPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('requests')
  const [reqOpen, setReqOpen] = useState(false)
  const [allocOpen, setAllocOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)

  const { data: requests = [] } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: () => timeOffApi.listRequests(),
  })
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => timeOffApi.listAllocations(),
  })
  const { data: types = [] } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffApi.listTypes(),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['time-off-requests'] })
    qc.invalidateQueries({ queryKey: ['allocations'] })
  }

  const decideReq = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      timeOffApi.decideRequest(id, status),
    onSuccess: () => {
      invalidate()
      toast.success('Request updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const decideAlloc = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AllocationStatus }) =>
      timeOffApi.decideAllocation(id, status),
    onSuccess: () => {
      invalidate()
      toast.success('Allocation updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'requests', label: 'Requests' },
    { key: 'allocations', label: 'Allocations' },
    { key: 'types', label: 'Types' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-md border p-1">
          {tabs.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? 'default' : 'ghost'}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              if (tab === 'requests') setReqOpen(true)
              else if (tab === 'allocations') setAllocOpen(true)
              else setTypeOpen(true)
            }}
          >
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {tab === 'requests' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee.name}</TableCell>
                    <TableCell>{r.type.name}</TableCell>
                    <TableCell>
                      {r.startDate.slice(0, 10)} - {r.endDate.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {r.duration} {r.type.unit.toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={requestVariant[r.status]}>{r.status}</Badge>
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
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      No requests yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === 'allocations' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.employee.name}</TableCell>
                    <TableCell>{a.type.name}</TableCell>
                    <TableCell>
                      {a.amount} {a.type.unit.toLowerCase()}
                    </TableCell>
                    <TableCell>
                      {a.validFrom.slice(0, 10)} - {a.validTo.slice(0, 10)}
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
                ))}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      No allocations yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === 'types' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Needs Allocation</TableHead>
                  <TableHead>Needs Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.unit}</TableCell>
                    <TableCell>{t.requiresAllocation ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{t.approvalRequired ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RequestFormDialog open={reqOpen} onOpenChange={setReqOpen} />
      <AllocationFormDialog open={allocOpen} onOpenChange={setAllocOpen} />
      <TimeOffTypeDialog open={typeOpen} onOpenChange={setTypeOpen} />
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { type RequestStatus, timeOffApi } from '@/lib/timeoff.api'

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  TO_APPROVE: 'outline',
  APPROVED: 'default',
  REFUSED: 'destructive',
}

export function TimeOffRequestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()

  const { data: request, isLoading } = useQuery({
    queryKey: ['time-off-request', id],
    queryFn: () => timeOffApi.getRequest(id),
    enabled: Boolean(id),
  })

  const decide = useMutation({
    mutationFn: (status: RequestStatus) => timeOffApi.decideRequest(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['time-off-request', id] })
      qc.invalidateQueries({ queryKey: ['time-off-requests'] })
      toast.success(`Request ${updated.status.toLowerCase().replace('_', ' ')}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!request) return <p className="text-sm text-muted-foreground">Request not found.</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Time Off Request / {request.employee.name}
          </h2>
          <p className="text-sm text-muted-foreground">{request.type.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[request.status]}>
            {request.status.replace('_', ' ')}
          </Badge>
          {canEdit && request.status === 'TO_APPROVE' && (
            <>
              <Button
                size="sm"
                onClick={() => decide.mutate('APPROVED')}
                disabled={decide.isPending}
              >
                <Check className="size-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => decide.mutate('REFUSED')}
                disabled={decide.isPending}
              >
                <X className="size-4" /> Refuse
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 p-6">
          <Field label="Employee">
            <Link to={`/employees/${request.employee.id}`} className="font-medium hover:underline text-primary">
              {request.employee.name}
            </Link>
          </Field>
          <Field label="Leave Type">
            <span className="font-medium">{request.type.name}</span>
          </Field>
          <Field label="Start Date">
            <span className="font-medium">{request.startDate.slice(0, 10)}</span>
          </Field>
          <Field label="End Date">
            <span className="font-medium">{request.endDate.slice(0, 10)}</span>
          </Field>
          <Field label="Duration">
            <span className="font-medium">{request.duration} {request.type.unit.toLowerCase()}</span>
          </Field>
          <Field label="Status">
            <Badge variant={statusVariant[request.status]}>{request.status.replace('_', ' ')}</Badge>
          </Field>
          {request.type.requiresAllocation && (
            <Field label="Allocation Used">
              <span className="font-medium text-sm">
                {request.status === 'APPROVED'
                  ? `${request.duration} ${request.type.unit.toLowerCase()} from ${request.type.name} balance`
                  : 'Pending approval'}
              </span>
            </Field>
          )}
          {(request as any).reason && (
            <Field label="Reason">
              <span className="font-medium">{(request as any).reason}</span>
            </Field>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { employeesApi } from '@/lib/employees.api'
import { timeOffApi } from '@/lib/timeoff.api'

const schema = z
  .object({
    employeeId: z.string().uuid('Pick an employee'),
    typeId: z.string().uuid('Pick a type'),
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().min(1, 'End date required'),
    duration: z.number().positive('Duration must be greater than 0'),
    reason: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End must be on or after start',
    path: ['endDate'],
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fixedEmployeeId?: string
}

export function RequestFormDialog({ open, onOpenChange, fixedEmployeeId }: Props) {
  const qc = useQueryClient()
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', ''],
    queryFn: () => employeesApi.list(),
    enabled: !fixedEmployeeId,
  })
  const { data: types = [] } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffApi.listTypes(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: fixedEmployeeId ? { employeeId: fixedEmployeeId } : undefined,
  })

  const save = useMutation({
    mutationFn: (v: FormValues) => timeOffApi.createRequest({
      ...v,
      employeeId: fixedEmployeeId ?? v.employeeId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-off-requests'] })
      toast.success('Request created')
      reset()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New time off request</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          {!fixedEmployeeId && (
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee</Label>
              <select
                id="employeeId"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('employeeId')}
              >
                <option value="">Select...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="text-xs text-destructive">{errors.employeeId.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="typeId">Type</Label>
            <select
              id="typeId"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register('typeId')}
            >
              <option value="">Select...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.typeId && <p className="text-xs text-destructive">{errors.typeId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input id="duration" type="number" step="0.5" {...register('duration', { valueAsNumber: true })} />
            {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" placeholder="e.g. Family vacation" {...register('reason')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

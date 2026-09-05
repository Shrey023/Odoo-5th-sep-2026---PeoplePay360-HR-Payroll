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
    amount: z.number().positive('Amount must be greater than 0'),
    validFrom: z.string().min(1, 'Valid-from required'),
    validTo: z.string().min(1, 'Valid-to required'),
  })
  .refine((v) => v.validTo >= v.validFrom, {
    message: 'Valid-to must be on or after valid-from',
    path: ['validTo'],
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AllocationFormDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', ''],
    queryFn: () => employeesApi.list(),
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const save = useMutation({
    mutationFn: (v: FormValues) => timeOffApi.createAllocation(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
      toast.success('Allocation created')
      reset()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New allocation</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee</Label>
            <select
              id="employeeId"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register('employeeId')}
            >
              <option value="">Select...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {errors.employeeId && (
              <p className="text-xs text-destructive">{errors.employeeId.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.5" {...register('amount', { valueAsNumber: true })} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" type="date" {...register('validFrom')} />
              {errors.validFrom && (
                <p className="text-xs text-destructive">{errors.validFrom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTo">Valid To</Label>
              <Input id="validTo" type="date" {...register('validTo')} />
              {errors.validTo && <p className="text-xs text-destructive">{errors.validTo.message}</p>}
            </div>
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

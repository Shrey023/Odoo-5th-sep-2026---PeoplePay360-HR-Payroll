import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
import { type Contract, type ContractInput, contractsApi } from '@/lib/contracts.api'
import { http } from '@/lib/http'

const schema = z
  .object({
    jobPosition: z.string().optional(),
    employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    wage: z.coerce.number().positive('Wage must be greater than 0'),
    status: z.enum(['DRAFT', 'RUNNING', 'EXPIRED']),
    departmentId: z.string().optional(),
  })
  .refine((c) => !c.endDate || c.endDate >= c.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  contract: Contract | null
}

const empty: FormValues = {
  jobPosition: '',
  employeeType: 'FULL_TIME',
  startDate: '',
  endDate: '',
  wage: 0,
  status: 'DRAFT',
  departmentId: '',
}

export function ContractFormDialog({ open, onOpenChange, employeeId, contract }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(contract)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => http<{ id: string; name: string }[]>('/departments'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(
        contract
          ? {
              jobPosition: contract.jobPosition ?? '',
              employeeType: contract.employeeType,
              startDate: contract.startDate.slice(0, 10),
              endDate: contract.endDate?.slice(0, 10) ?? '',
              wage: Number(contract.wage),
              status: contract.status,
              departmentId: contract.department?.id ?? '',
            }
          : empty,
      )
    }
  }, [open, contract, reset])

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ContractInput = {
        employeeId,
        jobPosition: values.jobPosition || null,
        employeeType: values.employeeType,
        startDate: values.startDate,
        endDate: values.endDate || null,
        wage: values.wage,
        status: values.status,
        departmentId: values.departmentId || null,
      }
      return isEdit ? contractsApi.update(contract!.id, payload) : contractsApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts', employeeId] })
      qc.invalidateQueries({ queryKey: ['employee', employeeId] })
      toast.success(isEdit ? 'Contract updated' : 'Contract created')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit contract' : 'New contract'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobPosition">Job Position</Label>
              <Input id="jobPosition" {...register('jobPosition')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wage">Monthly Wage</Label>
              <Input id="wage" type="number" step="0.01" {...register('wage')} />
              {errors.wage && <p className="text-xs text-destructive">{errors.wage.message}</p>}
            </div>
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
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeType">Employee Type</Label>
              <select
                id="employeeType"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('employeeType')}
              >
                <option value="FULL_TIME">Full time</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('status')}
              >
                <option value="DRAFT">Draft</option>
                <option value="RUNNING">Running</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentId">Department</Label>
            <select
              id="departmentId"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register('departmentId')}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

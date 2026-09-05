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
import { type Employee, type EmployeeInput, employeesApi } from '@/lib/employees.api'
import { http } from '@/lib/http'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  workEmail: z.string().email('Valid email required'),
  jobPosition: z.string().min(1, 'Job position is required'),
  employeeType: z.enum(['FULL_TIME', 'CONTRACTOR', 'INTERN']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  bankAccount: z.string().optional(),
  departmentId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

const empty: FormValues = {
  name: '',
  workEmail: '',
  jobPosition: '',
  employeeType: 'FULL_TIME',
  status: 'ACTIVE',
  bankAccount: '',
  departmentId: '',
}

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(employee)

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
        employee
          ? {
              name: employee.name,
              workEmail: employee.workEmail,
              jobPosition: employee.jobPosition,
              employeeType: employee.employeeType,
              status: employee.status,
              bankAccount: employee.bankAccount ?? '',
              departmentId: employee.department?.id ?? '',
            }
          : empty,
      )
    }
  }, [open, employee, reset])

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: EmployeeInput = {
        ...values,
        bankAccount: values.bankAccount || null,
        departmentId: values.departmentId || null,
      }
      return isEdit ? employeesApi.update(employee!.id, payload) : employeesApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success(isEdit ? 'Employee updated' : 'Employee created')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit employee' : 'New employee'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workEmail">Work Email</Label>
              <Input id="workEmail" type="email" {...register('workEmail')} />
              {errors.workEmail && (
                <p className="text-xs text-destructive">{errors.workEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobPosition">Job Position</Label>
              <Input id="jobPosition" {...register('jobPosition')} />
              {errors.jobPosition && (
                <p className="text-xs text-destructive">{errors.jobPosition.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input id="bankAccount" {...register('bankAccount')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
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

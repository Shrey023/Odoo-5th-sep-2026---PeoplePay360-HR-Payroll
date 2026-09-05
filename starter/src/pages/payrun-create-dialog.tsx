import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
import { payrunsApi } from '@/lib/payruns.api'
import { salaryApi } from '@/lib/salary.api'

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    structureId: z.string().uuid('Pick a salary structure'),
    employeeType: z.string().optional(),
    periodStart: z.string().min(1, 'Start date is required'),
    periodEnd: z.string().min(1, 'End date is required'),
  })
  .refine((v) => v.periodEnd >= v.periodStart, {
    message: 'End must be on or after start',
    path: ['periodEnd'],
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayrunCreateDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryApi.listStructures(),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'ACTIVE'],
    queryFn: () => employeesApi.list({ status: 'ACTIVE' }),
  })

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function close() {
    onOpenChange(false)
    setStep(1)
    setSelected(new Set())
    reset()
  }

  const create = useMutation({
    mutationFn: (v: FormValues) =>
      payrunsApi.create({
        name: v.name,
        structureId: v.structureId,
        employeeType: v.employeeType || null,
        employeeIds: [...selected],
        periodStart: v.periodStart,
        periodEnd: v.periodEnd,
      }),
    onSuccess: (payrun) => {
      qc.invalidateQueries({ queryKey: ['payruns'] })
      toast.success('Payrun created')
      close()
      navigate(`/payruns/${payrun.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const v = getValues()
  const structureName = structures.find((s) => s.id === v.structureId)?.name
  const inScope = employees.filter((e) => !v.employeeType || e.employeeType === v.employeeType)

  async function next() {
    const okStep = await trigger(['name', 'structureId', 'periodStart', 'periodEnd'])
    if (!okStep) return
    const type = getValues('employeeType')
    const scoped = employees.filter((e) => !type || e.employeeType === type)
    setSelected(new Set(scoped.map((e) => e.id)))
    setStep(2)
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(id)) nextSet.delete(id)
      else nextSet.add(id)
      return nextSet
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New payrun - step {step} of 2</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => create.mutate(values))} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="June 2026 Payroll" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="structureId">Salary Structure</Label>
                <select
                  id="structureId"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  {...register('structureId')}
                >
                  <option value="">Select...</option>
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.structureId && (
                  <p className="text-xs text-destructive">{errors.structureId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeType">Employee Type (optional)</Label>
                <select
                  id="employeeType"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  {...register('employeeType')}
                >
                  <option value="">All types</option>
                  <option value="FULL_TIME">Full time</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input id="periodStart" type="date" {...register('periodStart')} />
                  {errors.periodStart && (
                    <p className="text-xs text-destructive">{errors.periodStart.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input id="periodEnd" type="date" {...register('periodEnd')} />
                  {errors.periodEnd && (
                    <p className="text-xs text-destructive">{errors.periodEnd.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <Review label="Name" value={v.name} />
                <Review label="Structure" value={structureName ?? '-'} />
                <Review label="Employee Type" value={v.employeeType || 'All types'} />
                <Review label="Period" value={`${v.periodStart} to ${v.periodEnd}`} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Employees ({selected.size} selected)</Label>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setSelected(new Set(inScope.map((e) => e.id)))}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:underline"
                      onClick={() => setSelected(new Set())}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-56 space-y-1 overflow-auto rounded-md border p-2">
                  {inScope.length === 0 ? (
                    <p className="p-2 text-xs text-muted-foreground">
                      No active employees for this type.
                    </p>
                  ) : (
                    inScope.map((e) => (
                      <label
                        key={e.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(e.id)}
                          onChange={() => toggle(e.id)}
                        />
                        <span className="flex-1">{e.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {e.employeeType.replace('_', ' ').toLowerCase()}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  Only the selected employees get a payslip, computed from their running contract.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="button" onClick={next}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={create.isPending || selected.size === 0}>
                  Create payrun
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { type RuleInput, type SalaryRule, salaryApi } from '@/lib/salary.api'

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1).regex(/^[A-Z_]+$/, 'Uppercase letters/underscores only'),
    category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']),
    sequence: z.number().int().nonnegative(),
    computeType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
    amount: z.string().optional(),
    percent: z.string().optional(),
    percentBase: z.enum(['CONTRACT_WAGE', 'BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION']).optional(),
    expression: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.computeType === 'FIXED' && !v.amount)
      ctx.addIssue({ code: 'custom', message: 'Amount required', path: ['amount'] })
    if (v.computeType === 'PERCENTAGE' && !v.percent)
      ctx.addIssue({ code: 'custom', message: 'Percent required', path: ['percent'] })
    if (v.computeType === 'FORMULA' && !v.expression)
      ctx.addIssue({ code: 'custom', message: 'Expression required', path: ['expression'] })
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  structureId: string
  rule: SalaryRule | null
}

const empty: FormValues = {
  name: '',
  code: '',
  category: 'ALLOWANCE',
  sequence: 0,
  computeType: 'FIXED',
  amount: '',
  percent: '',
  percentBase: 'BASIC',
  expression: '',
}

export function RuleFormDialog({ open, onOpenChange, structureId, rule }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(rule)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty })

  const computeType = watch('computeType')

  useEffect(() => {
    if (open) {
      reset(
        rule
          ? {
              name: rule.name,
              code: rule.code,
              category: rule.category,
              sequence: rule.sequence,
              computeType: rule.computeType,
              amount: rule.amount ?? '',
              percent: rule.percent ?? '',
              percentBase: rule.percentBase ?? 'BASIC',
              expression: rule.expression ?? '',
            }
          : empty,
      )
    }
  }, [open, rule, reset])

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: RuleInput = {
        name: v.name,
        code: v.code,
        category: v.category,
        sequence: v.sequence,
        computeType: v.computeType,
        amount: v.computeType === 'FIXED' ? Number(v.amount) : null,
        percent: v.computeType === 'PERCENTAGE' ? Number(v.percent) : null,
        percentBase: v.computeType === 'PERCENTAGE' ? v.percentBase : null,
        expression: v.computeType === 'FORMULA' ? v.expression : null,
      }
      return isEdit ? salaryApi.updateRule(rule!.id, payload) : salaryApi.addRule(structureId, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structure', structureId] })
      toast.success(isEdit ? 'Rule updated' : 'Rule added')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit rule' : 'Add rule'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="HRA" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sequence">Sequence</Label>
              <Input id="sequence" type="number" {...register('sequence', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('category')}
              >
                <option value="BASIC">Basic</option>
                <option value="ALLOWANCE">Allowance</option>
                <option value="GROSS">Gross</option>
                <option value="DEDUCTION">Deduction</option>
                <option value="NET">Net</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="computeType">Compute Type</Label>
              <select
                id="computeType"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('computeType')}
              >
                <option value="FIXED">Fixed</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FORMULA">Formula</option>
              </select>
            </div>
          </div>

          {computeType === 'FIXED' && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          )}

          {computeType === 'PERCENTAGE' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percent">Percent</Label>
                <Input id="percent" type="number" step="0.001" {...register('percent')} />
                {errors.percent && (
                  <p className="text-xs text-destructive">{errors.percent.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentBase">Base</Label>
                <select
                  id="percentBase"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  {...register('percentBase')}
                >
                  <option value="CONTRACT_WAGE">Contract Wage</option>
                  <option value="BASIC">Basic</option>
                  <option value="ALLOWANCE">Allowance</option>
                  <option value="GROSS">Gross</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
              </div>
            </div>
          )}

          {computeType === 'FORMULA' && (
            <div className="space-y-2">
              <Label htmlFor="expression">Expression</Label>
              <Input
                id="expression"
                placeholder="categories['GROSS'] - categories['DEDUCTION']"
                {...register('expression')}
              />
              {errors.expression && (
                <p className="text-xs text-destructive">{errors.expression.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

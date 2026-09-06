import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { timeOffApi } from '@/lib/timeoff.api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.enum(['DAYS', 'HOURS']),
  requiresAllocation: z.boolean(),
  approvalRequired: z.boolean(),
  approvalType: z.enum(['none', 'manager', 'officer']),
  color: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TimeOffTypeDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'DAYS', requiresAllocation: true, approvalRequired: true, approvalType: 'manager', color: '#1971c2' },
  })

  const save = useMutation({
    mutationFn: (v: FormValues) => timeOffApi.createType({
      ...v,
      approvalRequired: v.approvalType !== 'none',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-off-types'] })
      toast.success('Type created')
      reset()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New time off type</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Sick Leave" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <select
              id="unit"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register('unit')}
            >
              <option value="DAYS">Days</option>
              <option value="HOURS">Hours</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approvalType">Approval</Label>
            <select
              id="approvalType"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register('approvalType')}
              onChange={(e) => {
                const val = e.target.value
                // keep approvalRequired in sync
              }}
            >
              <option value="none">No Approval</option>
              <option value="manager">Manager</option>
              <option value="officer">Officer</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('requiresAllocation')} />
            Requires Allocation
          </label>
          <div className="space-y-2">
            <Label htmlFor="color">Display Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" id="color" className="h-9 w-16 rounded-md border cursor-pointer" {...register('color')} />
              <span className="text-xs text-muted-foreground">Pick a color for this leave type</span>
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

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
import { api, CATEGORY_OPTIONS, type Item, type ItemInput } from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Pick a category'),
  status: z.enum(['active', 'inactive']),
  quantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
})
type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
}

export function ItemFormDialog({ open, onOpenChange, item }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(item)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: '', status: 'active', quantity: 0 },
  })

  useEffect(() => {
    if (open) {
      reset(
        item
          ? { name: item.name, category: item.category, status: item.status, quantity: item.quantity }
          : { name: '', category: '', status: 'active', quantity: 0 },
      )
    }
  }, [open, item, reset])

  const save = useMutation({
    mutationFn: (values: ItemInput) =>
      isEdit ? api.update(item!.id, values) : api.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      toast.success(isEdit ? 'Item updated' : 'Item created')
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit item' : 'New item'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
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
                <option value="">Select...</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" {...register('quantity')} />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
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

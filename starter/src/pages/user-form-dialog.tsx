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
import type { Role } from '@/lib/auth'
import { type CreateUserInput, usersApi } from '@/lib/users.api'

const allRoles: { value: Role; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HR_PAYROLL_USER', label: 'HR Payroll User' },
  { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager' },
  { value: 'ADMIN', label: 'Admin' },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const empty: FormValues = {
  name: '',
  email: '',
  password: '',
  roles: ['EMPLOYEE'],
}

export function UserFormDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty })

  const selectedRoles = watch('roles')

  useEffect(() => {
    if (open) {
      reset(empty)
    }
  }, [open, reset])

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateUserInput = {
        ...values,
        roles: values.roles as Role[],
      }
      return usersApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function toggleRole(role: Role) {
    const current = selectedRoles || []
    const newRoles = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    setValue('roles', newRoles, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {allRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`role-${role.value}`}
                    checked={selectedRoles?.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                  />
                  <label
                    htmlFor={`role-${role.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
            {errors.roles && <p className="text-xs text-destructive">{errors.roles.message}</p>}
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

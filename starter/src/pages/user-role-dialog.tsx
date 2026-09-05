import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { Role } from '@/lib/auth'
import { type UpdateUserRolesInput, type User, usersApi } from '@/lib/users.api'

const allRoles: { value: Role; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HR_PAYROLL_USER', label: 'HR Payroll User' },
  { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager' },
  { value: 'ADMIN', label: 'Admin' },
]

const schema = z.object({
  roles: z.array(z.string()).min(1, 'At least one role is required'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserRoleDialog({ open, onOpenChange, user }: Props) {
  const qc = useQueryClient()

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { roles: [] } })

  const selectedRoles = watch('roles')

  useEffect(() => {
    if (open && user) {
      reset({ roles: user.roles })
    }
  }, [open, user, reset])

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (!user) throw new Error('No user selected')
      const payload: UpdateUserRolesInput = {
        roles: values.roles as Role[],
      }
      return usersApi.updateRoles(user.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User roles updated')
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
          <DialogTitle>Edit roles for {user?.name}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {allRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles?.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
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
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

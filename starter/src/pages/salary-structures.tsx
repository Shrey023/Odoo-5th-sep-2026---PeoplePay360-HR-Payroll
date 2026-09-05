import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PAYROLL_CONFIG_ROLES, useAuth } from '@/lib/auth'
import { salaryApi } from '@/lib/salary.api'

export function SalaryStructuresPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...PAYROLL_CONFIG_ROLES)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryApi.listStructures(),
  })

  const create = useMutation({
    mutationFn: () => salaryApi.createStructure({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
      toast.success('Structure created')
      setOpen(false)
      setName('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Salary Structures</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Structure
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {structures.map((s) => (
          <Link key={s.id} to={`/salary-structures/${s.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <span className={`text-xs font-medium ${s.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {s.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s._count.rules} rules</div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {structures.length === 0 && (
          <p className="text-sm text-muted-foreground">No salary structures yet.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New salary structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { http } from '@/lib/http'

interface Department {
  id: string
  name: string
  company: { id: string; name: string } | null
}

export function DepartmentsPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => http<Department[]>('/departments'),
  })

  const createMut = useMutation({
    mutationFn: (name: string) => http<Department>('/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department created')
      setOpen(false)
      setName('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Departments</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Department
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.company?.name ?? '-'}</TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    No departments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMut.mutate(name) }}>
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input
                placeholder="e.g. Marketing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, List, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { type Employee, employeesApi } from '@/lib/employees.api'
import { cn } from '@/lib/utils'
import { EmployeeFormDialog } from './employee-form-dialog'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function EmployeesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)

  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Employee | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeesApi.list({ search }),
  })

  const remove = useMutation({
    mutationFn: employeesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(e: Employee) {
    setEditing(e)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-md border p-0.5">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="size-4" /> Kanban
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="size-4" /> List
          </Button>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees found.</p>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((e) => (
            <Card
              key={e.id}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() => navigate(`/employees/${e.id}`)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {initials(e.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{e.jobPosition}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {e.department?.name ?? '-'}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        e.status === 'ACTIVE' ? 'bg-green-500' : 'bg-muted-foreground',
                      )}
                    />
                    {e.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Work Email</TableHead>
                <TableHead>Job Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/employees/${e.id}`)}
                >
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.workEmail}</TableCell>
                  <TableCell>{e.jobPosition}</TableCell>
                  <TableCell>{e.department?.name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {e.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(e.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} />
    </div>
  )
}

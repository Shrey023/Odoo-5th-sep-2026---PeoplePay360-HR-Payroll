import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { timeOffApi } from '@/lib/timeoff.api'
import { TimeOffTypeDialog } from './time-off-type-dialog'

export function TimeOffTypesPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const [typeOpen, setTypeOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffApi.listTypes(),
  })

  const filtered = types.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Time Off Types</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setTypeOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        )}
      </div>

      <Input
        placeholder="Search time off types…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.unit === 'DAYS' ? 'Days' : 'Hours'}</TableCell>
                  <TableCell>
                    <Badge variant={t.requiresAllocation ? 'default' : 'secondary'}>
                      {t.requiresAllocation ? 'Required' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.approvalRequired ? 'Manager' : 'No approval'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    No time off types found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <TimeOffTypeDialog open={typeOpen} onOpenChange={setTypeOpen} />
    </div>
  )
}

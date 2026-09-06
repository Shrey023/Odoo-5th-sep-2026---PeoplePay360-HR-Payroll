import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HR_ROLES, useAuth } from '@/lib/auth'
import { scheduleApi } from '@/lib/schedule.api'

export function WorkingSchedulesPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [calendarType, setCalendarType] = useState('Standard')

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['working-schedules'],
    queryFn: () => scheduleApi.list(),
  })

  const create = useMutation({
    mutationFn: () => scheduleApi.create(name, calendarType),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['working-schedules'] })
      toast.success('Schedule created')
      setOpen(false)
      setName('')
      navigate(`/working-schedules/${s.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Working Schedules</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Schedule
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
                <TableHead>Schedule Name</TableHead>
                <TableHead>Calendar Type</TableHead>
                <TableHead>Days / Week</TableHead>
                <TableHead>Hours / Week</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link to={`/working-schedules/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>{s.calendarType}</TableCell>
                  <TableCell>{s.daysPerWeek}</TableCell>
                  <TableCell>{Number(s.weeklyHours)}h</TableCell>
                  <TableCell>{s.company?.name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {s.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No working schedules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Working Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sched-name">Schedule Name</Label>
              <Input
                id="sched-name"
                placeholder="e.g. Night Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-type">Calendar Type</Label>
              <select
                id="cal-type"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={calendarType}
                onChange={(e) => setCalendarType(e.target.value)}
              >
                <option value="Standard">Fixed</option>
                <option value="Flexible">Variable</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

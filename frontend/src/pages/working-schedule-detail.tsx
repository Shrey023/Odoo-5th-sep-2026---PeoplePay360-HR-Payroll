import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { dayName, scheduleApi, type ScheduleLine } from '@/lib/schedule.api'

const DAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

interface EditLine {
  dayOfWeek: number
  startTime: string
  endTime: string
  breakMinutes: number
}

function hoursFromLine(l: EditLine) {
  const [sh, sm] = l.startTime.split(':').map(Number)
  const [eh, em] = l.endTime.split(':').map(Number)
  const worked = (eh * 60 + em) - (sh * 60 + sm) - l.breakMinutes
  return Math.max(0, Math.round(worked / 60 * 100) / 100)
}

export function WorkingScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...HR_ROLES)
  const qc = useQueryClient()

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['working-schedule', id],
    queryFn: () => scheduleApi.get(id!),
    enabled: Boolean(id),
  })

  const [lines, setLines] = useState<EditLine[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (schedule) {
      setLines(
        schedule.lines.map((l) => ({
          dayOfWeek: l.dayOfWeek,
          startTime: l.startTime,
          endTime: l.endTime,
          breakMinutes: l.breakMinutes,
        })),
      )
      setDirty(false)
    }
  }, [schedule])

  const save = useMutation({
    mutationFn: () =>
      scheduleApi.upsertLines(id!, { lines }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['working-schedule', id] })
      qc.invalidateQueries({ queryKey: ['working-schedules'] })
      toast.success('Working schedule saved')
      setDirty(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function addDay() {
    const used = new Set(lines.map((l) => l.dayOfWeek))
    const next = DAY_OPTIONS.find((d) => !used.has(d.value))
    if (!next) return
    setLines((prev) => [
      ...prev,
      { dayOfWeek: next.value, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    ])
    setDirty(true)
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  function updateLine(idx: number, field: keyof EditLine, value: string | number) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    )
    setDirty(true)
  }

  const totalWeeklyHours = lines.reduce((sum, l) => sum + hoursFromLine(l), 0)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!schedule) return <p className="text-sm text-muted-foreground">Schedule not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/working-schedules" className="hover:underline">
          Working Schedules
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{schedule.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{schedule.name}</h2>
          <p className="text-sm text-muted-foreground">
            Use this schedule as the employee/contract working pattern.
          </p>
        </div>
        {canEdit && dirty && (
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Calendar Type</div>
            <div className="font-medium">{schedule.calendarType}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Days / Week</div>
            <div className="font-medium">{lines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Hours / Week</div>
            <div className="font-medium">{totalWeeklyHours}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {schedule.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={addDay} disabled={lines.length >= 7}>
              <Plus className="size-4" /> Add Day
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Hours</TableHead>
                {canEdit && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines
                .slice()
                .sort((a, b) => {
                  const order = [1, 2, 3, 4, 5, 6, 0]
                  return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek)
                })
                .map((line, idx) => {
                  const realIdx = lines.indexOf(line)
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        {canEdit ? (
                          <select
                            className="h-8 rounded-md border bg-transparent px-2 text-sm"
                            value={line.dayOfWeek}
                            onChange={(e) =>
                              updateLine(realIdx, 'dayOfWeek', Number(e.target.value))
                            }
                          >
                            {DAY_OPTIONS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          dayName(line.dayOfWeek)
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="time"
                            className="h-8 w-28"
                            value={line.startTime}
                            onChange={(e) => updateLine(realIdx, 'startTime', e.target.value)}
                          />
                        ) : (
                          line.startTime
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="time"
                            className="h-8 w-28"
                            value={line.endTime}
                            onChange={(e) => updateLine(realIdx, 'endTime', e.target.value)}
                          />
                        ) : (
                          line.endTime
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={line.breakMinutes}
                            min={0}
                            onChange={(e) =>
                              updateLine(realIdx, 'breakMinutes', Number(e.target.value))
                            }
                          />
                        ) : (
                          `${line.breakMinutes}m`
                        )}
                      </TableCell>
                      <TableCell>{hoursFromLine(line)}h</TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(realIdx)}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No days configured. Click Add Day to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {lines.length > 0 && (
            <div className="mt-3 flex justify-end text-sm font-medium">
              Total Weekly Hours: {totalWeeklyHours}h
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

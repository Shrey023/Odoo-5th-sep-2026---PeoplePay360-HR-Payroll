import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { scheduleApi } from '@/lib/schedule.api'

export function WorkingSchedulesPage() {
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['working-schedules'],
    queryFn: () => scheduleApi.list(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Working Schedules</h2>
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
                    <Link
                      to={`/working-schedules/${s.id}`}
                      className="font-medium hover:underline"
                    >
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
    </div>
  )
}

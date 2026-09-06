import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { attendanceApi } from '@/lib/attendance.api'
import { HR_ROLES, useAuth } from '@/lib/auth'

function elapsed(since: string) {
  const ms = Date.now() - new Date(since).getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function AttendanceWidget() {
  const { hasRole } = useAuth()
  const isHR = hasRole(...HR_ROLES)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)

  const { data: active } = useQuery({
    queryKey: ['attendance-active'],
    queryFn: () => attendanceApi.active(),
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [active])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['attendance-active'] })
    qc.invalidateQueries({ queryKey: ['attendance'] })
  }

  const checkIn = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => { invalidate(); toast.success('Checked in'); setOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const checkOut = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => { invalidate(); toast.success('Checked out'); setOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const isCheckedIn = Boolean(active)

  if (isHR) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            isCheckedIn
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
          title={isCheckedIn ? 'Checked in - click to check out' : 'Not checked in'}
        >
          <span
            className={`size-2 rounded-full ${isCheckedIn ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          {isCheckedIn ? elapsed(active!.checkIn) : 'Check In'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-muted-foreground" />
            Attendance
          </div>
          {isCheckedIn ? (
            <>
              <div className="text-xs text-muted-foreground">
                Checked in at{' '}
                <span className="font-medium text-foreground">
                  {new Date(active!.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {elapsed(active!.checkIn)}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => checkOut.mutate()}
                disabled={checkOut.isPending}
              >
                <LogOut className="size-4" /> Check Out
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">Not checked in today</div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => checkIn.mutate()}
                disabled={checkIn.isPending}
              >
                <LogIn className="size-4" /> Check In
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

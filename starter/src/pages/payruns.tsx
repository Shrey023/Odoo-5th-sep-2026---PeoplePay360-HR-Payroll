import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PAYROLL_WRITE_ROLES, useAuth } from '@/lib/auth'
import { type PayrunStatus, payrunsApi } from '@/lib/payruns.api'
import { PayrunCreateDialog } from './payrun-create-dialog'

const statusVariant: Record<PayrunStatus, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'secondary',
  COMPUTED: 'outline',
  VALIDATED: 'outline',
  PAID: 'default',
}

export function PayrunsPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...PAYROLL_WRITE_ROLES)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: payruns = [] } = useQuery({
    queryKey: ['payruns'],
    queryFn: () => payrunsApi.list(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payruns</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Payrun
          </Button>
        )}
      </div>

      <Input
        placeholder="Search payruns…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Card>
        <CardContent className="p-4">
          {payruns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payruns yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead>Payslips</TableHead>
                  <TableHead>Warnings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payruns.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link to={`/payruns/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.periodStart.slice(0, 10)} — {p.periodEnd.slice(0, 10)}
                    </TableCell>
                    <TableCell>{p.structure.name}</TableCell>
                    <TableCell>{p._count.payslips}</TableCell>
                    <TableCell>
                      {p.warningsCount > 0 ? (
                        <span className="text-xs font-medium text-amber-600">{p.warningsCount} warning{p.warningsCount > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No warnings</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PayrunCreateDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

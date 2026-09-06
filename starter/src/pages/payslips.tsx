import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { downloadFile, http } from '@/lib/http'
import { payrunsApi } from '@/lib/payruns.api'

interface PayslipRow {
  id: string
  gross: string
  deductions: string
  net: string
  status: string
  workedDays: string
  periodStart: string
  periodEnd: string
  employee: { id: string; name: string }
  payrun: { id: string; name: string; periodStart: string; periodEnd: string }
}

const money = (n: string | number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DONE: 'default',
  DRAFT: 'secondary',
  COMPUTED: 'outline',
}

export function PayslipsPage() {
  const [search, setSearch] = useState('')

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payslips-all'],
    queryFn: () => http<PayslipRow[]>('/payruns/payslips/all'),
  })

  const filtered = payslips.filter(
    (p) =>
      !search ||
      p.employee.name.toLowerCase().includes(search.toLowerCase()) ||
      p.payrun.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Payslips</h2>
      </div>

      <Input
        placeholder="Search payslips…"
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
                <TableHead>Employee</TableHead>
                <TableHead>Pay Run</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link to={`/payslips/${p.id}`} className="hover:underline">
                      {p.employee.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/payruns/${p.payrun.id}`} className="hover:underline text-sm">
                      {p.payrun.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.payrun.periodStart.slice(0, 10)} - {p.payrun.periodEnd.slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{money(p.gross)}</TableCell>
                  <TableCell className="text-right font-medium">{money(p.net)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] ?? 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(`/payruns/payslips/${p.id}/pdf`, `payslip-${p.id}.pdf`).catch(() => {})}
                    >
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-muted-foreground">
                    No payslips yet. Compute a payrun first.
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

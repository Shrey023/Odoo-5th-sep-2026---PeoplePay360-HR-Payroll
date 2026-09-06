import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { http } from '@/lib/http'

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  PAID: 'default', VALIDATED: 'secondary', COMPUTED: 'outline',
}

export function MyPayslipsPage() {
  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: () => http<any[]>('/payruns/payslips/mine'),
  })

  const latest = payslips[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Payslips</h2>
        <p className="text-sm text-muted-foreground">Your personal payslip history.</p>
      </div>

      {latest && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Latest Pay Run</div>
              <div className="text-lg font-semibold">{latest.payrun?.name}</div>
              <div className="text-xs text-muted-foreground">{latest.periodStart?.slice(0, 7)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Gross Salary</div>
              <div className="text-lg font-semibold">{money(Number(latest.gross))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Net Pay</div>
              <div className="text-lg font-semibold text-green-600">{money(Number(latest.net))}</div>
              <div className="text-xs text-muted-foreground">After ₹{Number(latest.deductions).toLocaleString('en-IN')} deductions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : payslips.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payslips found for your account.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Run</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.payrun?.name ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.periodStart?.slice(0, 7)}</TableCell>
                  <TableCell>{money(Number(p.gross))}</TableCell>
                  <TableCell className="text-red-600">-{money(Number(p.deductions))}</TableCell>
                  <TableCell className="font-semibold">{money(Number(p.net))}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] ?? 'outline'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/payslips/${p.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

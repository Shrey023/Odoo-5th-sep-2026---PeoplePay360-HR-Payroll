import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import { http } from '@/lib/http'

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  PAID: 'default', VALIDATED: 'secondary', COMPUTED: 'outline',
}

export function MyPayslipsPage() {
  const { user } = useAuth()

  const { data: allPayslips = [], isLoading } = useQuery({
    queryKey: ['payslips-all'],
    queryFn: () => http<any[]>('/payruns/payslips/all'),
  })

  // Filter to only this employee's payslips using linked employeeId via user
  const myPayslips = allPayslips.filter(
    (p: any) => p.employee?.workEmail === user?.email,
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">My Payslips</h2>
        <p className="text-sm text-muted-foreground">Your personal payslip history.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : myPayslips.length === 0 ? (
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
              {myPayslips.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.payrun?.name ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.periodStart?.slice(0, 7)}
                  </TableCell>
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

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface PayslipDetail {
  id: string
  gross: string
  deductions: string
  net: string
  workedDays: string
  status: string
  periodStart: string
  periodEnd: string
  employee: { id: string; name: string; bankAccount: string | null }
  payrun: { id: string; name: string }
  lines: { id: string; ruleCode: string; ruleName: string; category: string; sequence: number; amount: string }[]
}

const money = (n: string | number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const categoryVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  BASIC: 'default',
  ALLOWANCE: 'secondary',
  GROSS: 'outline',
  DEDUCTION: 'destructive',
  NET: 'default',
}

export function PayslipDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => http<PayslipDetail>(`/payruns/payslips/${id}`),
    enabled: Boolean(id),
  })

  async function downloadPdf() {
    try {
      await downloadFile(payrunsApi.payslipPdfUrl(id), `payslip-${payslip?.employee.name.replace(/\s+/g, '-')}.pdf`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed')
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!payslip) return <p className="text-sm text-muted-foreground">Payslip not found.</p>

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Payslip / {payslip.employee.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {payslip.payrun.name} - {payslip.periodStart?.slice(0, 10)} to {payslip.periodEnd?.slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={payslip.status === 'PAID' || payslip.status === 'VALIDATED' ? 'default' : 'secondary'}>
            {payslip.status}
          </Badge>
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <Download className="size-4" /> Print Payslip
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/payruns/${payslip.payrun.id}`}>
              <ExternalLink className="size-4" /> Open Payrun
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Employee</div>
            <div className="font-medium">{payslip.employee.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Pay Run</div>
            <Link to={`/payruns/${payslip.payrun.id}`} className="font-medium hover:underline text-sm">
              {payslip.payrun.name}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Worked Days</div>
            <div className="font-medium">{payslip.workedDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Net Salary</div>
            <div className="text-lg font-semibold">{money(payslip.net)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Computation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.ruleName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.ruleCode}</TableCell>
                  <TableCell>
                    <Badge variant={categoryVariant[l.category] ?? 'secondary'} className="text-xs">
                      {l.category}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${Number(l.amount) < 0 ? 'text-destructive' : ''}`}>
                    {money(l.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross</span>
              <span>{money(payslip.gross)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Deductions</span>
              <span>- {money(payslip.deductions)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Net Salary</span>
              <span>{money(payslip.net)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

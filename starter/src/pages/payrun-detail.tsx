import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, Download, Mail } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import { downloadFile } from '@/lib/http'
import { type PayrunStatus, payrunsApi } from '@/lib/payruns.api'

const statusVariant: Record<PayrunStatus, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'secondary',
  COMPUTED: 'outline',
  VALIDATED: 'outline',
  PAID: 'default',
}

const money = (n: string | number) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

export function PayrunDetailPage() {
  const { id = '' } = useParams()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...PAYROLL_WRITE_ROLES)
  const qc = useQueryClient()

  const { data: payrun, isLoading } = useQuery({
    queryKey: ['payrun', id],
    queryFn: () => payrunsApi.get(id),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payrun', id] })
    qc.invalidateQueries({ queryKey: ['payruns'] })
  }

  const compute = useMutation({
    mutationFn: () => payrunsApi.compute(id),
    onSuccess: (r) => {
      invalidate()
      const msg =
        r.skipped.length > 0
          ? `Computed. ${r.skipped.length} employee(s) skipped (no contract).`
          : 'Computed'
      toast.success(msg)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const validate = useMutation({
    mutationFn: () => payrunsApi.validate(id),
    onSuccess: () => {
      invalidate()
      toast.success('Validated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const pay = useMutation({
    mutationFn: () => payrunsApi.markPaid(id),
    onSuccess: () => {
      invalidate()
      toast.success('Marked paid')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const send = useMutation({
    mutationFn: () => payrunsApi.send(id),
    onSuccess: (r) => {
      const preview = r.results.find((x) => x.previewUrl)?.previewUrl
      toast.success(`Sent ${r.sent} payslip(s)`, {
        description: preview ? 'Click to preview the first email' : undefined,
        action: preview
          ? { label: 'Preview', onClick: () => window.open(preview as string, '_blank') }
          : undefined,
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  async function downloadPdf(payslipId: string, name: string) {
    try {
      await downloadFile(payrunsApi.payslipPdfUrl(payslipId), `payslip-${name}.pdf`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed')
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!payrun) return <p className="text-sm text-muted-foreground">Payrun not found.</p>

  const totalNet = payrun.payslips.reduce((sum, s) => sum + Number(s.net), 0)

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/payruns">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{payrun.name}</h2>
          <p className="text-sm text-muted-foreground">
            {payrun.periodStart.slice(0, 10)} - {payrun.periodEnd.slice(0, 10)} - {payrun.structure.name}
          </p>
        </div>
        <Badge variant={statusVariant[payrun.status]}>{payrun.status}</Badge>
      </div>

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          {(payrun.status === 'DRAFT' || payrun.status === 'COMPUTED') && (
            <Button size="sm" onClick={() => compute.mutate()} disabled={compute.isPending}>
              {payrun.status === 'DRAFT' ? 'Compute' : 'Recompute'}
            </Button>
          )}
          {payrun.status === 'COMPUTED' && (
            <Button size="sm" onClick={() => validate.mutate()} disabled={validate.isPending}>
              Validate
            </Button>
          )}
          {payrun.status === 'VALIDATED' && (
            <Button size="sm" onClick={() => pay.mutate()} disabled={pay.isPending}>
              Mark Paid
            </Button>
          )}
          {(payrun.status === 'VALIDATED' || payrun.status === 'PAID') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => send.mutate()}
              disabled={send.isPending}
            >
              <Mail className="size-4" /> Send Payslips
            </Button>
          )}
        </div>
      )}

      {payrun.warnings.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-50/50">
          <CardContent className="space-y-1 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <AlertTriangle className="size-4" /> Warnings
            </div>
            {payrun.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700">
                {w.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {payrun.payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payslips yet. Compute the payrun to generate them.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Warning</TableHead>
                  <TableHead className="text-right">Worked</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrun.payslips.map((s) => {
                  const warn = payrun.warnings.find((w) => w.employeeId === s.employee.id)
                  const basicLine = s.lines.find((l) => l.category === 'BASIC')
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employee.name}</TableCell>
                      <TableCell>
                        {warn ? (
                          <span className="text-xs text-amber-600">{warn.type === 'MISSING_BANK' ? 'A/C missing' : warn.type === 'DUPLICATE_PAYSLIP' ? 'Duplicate' : warn.type}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{s.workedDays}</TableCell>
                      <TableCell className="text-right">{basicLine ? money(basicLine.amount) : '—'}</TableCell>
                      <TableCell className="text-right">{money(s.gross)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(s.net)}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'PAID' || s.status === 'VALIDATED' ? 'default' : 'secondary'} className="text-xs">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download PDF"
                          onClick={() => downloadPdf(s.id, s.employee.name.replace(/\s+/g, '-'))}
                        >
                          <Download className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell className="font-semibold" colSpan={5}>Total</TableCell>
                  <TableCell className="text-right font-semibold">{money(totalNet)}</TableCell>
                  <TableCell /><TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

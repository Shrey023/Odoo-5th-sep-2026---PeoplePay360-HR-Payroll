import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { salaryApi } from '@/lib/salary.api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string | null
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

export function PayslipPreviewDialog({ open, onOpenChange, contractId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payslip-preview', contractId],
    queryFn: () => salaryApi.previewContract(contractId!),
    enabled: open && Boolean(contractId),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payslip preview</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Computing...</p>}
        {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

        {data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{data.employee.name}</div>
                <div className="text-muted-foreground">
                  {data.structure.name} - wage {money(data.contract.wage)}
                </div>
              </div>
              <Badge>{data.contract.reference}</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lines.map((l) => (
                  <TableRow key={l.ruleCode}>
                    <TableCell>{l.ruleName}</TableCell>
                    <TableCell className="text-muted-foreground">{l.category}</TableCell>
                    <TableCell className="text-right">{money(l.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="space-y-1 border-t pt-3 text-sm">
              <Row label="Gross" value={money(data.gross)} />
              <Row label="Deductions" value={`- ${money(data.deductions)}`} />
              <div className="flex justify-between font-semibold">
                <span>Net Pay</span>
                <span>{money(data.net)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

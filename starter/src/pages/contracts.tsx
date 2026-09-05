import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { contractsApi, type ContractStatus } from '@/lib/contracts.api'

const statusVariant: Record<ContractStatus, 'default' | 'secondary' | 'destructive'> = {
  RUNNING: 'default',
  DRAFT: 'secondary',
  EXPIRED: 'destructive',
}

export function ContractsPage() {
  const [search, setSearch] = useState('')

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => contractsApi.listAll(),
  })

  const filtered = contracts.filter(
    (c) =>
      !search ||
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      (c.employee as any)?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Contracts</h2>
      </div>

      <Input
        placeholder="Search contracts…"
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
                <TableHead>Contract</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Wage / Month</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/employees/${(c as any).employeeId}`}
                      className="hover:underline"
                    >
                      {c.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{(c as any).employee?.name ?? '-'}</TableCell>
                  <TableCell>{c.startDate.slice(0, 10)}</TableCell>
                  <TableCell>{c.endDate ? c.endDate.slice(0, 10) : '-'}</TableCell>
                  <TableCell>₹{Number(c.wage).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No contracts found.
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

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
  const [statusFilter, setStatusFilter] = useState('')

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => contractsApi.listAll(),
  })

  const filtered = contracts.filter((c) => {
    if (search && !c.reference.toLowerCase().includes(search.toLowerCase()) && !(c.employee as any)?.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Contracts</h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search contracts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="RUNNING">Running</option>
          <option value="DRAFT">Draft</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

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
                <TableHead>Working Schedule</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link to={`/employees/${(c as any).employeeId}`} className="hover:underline">
                      {c.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{(c as any).employee?.name ?? '-'}</TableCell>
                  <TableCell>{c.startDate.slice(0, 10)}</TableCell>
                  <TableCell>{c.endDate ? c.endDate.slice(0, 10) : '-'}</TableCell>
                  <TableCell>₹{Number(c.wage).toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.schedule?.name ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
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

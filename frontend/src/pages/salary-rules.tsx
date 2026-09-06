import { useQueries, useQuery } from '@tanstack/react-query'
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
import { salaryApi, type SalaryRule } from '@/lib/salary.api'

const categoryVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  BASIC: 'default',
  ALLOWANCE: 'secondary',
  GROSS: 'outline',
  DEDUCTION: 'destructive',
  NET: 'default',
}

export function SalaryRulesPage() {
  const [search, setSearch] = useState('')

  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryApi.listStructures(),
  })

  const detailQueries = useQueries({
    queries: structures.map((s) => ({
      queryKey: ['salary-structure', s.id],
      queryFn: () => salaryApi.getStructure(s.id),
    })),
  })

  const allRules = detailQueries
    .flatMap((q) =>
      q.data
        ? q.data.rules.map((r) => ({
            ...r,
            structureName: q.data.name,
            structureId: q.data.id,
          }))
        : [],
    )
    .sort((a, b) => a.sequence - b.sequence)

  const filtered = allRules.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = detailQueries.some((q) => q.isLoading) && allRules.length === 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Salary Rules</h2>
      </div>

      <Input
        placeholder="Search salary rules…"
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
                <TableHead>Rule Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead>Computation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>
                    <Badge variant={categoryVariant[r.category] ?? 'secondary'}>
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={`/salary-structures/${r.structureId}`} className="text-sm hover:underline">
                      {r.structureName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.sequence}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.computeType === 'FIXED'
                      ? `Fixed: ₹${Number(r.amount).toLocaleString()}`
                      : r.computeType === 'PERCENTAGE'
                        ? `${r.percent}% of ${r.percentBase?.replace('_', ' ')}`
                        : 'Formula'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No salary rules found.
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

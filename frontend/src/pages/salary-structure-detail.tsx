import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
import { PAYROLL_CONFIG_ROLES, useAuth } from '@/lib/auth'
import { type SalaryRule, salaryApi } from '@/lib/salary.api'
import { RuleFormDialog } from './salary-rule-form-dialog'

function describeRule(r: SalaryRule) {
  if (r.computeType === 'FIXED') return `Fixed ${Number(r.amount ?? 0).toLocaleString()}`
  if (r.computeType === 'PERCENTAGE') return `${r.percent}% of ${r.percentBase}`
  return r.expression ?? '-'
}

export function SalaryStructureDetailPage() {
  const { id = '' } = useParams()
  const { hasRole } = useAuth()
  const canEdit = hasRole(...PAYROLL_CONFIG_ROLES)
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryRule | null>(null)

  const { data: structure, isLoading } = useQuery({
    queryKey: ['salary-structure', id],
    queryFn: () => salaryApi.getStructure(id),
  })

  const del = useMutation({
    mutationFn: (ruleId: string) => salaryApi.removeRule(ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structure', id] })
      toast.success('Rule deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!structure) return <p className="text-sm text-muted-foreground">Structure not found.</p>

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/salary-structures">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{structure.name}</h2>
          <Badge variant={structure.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-1">
            {structure.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Add Rule
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {structure.rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Seq</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Computation</TableHead>
                  {canEdit && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {structure.rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.sequence}</TableCell>
                    <TableCell className="font-medium">{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {describeRule(r)}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(r)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RuleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        structureId={id}
        rule={editing}
      />
    </div>
  )
}

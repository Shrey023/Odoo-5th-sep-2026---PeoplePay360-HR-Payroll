import { useQuery } from '@tanstack/react-query'
import { Building2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { employeesApi } from '@/lib/employees.api'

export function DashboardPage() {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', ''],
    queryFn: () => employeesApi.list(),
  })

  const active = employees.filter((e) => e.status === 'ACTIVE').length
  const departments = new Set(employees.map((e) => e.department?.name).filter(Boolean)).size

  const cards = [
    { label: 'Active Employees', value: active, icon: Users },
    { label: 'Departments', value: departments, icon: Building2 },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Full payroll dashboard (KPIs, charts, warnings) lands in a later slice.
      </p>
    </div>
  )
}

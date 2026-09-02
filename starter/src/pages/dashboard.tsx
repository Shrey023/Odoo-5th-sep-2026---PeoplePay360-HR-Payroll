import { useQuery } from '@tanstack/react-query'
import { Boxes, CheckCircle2, PauseCircle, Layers } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

export function DashboardPage() {
  const { data: items = [] } = useQuery({ queryKey: ['items'], queryFn: api.list })

  const total = items.length
  const active = items.filter((i) => i.status === 'active').length
  const inactive = total - active
  const categories = new Set(items.map((i) => i.category)).size

  const byCategory = Object.entries(
    items.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    }, {}),
  ).map(([category, count]) => ({ category, count }))

  const stats = [
    { label: 'Total items', value: total, icon: Boxes },
    { label: 'Active', value: active, icon: CheckCircle2 },
    { label: 'Inactive', value: inactive, icon: PauseCircle },
    { label: 'Categories', value: categories, icon: Layers },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items by category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

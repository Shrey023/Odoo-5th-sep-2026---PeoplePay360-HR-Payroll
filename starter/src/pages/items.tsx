import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, CATEGORY_OPTIONS, type Item } from '@/lib/api'
import { ItemFormDialog } from './item-form-dialog'

const PAGE_SIZE = 8

export function ItemsPage() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['items'], queryFn: api.list })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Item | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const remove = useMutation({
    mutationFn: api.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      toast.success('Item deleted')
    },
  })

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'all' || it.category === category
      return matchesSearch && matchesCategory
    })
  }, [items, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(item: Item) {
    setEditing(item)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(item.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ItemFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />
    </div>
  )
}

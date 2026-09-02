/**
 * Mock in-memory data layer. Swap these functions for real fetch() calls
 * to your backend (Express/Supabase). TanStack Query in the pages doesn't
 * care where the data comes from, so only this file changes on event day.
 */

export interface Item {
  id: string
  name: string
  category: string
  status: 'active' | 'inactive'
  quantity: number
  createdAt: string
}

const CATEGORIES = ['Hardware', 'Software', 'Furniture', 'Vehicle']
let items: Item[] = Array.from({ length: 23 }, (_, i) => ({
  id: crypto.randomUUID(),
  name: `Item ${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  status: i % 3 === 0 ? 'inactive' : 'active',
  quantity: Math.floor(Math.random() * 100),
  createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
}))

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

export type ItemInput = Omit<Item, 'id' | 'createdAt'>

export const api = {
  async list(): Promise<Item[]> {
    await delay()
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async create(input: ItemInput): Promise<Item> {
    await delay()
    const item: Item = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    items.push(item)
    return item
  },
  async update(id: string, input: ItemInput): Promise<Item> {
    await delay()
    items = items.map((it) => (it.id === id ? { ...it, ...input } : it))
    return items.find((it) => it.id === id)!
  },
  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((it) => it.id !== id)
  },
}

export const CATEGORY_OPTIONS = CATEGORIES

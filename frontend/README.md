# Starter Kit - PS-agnostic hackathon skeleton

Pre-built so event day = map the problem statement onto this, not rebuild plumbing.

## What's inside

- **React + Vite + TS + Tailwind v4 + shadcn/ui** (new-york style, neutral base)
- **Auth** - login/register pages, protected routes, roles (`user`/`admin`). Mock in `src/lib/auth.tsx` - swap bodies for real API.
- **CRUD pattern** - the `Items` page is the reusable template: search + category filter + pagination + create/edit dialog (RHF+Zod) + delete, all wired through TanStack Query.
- **Dashboard** - stat cards + Recharts bar chart.
- **Layout** - sidebar + topbar, active-route highlight.
- **Toasts** - sonner.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

Login with any email. `admin@...` gets the admin role; anything else is a user.

## How to adapt on event day

1. **Rename the entity.** `Item` -> your PS's core thing (Ticket / Skill / Garment...). Edit `src/lib/api.ts` (the type + mock data), then the `items` page/dialog labels.
2. **Swap the data layer.** Replace the mock functions in `src/lib/api.ts` with real `fetch()` calls to your backend. Pages don't change - they only call `api.*`.
3. **Swap auth.** Replace the mock bodies in `src/lib/auth.tsx` with real login/register calls.
4. **Add more entities** by copying the `items.tsx` + `item-form-dialog.tsx` pair.
5. **Add roles/personas** - Playdoo (2nd place) used 3 dashboards (user/owner/admin). Gate routes/nav by `user.role`.

## Structure

```
src/
├── components/
│   ├── layout/app-layout.tsx   # sidebar + topbar shell
│   └── ui/                     # shadcn components
├── lib/
│   ├── api.ts                  # data layer (mock -> swap for real backend)
│   ├── auth.tsx                # auth context (mock -> swap for real)
│   └── utils.ts                # cn()
├── pages/
│   ├── login.tsx  register.tsx
│   ├── dashboard.tsx           # cards + chart
│   ├── items.tsx               # CRUD table (the reusable pattern)
│   └── item-form-dialog.tsx    # create/edit form (RHF+Zod)
├── App.tsx                     # routes
└── main.tsx                    # providers (Query, Router, Auth)
```

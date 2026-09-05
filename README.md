# PeoplePay360 - HR & Payroll

An integrated HR and Payroll platform: employees, contracts, working schedules, attendance, time off, a data-driven salary engine, payruns with payslips, and a live payroll dashboard.

## Stack

**Backend** - Node + Express + TypeScript, Prisma ORM, PostgreSQL (Docker). Layered as route -> controller -> service -> validator. JWT auth with bcrypt, role-based access control.

**Frontend** - React + Vite + TypeScript, Tailwind + shadcn/ui, TanStack Query, React Hook Form + Zod, Recharts, React Router.

## Features

- **Auth + RBAC** - JWT login, 5 roles (Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin), enforced server-side.
- **Employees** - Kanban/List/Form views, central form with smart-button counts (contracts, attendance, time off, allocations).
- **Contracts** - history per employee, one running contract per period (overlap guard), period resolver used by payroll.
- **Working schedules** - weekly pattern with derived days/week and hours/week (never hand-typed).
- **Attendance** - check-in/out with worked hours derived from the times.
- **Time off** - types, allocations, requests with an approval flow; leave balance is a derived ledger (approved allocations minus approved requests), never stored.
- **Salary engine** - data-driven rules (Fixed / Percentage / Formula) processed by sequence into categories (Basic, Allowance, Gross, Deduction, Net). Formula input is sandboxed. Unit-tested.
- **Payruns** - Draft -> Compute -> Validate -> Mark Paid state machine. Compute resolves each employee's contract and runs the engine, persisting payslips with per-line breakdown. Payslip PDF export and bulk email.
- **Dashboard** - live KPIs, net-by-department and attendance charts, and attention warnings (missing bank account, expiring contracts, unvalidated payruns). All aggregated from real data.

## Getting started

### Backend

```bash
cd backend
cp .env.example .env          # adjust if needed
docker compose up -d          # Postgres
npm install
npx prisma migrate deploy
npm run seed                  # demo company + users + data
npm run dev                   # http://localhost:4000
```

### Frontend

```bash
cd starter
npm install
npm run dev                   # http://localhost:5173
```

### Demo logins

All use password `password123`:

| Email | Role |
|---|---|
| admin@oxp.com | Admin |
| payroll@oxp.com | HR Payroll Manager |
| hr@oxp.com | HR Manager |
| aarav@oxp.com | Employee |

## Tests

```bash
cd backend && npm test        # salary engine unit tests
```

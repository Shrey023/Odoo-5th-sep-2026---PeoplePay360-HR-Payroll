# PeoplePay360 - Scale & Architecture Cheatsheet

## Current Demo Scale

| Entity | Count |
|---|---|
| Employees | 215 |
| Contracts | 215 (RUNNING) |
| Payruns | 3 (Jun / Jul / Aug 2026, PAID) |
| Payslips | 645 (215 × 3 months) |
| Payslip Lines | ~4,515 (7 rules × 645) |
| Allocations | ~430 (2 types × 215 employees) |
| Attendance Records | ~1,075 |
| Time Off Requests | 12 |

## How the Payslip Engine Scales

The engine (`backend/src/services/payslip.engine.ts`) is a pure in-memory function - no DB calls per rule:

```
computePayslip(contractWage, rules[]) -> { lines[], gross, deductions, net }
```

- Runs in O(R) per employee where R = number of salary rules (7 in demo)
- For a payrun of N employees: O(N × R) - linear, no joins inside the loop
- Entire payrun wrapped in a single Prisma transaction - atomic, no partial saves
- At 10,000 employees + 20 rules: ~200,000 operations, completes in seconds

## Database Indexes (Prisma schema)

Key query paths and their index support:

| Query | Index |
|---|---|
| Contracts for employee in period | `employeeId + status + startDate` |
| Payslips for a payrun | `payrunId` (FK) |
| Attendance by employee | `employeeId` (FK) |
| Time off requests by employee + type | `employeeId + typeId` |
| Allocations by employee | `employeeId` (FK) |

All FKs have implicit indexes in Postgres. Range queries on dates use the FK + date combo.

## What Scales Linearly

- **Payruns**: each payrun is independent - adding month N does not slow month N-1 queries
- **Employees**: employee list is paginated at the API layer (TanStack Table handles client-side for demo)
- **Payslip lines**: stored flat, queried by `payrunId` or `payslipId` - no full-table scans
- **Dashboard aggregates**: single SQL aggregation per metric, not row-by-row in app code

## What Would Need Work at 10k+ Employees

1. **Payrun compute** - currently sequential per employee. Fix: `Promise.all` in batches of 50
2. **Dashboard queries** - currently no caching. Fix: Redis cache with 5-min TTL
3. **Employee list** - currently no server-side pagination. Fix: `cursor`-based Prisma pagination
4. **Payslip PDF** - generated on demand. Fix: pre-generate + store in S3 on payrun close

## Tech Stack Justification (for judges)

| Choice | Why |
|---|---|
| Prisma + Postgres | Type-safe queries, migrations, ACID transactions for payslip engine |
| Express (not Next.js API) | Separation of concerns, easier to scale backend independently |
| TanStack Query | Automatic cache invalidation, background refetch, no prop drilling |
| Zod on both ends | Single source of truth for validation - frontend + backend share the same shape |
| React Router v6 | Nested layouts, lazy loading per route |
| Docker for Postgres | Reproducible local dev, no wifi dependency at hackathon |

## Seed Command

```bash
cd backend && npx prisma db seed
# Wipes and recreates everything. Safe for dev.
# Creates 4 login users:
#   admin@oxp.com       / password123  (ADMIN)
#   payroll@oxp.com     / password123  (HR_PAYROLL_MANAGER)
#   hr@oxp.com          / password123  (HR_MANAGER)
#   aarav@oxp.com       / password123  (EMPLOYEE)
```

## Start Command

```bash
./start.sh
# Starts Postgres (Docker) + Backend (port 4000) + Frontend (port 5173)
```

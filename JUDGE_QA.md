# PeoplePay360 - Judge Q&A Cheatsheet

## "Walk me through the architecture"

Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui. SPA, React Router v6 for routing.
Backend: Node/Express + TypeScript (ESM). Prisma ORM on Postgres (Docker). JWT auth.
Communication: REST API, TanStack Query on frontend for caching + invalidation.
No Next.js - deliberate. Clean frontend/backend separation, each scales independently.

---

## "How does the payslip engine work?"

File: `backend/src/services/payslip.engine.ts`

Pure function: `computePayslip(contractWage, rules[]) -> { lines, gross, deductions, net }`

1. Rules sorted by `sequence` number
2. Each rule computes an `amount` based on its type:
   - FIXED: literal number (e.g. ₹2000 meal allowance)
   - PERCENTAGE: % of contract wage or another category total (e.g. 50% of wage = Basic)
   - FORMULA: sandboxed JS expression referencing category accumulators (e.g. GROSS - DEDUCTION = NET)
3. Categories accumulate as rules run - BASIC/ALLOWANCE/DEDUCTION add up, GROSS/NET overwrite
4. Result: one payslip line per rule, final gross/deductions/net

Formula sandbox: regex whitelist blocks any expression that isn't arithmetic + `categories['X']` - no eval injection possible.

---

## "How do you handle concurrent contracts?"

File: `backend/src/services/contract.service.ts` - `assertNoRunningOverlap()`

Before creating/updating a RUNNING contract, checks if another RUNNING contract exists for same employee with overlapping date range. Throws 409 if overlap found. Prevents double-paying an employee.

---

## "How does leave balance work?"

Never stored - always derived. Formula:
`remaining = sum(approved allocations) - sum(approved requests that consumed allocation)`

- `GET /leave/balances/:employeeId` - computes live from allocation + request tables
- No stale balance field to sync - source of truth is always the transactions
- Over-balance guard: approving a request checks balance first, 422 if insufficient

---

## "How is role-based access implemented?"

JWT payload contains `roles: string[]`. Middleware:
- `authenticate` - verifies JWT, attaches user to `req.user`
- `authorize(...roles)` - checks `req.user.roles` has at least one match

Roles: ADMIN, HR_MANAGER, HR_PAYROLL_MANAGER, HR_PAYROLL_USER, EMPLOYEE

Frontend: `useAuth()` hook exposes `hasRole(...roles)` - hides buttons/routes for unauthorized users. Backend enforces independently - frontend hiding is UX only.

Self-elevation guard: users cannot grant themselves roles they don't already have.

---

## "How does the payrun workflow work?"

4-stage workflow: DRAFT → COMPUTED → VALIDATED → PAID

1. DRAFT - create payrun (period, structure, employee scope)
2. COMPUTED - run engine for all in-scope employees, create payslips (recomputable)
3. VALIDATED - lock payslips, generate warnings (missing bank, duplicates)
4. PAID - mark paid, send payslip PDFs via email

Each transition is a separate API call. Cannot skip stages. Cannot edit after VALIDATED.

---

## "What happens if an employee has no bank account?"

Warning system in `buildWarnings()`. When payrun is fetched, checks each payslip's employee for missing `bankAccount`. Returns warnings array to frontend. Dashboard shows red alert "N employees missing bank account". Payrun can still be paid - warning is advisory not blocking.

---

## "How does PDF generation work?"

File: `backend/src/services/payslip.pdf.ts` - uses `pdfkit` library.
`GET /payruns/payslips/:id/pdf` - generates on demand, streams as `application/pdf`.
Contains: employee name, period, all salary lines with amounts, gross/deductions/net summary.
Email attachment: same PDF buffer sent via Gmail SMTP (nodemailer).

---

## "How does the dashboard aggregate data?"

File: `backend/src/services/dashboard.service.ts`

Single endpoint `GET /dashboard` - runs parallel Prisma queries:
- Payslips → totalNet, paid/pending counts, by-department breakdown
- Employees → activeEmployees, avgSalary
- Attendance → byStatus counts, missingCheckouts, health %
- Allocations + Requests → byType leave summary
- Payruns → trend data (month + net per payrun)

Supports filters: departmentId, employeeType passed as query params.

---

## "What did you build in the time frame?"

Full HR + Payroll system from scratch:
- Auth with JWT + 5 roles
- Employee management (profiles, departments, working schedules)
- Contract management with overlap guard
- Attendance tracking with manual edit
- Time off: 4 leave types, allocation system, balance ledger, approval workflow
- Payroll: salary structures, formula engine, payrun workflow, PDF payslips, email delivery
- Dashboard: 5 KPIs, 4 charts, real-time filters, payroll alerts
- 215 seeded employees, 3 months of payroll history

---

## "What would you improve with more time?"

1. Server-side pagination for employee/payslip lists (currently client-side)
2. Redis cache for dashboard aggregates (recomputed on every request now)
3. Batch payrun compute with Promise.all in chunks of 50 (currently sequential)
4. Audit log - who approved what leave/payrun and when
5. Mobile responsive layout (desktop-first right now)
6. Real file storage for PDFs (S3) instead of on-demand generation

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@oxp.com | password123 |
| Payroll Manager | payroll@oxp.com | password123 |
| HR Manager | hr@oxp.com | password123 |
| Employee | aarav@oxp.com | password123 |

## Start Commands

```bash
# If servers are down
./start.sh

# If DB needs reset
cd backend && npx prisma db seed

# Kill stuck ports
lsof -ti:4000 | xargs kill -9; lsof -ti:5173 | xargs kill -9
```

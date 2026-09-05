# Cheat-sheet: Foundation (schema + auth) - Phase 0

Read this before a judge quiz on the data model or login. 5-min read.

## What this covers
The database (Prisma schema), the backend skeleton (Express), and how login + permissions work. No feature logic yet - that's the later slices.

## The data model in one breath
Employee is the master record. Everything links back to it:
- An **Employee** has many **Contracts** (over time), **Attendances**, **Time Off Requests**, **Allocations**, **Payslips**.
- A **Contract** carries the wage + which **Salary Structure** to use, and is valid for a date range.
- A **Salary Structure** holds ordered **Salary Rules** (Basic, HRA, PF...). Rules run by `sequence` and build the payslip.
- A **Payrun** (one pay period) generates one **Payslip** per employee; each payslip has **PayslipLines** (one per rule that fired).
- **Time Off**: a **TimeOffType** defines policy; **Allocations** grant balance; **Requests** consume it.
- **Company** and **Department** group employees (used by dashboard filters).

## Key design decisions (if asked "why")
- **Postgres, not NoSQL** - payroll is relational (contracts, rules, FK integrity). Right tool.
- **PayslipLine table** - stores every computed rule, so a payslip is auditable data, not a hardcoded number. This proves the calc is real.
- **Contract is period-based** - payroll picks the one contract active in the pay period. An employee can have history but only one Running contract per period.
- **weeklyHours on WorkingSchedule is derived** from the schedule lines, not typed by hand.

## Auth + permissions (RBAC)
- Login returns a **JWT** (signed token). Frontend sends it as `Authorization: Bearer <token>` on every request.
- `authenticate` middleware verifies the token, loads the user, attaches `req.user`.
- `authorize(...roles)` middleware guards each route - checks the user's `roles` array against allowed roles.
- **Enforced on the server**, not just hidden in the UI. Hiding-only would fail a security question.
- A user can have **one or more roles** (`roles UserRole[]`). Roles: EMPLOYEE, HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN.

## The stack (if asked)
- Backend: Node + Express + TypeScript, Prisma ORM, Postgres in Docker.
- One app, modular (controllers -> services -> Prisma). A modular monolith, not microservices - right scale for one team.
- Passwords hashed with bcrypt. Config via env vars.

## Likely judge questions + answers
- **"How does payroll know which contract to use?"** -> The Payrun has a period; per employee we find the Contract whose date range covers that period and is Running.
- **"How is a payslip calculated?"** -> Salary rules run in sequence; each writes a PayslipLine; totals accumulate by category (Basic -> Allowance -> Gross -> Deduction -> Net).
- **"How do you stop someone accessing payroll they shouldn't?"** -> Server-side RBAC middleware on the route; the token carries the user, the guard checks their roles.
- **"Why one payslip per employee per run?"** -> DB unique constraint on (payrun, employee) - prevents duplicate payslips.

## Files to point at
- `backend/prisma/schema.prisma` - the whole data model
- `backend/prisma/seed.ts` - demo data
- `backend/src/middleware/auth.middleware.ts` - JWT check
- `backend/src/middleware/rbac.middleware.ts` - role guard

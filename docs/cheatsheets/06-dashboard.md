# Cheat-sheet: Slice 6 - Dashboard (live aggregation) + polish

The payroll dashboard. One endpoint aggregates across every module and the frontend draws KPIs, two charts, and a warnings panel. Everything is live - no hardcoded numbers. 6-min read.

## What this slice delivers
- **KPIs** - active employees, total net pay, payslips paid/pending, approved leave days.
- **Two charts** - net salary by department (bar), attendance breakdown (pie).
- **Department overview** - headcount and net per department.
- **Warnings panel** - missing bank account, no running contract, contracts expiring soon, unvalidated payruns.
- **Employee-type filter** - re-queries the whole dashboard scoped to a type.
- **Polish** - sidebar active-highlight now works on detail routes.

## One aggregate endpoint (`GET /dashboard`)
`dashboard.service.ts` runs the reads in parallel with `Promise.all` (employees, departments, payslips, running contracts, requests, attendance), then folds them in memory:
- **totalNet** = sum of every payslip's `net`.
- **paid / pending** = payslips split by status PAID.
- **byDepartment** = group employees by `departmentId` for headcount, then add each payslip's net into its employee's department bucket. Employees with no department land in "Unassigned".
- **timeOff** = approved requests summed (`duration`) for approved days; TO_APPROVE counted for pending.
- **attendance** = tallied by status, plus a missing-checkout count (`checkOut` null).

Decimals come out of Prisma as `Decimal`, so a small `toNumber` helper does `.toString()` then `Number()` before any maths. Never do arithmetic on a Prisma Decimal directly.

## Why derive, never store
Same principle as the leave ledger: the dashboard is a **view over the source rows**, computed on each request. No cached totals to go stale. If a payslip changes, the next dashboard load reflects it - guaranteed correct by construction.

## Warnings (the "attention" panel)
Built from the same data already fetched, so no extra round-trips:
- **missing_bank** - active employees with no `bankAccount` (Neha in the seed).
- **no_contract** - active employees with no RUNNING contract.
- **expiring_contract** - running contracts whose `endDate` is within 30 days.
- **unvalidated_payrun** - payruns still DRAFT or COMPUTED (a `count` query).

## The filter
`?employeeType=FULL_TIME|CONTRACTOR|INTERN`. The controller whitelists the value against the enum and silently drops anything else (a garbage value returns the unfiltered dashboard, not a 400 - a dashboard should never hard-fail on a bad query param). The filter feeds a single `Prisma.EmployeeWhereInput` reused across every query, so all cards and charts move together.

Note: the backend also accepts `departmentId`, so a department filter is one line of frontend away. Left out of the UI for now (the frontend has no departments list endpoint yet) - worth mentioning to judges as backend-ready.

## Sidebar polish (the old "App" bug)
Active-highlight compared `pathname === to`, so `/employees/:id` matched nothing and the header read "App". Fixed with `isActive`: root `/` stays exact, every other nav item matches its path or any child (`startsWith(to + '/')`). Now detail pages keep their section highlighted and titled.

## Backend files
- `services/dashboard.service.ts` - the aggregation
- `controllers/dashboard.controller.ts` - query-param parsing + enum whitelist
- `routes/dashboard.routes.ts` - `GET /dashboard`, any authenticated user

## Frontend files
- `lib/dashboard.api.ts` - typed call + `DashboardData` shape
- `pages/dashboard.tsx` - KPIs, Recharts bar + pie, warnings panel, type filter
- `components/layout/app-layout.tsx` - `isActive` highlight fix

## Charts (Recharts)
First Recharts use in the app. Both wrapped in `ResponsiveContainer` so they size to the card. Bar = net by department; Pie = attendance statuses with fixed colors (present green, late amber, absent red, overtime blue). Empty attendance shows a fallback message instead of an empty chart.

## Likely judge questions + answers
- **"Is any of this hardcoded?"** -> No. One endpoint aggregates live rows across all modules on every request.
- **"How do you avoid stale totals?"** -> Nothing is stored. Totals are derived from the source rows each load, same as the leave balance.
- **"How do the filters work?"** -> A single `EmployeeWhereInput` is built once and reused across all queries, so every KPI and chart stays consistent. Type is enum-whitelisted; department is backend-ready.
- **"Where do the warnings come from?"** -> Computed from the data already fetched - missing bank, no running contract, contracts expiring in 30 days, unvalidated payruns. No extra queries except a payrun count.
- **"Why Decimal handling?"** -> Money is `Decimal` in Postgres/Prisma; we convert to number only at the aggregation boundary to keep the maths exact in the DB.

## Try it (curl)
```
# login, grab token
curl localhost:4000/api/dashboard -H "Authorization: Bearer <T>"

# scoped to interns
curl "localhost:4000/api/dashboard?employeeType=INTERN" -H "Authorization: Bearer <T>"
```

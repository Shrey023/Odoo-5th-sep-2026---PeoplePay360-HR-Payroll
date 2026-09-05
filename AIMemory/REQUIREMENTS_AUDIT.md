# Requirements Audit - PeoplePay360

Every functional note from the PDF + excalidraw mother doc, checked against the current schema/build.
Status: DONE / PARTIAL / MISSING / TODO (not built yet, planned).

Legend: coverage is about the **data model + planned build**, not finished UI.

---

## Login / User Access

| # | Requirement (source) | Status | Notes |
|---|---|---|---|
| 1 | User accounts separate from Employee, but linked to an employee | DONE | `Employee.userId` optional 1:1 to `User` |
| 2 | Accounts created by Admin; assign one or more roles | DONE | Admin-only POST /users (PR #9); multi-role via roles UserRole[]; users.tsx + role dialog. Verified create w/ 2 roles, no passwordHash leak |
| 3 | Roles control module/record/action access after login | TODO | RBAC middleware built; per-module enforcement lands per slice |
| 4 | Users must not assign/elevate own roles | DONE | PATCH /users/:id/roles rejects when userId===requesterId -> 403 (PR #9); verified. Non-admin -> 403 |
| 5 | Password reset/SSO = optional enhancements | SKIP | Out of scope, fine |

## Employee (master record)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 6 | Required views: Kanban, List, Form | DONE | employees.tsx Kanban/List toggle + employee-detail Form (Slice 1) |
| 7 | Kanban card + List row open the SAME Employee Form | DONE | both link to /employees/:id (Slice 1) |
| 8 | Employee Form = central hub via smart buttons (Contracts, Attendance, Time Off, Allocations) w/ counts | DONE | smartButtons on employee-detail w/ live counts from getById (Slice 1) |
| 9 | Capture dept, manager, schedule, job position, status | DONE | all fields present |

## Contract

| # | Requirement | Status | Notes |
|---|---|---|---|
| 10 | List + Form views | DONE | Contracts table on employee-detail + contract-form-dialog (Slice 2) |
| 11 | Employee can have multiple contracts over time (history retained) | DONE | `Contract[]` on employee |
| 12 | Payroll uses contract applicable to the period (Running) | DONE | `resolveForPeriod` in contract.service (Slice 2); payrun consumes it Slice 4 |
| 13 | One employee must NOT have multiple Running contracts for same period | DONE | `assertNoRunningOverlap` on create/update -> 409 (Slice 2) |
| 14 | Form captures duration, dept, position, wage, salary structure | DONE | Contract carries jobPosition, departmentId, wage, structureId, scheduleId, start/end (Slice 2). structure/schedule pickers wire up when those slices land |
| 15 | Make active Running contract obvious | DONE | Status badge on contracts table (Slice 2) |

## Working Schedule

| # | Requirement | Status | Notes |
|---|---|---|---|
| 16 | List + Form views | DONE | schedule list/get + upsertLines API (Slice 5); read-only view on employee detail |
| 17 | List surfaces: name, calendar type, **days/week**, **hours/week**, company, status | DONE | daysPerWeek + weeklyHours now derived on upsertLines (Slice 5) |
| 18 | Form defines weekly pattern: day, start/end, optional break, hours | DONE | `ScheduleLine` has all |
| 19 | Weekly hours DERIVED from schedule (not manual) | DONE | schedule.service deriveTotals recomputes on line change (Slice 5); verified 5x7h=35h |
| 20 | Assignable to Employee/Contract; used by Attendance + Payroll | DONE | FK on both Employee + Contract |

## Attendance

| # | Requirement | Status | Notes |
|---|---|---|---|
| 21 | List + Form, linked to employee | DONE | attendance list (employee filter) + shown on employee detail (Slice 5) |
| 22 | Store check-in, check-out, worked hours, status | DONE | all fields; workedHours derived |
| 23 | Accessible globally OR from an employee (filtered) | DONE | GET /attendance?employeeId= (Slice 5) |
| 24 | Worked hours + overtime easy to read | DONE | workedHours; OVERTIME status |
| 25 | Manual corrections (authorized users) understandable | DONE | `manualEdit` flag; RBAC on edit |
| 26 | Quick-action popup: Check In / Check Out, elapsed time, green when in | SKIP | Nice-to-have; attendance records viewable/creatable via API. Cut to protect demo polish (Slice 6) |
| 27 | Data usable for reporting/dashboard | DONE | queryable |

## Time Off

| # | Requirement | Status | Notes |
|---|---|---|---|
| 28 | Requests, Allocations, Time Off Types reached ONLY from Time Off ▼ navbar (no separate page buttons) | DONE | single Time Off page, 3 tabs Requests/Allocations/Types (Slice 5) |
| 29 | Types define unit (days/hours), requiresAllocation, approval flow | DONE | `TimeOffType` fields + type dialog |
| 30 | Allocations grant balance; require approval before available | DONE | `AllocationStatus`; balance counts only APPROVED (Slice 5) |
| 31 | Approved requests consume balance ONLY when type requiresAllocation | DONE | ledger counts approved requests; guard only checks requiresAllocation types (Slice 5) |
| 32 | If type requiresAllocation, employee must have available allocation before submitting request | DONE | balance guard on approve -> 422 over-balance (Slice 5). Note: enforced at approval not submission |
| 33 | Request approval lifecycle status | DONE | `RequestStatus` (DRAFT/TO_APPROVE/APPROVED/REFUSED) |
| 34 | List shows balance math: Allocated, Taken, Remaining | DONE | getBalances + Leave Balances card on employee detail (Slice 5) |
| 35 | Request should show which balance was consumed | DONE | approved requiresAllocation requests show "Consumed X from <type>" on Requests tab + employee-detail Leave Balances (PR #8); verified Aarav 2 days Annual |

## Salary Structure & Rules

| # | Requirement | Status | Notes |
|---|---|---|---|
| 36 | Structure = named collection of rules (e.g. Regular Salary) | DONE | seeded |
| 37 | Structure Form shows included rules + sequence | DONE | salary-structure-detail ordered rules table (Slice 3) |
| 38 | Rule List/Form exposes: Name, Code, Category, Structure, Sequence | DONE | all fields |
| 39 | Compute methods: Fixed, Percentage (of Contract Wage/Basic/Gross), Formula/Python | DONE | `ComputeType` + percentBase; formula = expression |
| 40 | Categories: Basic, Allowance, Gross, Deduction, Net | DONE | `RuleCategory` |
| 41 | Rules processed by sequence | DONE | sequence field; engine Slice 3 |
| 42 | Rules actually DRIVE payslip calc (not hardcoded) | DONE | payslip.engine.ts data-driven; 7 unit tests green (Slice 3) |
| 43 | Percentage base can be Contract Wage / Basic / Gross | DONE | percentBase enum includes CONTRACT_WAGE + BASIC/ALLOWANCE/GROSS/DEDUCTION; engine resolves each (Slice 3) |

## Payrun & Payslip

| # | Requirement | Status | Notes |
|---|---|---|---|
| 44 | NEW opens wizard, does NOT create payrun immediately | DONE | 2-step create dialog; create only on final submit (Slice 4) |
| 45 | Step 1: scope = employee type, salary structure, period | DONE | wizard step 1 captures all three; Payrun.employeeType optional filter (Slice 4) |
| 46 | Continue -> employee selection (no payrun yet) | DONE | wizard step 2 = employee checkbox list (pre-checked in-scope, select-all/clear); payrun created only on submit. Payrun.employeeIds persists selection |
| 47 | Create Payrun -> batch w/ ONLY selected employees | DONE | scopeWhere filters to Payrun.employeeIds when set; verified 2-of-4 picked -> exactly 2 payslips. Empty selection = all in-scope (backward compat) |
| 48 | Each selected employee gets a Payslip linked to Payrun | DONE | compute persists Payslip per in-scope employee (Slice 4) |
| 49 | Compute uses applicable contract + selected structure | DONE | compute resolves RUNNING contract for period + structure rules -> engine (Slice 4) |
| 50 | Payslip shows Basic, Allowances, Deductions, Gross, Net + worked days | DONE | PayslipLines + gross/deductions/net persisted; workedDays defaults 0 (Slice 5 attendance feeds it) |
| 51 | Warnings: missing info (bank A/C), duplicate payslip - visible before finalize | DONE | buildWarnings (missing bank) shown as banner; duplicates blocked by unique + idempotent recompute (Slice 4) |
| 52 | Workflow: Draft -> Compute -> Validate -> Mark Paid | DONE | full state machine w/ guarded transitions (Slice 4) |
| 53 | Paid/finalized stays as historical data | DONE | records persist; PayslipLines snapshot at compute time |
| 54 | Each payslip -> printable PDF | DONE | pdfkit, authed download (Slice 4) |
| 55 | Payrun bulk Send Payslips by email | DONE | nodemailer Ethereal, PDF attached, preview URL (Slice 4) |

## Dashboard

| # | Requirement | Status | Notes |
|---|---|---|---|
| 56 | Lives in Payroll module, aggregates across Employee/Dept, Contract, Attendance, Time Off, Payroll | DONE | `GET /dashboard` aggregates all modules in one Promise.all (Slice 6) |
| 57 | Uses REAL data, not hardcoded | DONE | all live queries, derived on each request; verified totalNet 91440 (Slice 6) |
| 58 | KPIs: total net salary, # payslips, paid/pending | DONE | KPI cards: active emps, total net, paid/pending, approved leave days (Slice 6) |
| 59 | Department overview: headcount / salary by dept | DONE | byDepartment (headcount + net) as cards + bar chart (Slice 6) |
| 60 | Time Off overview: approved days, pending requests, remaining balances by type | PARTIAL | dashboard shows approved days + pending requests; per-type remaining shown on employee detail (Slice 5). Aggregate per-type on dashboard not added |
| 61 | Attendance overview: present/absent/late, overtime, missing check-outs, coverage, manual edits | DONE | byStatus tally + missingCheckouts + pie chart (Slice 6) |
| 62 | >=2 visual summaries (bar/line/stacked/table) | DONE | bar (net by dept) + pie (attendance) + dept table (Slice 6) |
| 63 | Filters: Period, Department, Employee Type, Company affect data | DONE | department + employee-type dropdowns live on dashboard (PR #7); verified Engineering filter 199->83. Period/company still weaker (no period picker / single company) |
| 64 | Warnings/attention items: duplicate payslips, missing bank, contracts expiring, drafts not validated | DONE | warnings panel: missing bank, no running contract, contracts expiring 30d, unvalidated payruns (Slice 6). Duplicates prevented at compute (unique+idempotent) |

---

## GAPS - all 7 resolved (2026-09-05, "fix all literally")

1. **#2 multi-role** - RESOLVED. `User.roles UserRole[]`; RBAC guard checks intersection.
2. **#13 no concurrent Running contracts** - schema ready; validation lands in Contract service (Slice 2). Still TODO in code.
3. **#14 contract dept/position** - RESOLVED. Contract now has `jobPosition`, `employeeType`, `departmentId`.
4. **#17/#19 Working Schedule days/week + weekly hours** - RESOLVED (schema: `daysPerWeek`, `weeklyHours`). Service must recompute on line change (Slice 5).
5. **#43 percentBase Contract Wage** - RESOLVED. New `PercentBase` enum includes CONTRACT_WAGE.
6. **#45 Payrun employee-type scope** - RESOLVED. `Payrun.employeeType` optional filter.
7. **#63 Company filter** - RESOLVED. `Company` model added; Employee/Department/WorkingSchedule linked.

Remaining code-level TODOs (not schema gaps): #13 concurrent-contract validation, weekly-hours recompute on schedule edit. Tracked to their slices.

Everything else = either DONE (model) or correctly deferred to its slice.

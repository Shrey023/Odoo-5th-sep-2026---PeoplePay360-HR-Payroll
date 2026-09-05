# PeoplePay360 - System Design

HR & Payroll platform. Employee is the master record; everything else hangs off it.
Judges reward **business logic, data relationships, and payroll computation** over UI polish.
This doc is the blueprint we build against. Every person must be able to explain the part they own.

---

## 0. The one thing that wins

The PS says it three times: **real business logic, not mockups.**

The winning 20% is three engines, not screens:

1. **Salary computation engine** - sequenced salary rules (fixed / percentage / formula) that build on each other to produce a payslip. This is the hardest and most-rewarded part.
2. **Period-based contract resolution** - a Payrun for a period must pick the *one* contract active in that period per employee. No concurrent active contracts.
3. **Leave balance ledger** - approved allocations add balance; approved requests consume it, but only for leave types that require allocation.

Build these correctly and demoable. Everything else (CRUD screens, tables, forms) is the predictable 80% the starter kit already shapes.

---

## 1. Architecture (high level)

```
                    React + Vite SPA (starter kit)
                    Kanban/List/Form + Dashboard
                             |
                       REST/JSON over HTTP
                             |
                    Node + Express API
                    - auth + RBAC middleware
                    - payroll compute engine   <-- winning 20%
                    - leave balance service    <-- winning 20%
                    - contract resolver        <-- winning 20%
                    - PDF + email service
                             |
                        Prisma ORM
                             |
                    Postgres (Docker)
```

- **Frontend:** React + Vite + TS + Tailwind + shadcn + TanStack Query/Table + RHF/Zod + Recharts. Already scaffolded in `starter/`.
- **Backend:** Node + Express + Prisma. Postgres in Docker (wifi-safe at venue).
- **Swap point:** `starter/src/lib/api.ts` is the only file that changes when the mock layer becomes real `fetch()` calls. TanStack Query pages don't care where data comes from.
- **PDF:** server-side (e.g. `pdfkit` or Puppeteer-to-PDF). **Email:** Nodemailer + Ethereal/Mailtrap for demo (no real SMTP needed).

Why this split: judges are Odoo (a hiring funnel) and reward real engineering. A genuine backend with RBAC, parent-child relations, and a compute engine reads as production thinking, not a demo hack.

---

## 2. Data model (Prisma-shaped)

Central hub = `Employee`. Arrows are foreign keys.

```
User ──1:1── Employee
Employee ──1:N── Contract          (only one active per period)
Employee ──N:1── Department
Employee ──N:1── WorkingSchedule   (also settable per Contract)
Employee ──N:1── Employee (manager, self-relation)
Employee ──1:N── Attendance
Employee ──1:N── TimeOffRequest
Employee ──1:N── Allocation
Employee ──1:N── Payslip

WorkingSchedule ──1:N── ScheduleLine   (day, start, end, break)

TimeOffType ──1:N── TimeOffRequest
TimeOffType ──1:N── Allocation

SalaryStructure ──N:M── SalaryRule (ordered via sequence)
SalaryStructure ──1:N── Payrun

Payrun ──1:N── Payslip
Payslip ──1:N── PayslipLine   (one line per rule that fired)
Contract ──N:1── SalaryStructure
Payslip ──N:1── Contract      (the resolved period contract)
```

### Core entities + key fields

| Entity | Key fields | Notes |
|---|---|---|
| **User** | email, passwordHash, role | role drives RBAC. 1:1 to Employee. |
| **Employee** | name, workEmail, jobPosition, departmentId, managerId, scheduleId, status | Kanban + List + Form. Central hub. |
| **Department** | name | filter dimension for dashboard. |
| **Contract** | employeeId, startDate, endDate, wage, structureId, status | `status: draft/running/expired`. Only one `running` per employee per date range. |
| **WorkingSchedule** | name, calendarType, company, status | weeklyHours **derived** from ScheduleLines, not stored raw. |
| **ScheduleLine** | scheduleId, dayOfWeek, startTime, endTime, breakMinutes | weekly pattern. |
| **Attendance** | employeeId, checkIn, checkOut, workedHours, status | workedHours derived; status: present/late/absent/overtime. Manual correction allowed for authorized roles. |
| **TimeOffType** | name, unit(days/hours), requiresAllocation, approvalRequired | policy rules. |
| **Allocation** | employeeId, typeId, amount, validFrom, validTo, status | approved allocations grant balance. |
| **TimeOffRequest** | employeeId, typeId, startDate, endDate, duration, status | approved consumes balance (if type requires allocation). |
| **SalaryStructure** | name, status | container of rules. e.g. "Regular Salary". |
| **SalaryRule** | name, code, category, sequence, computeType, amount/percentBase/pythonExpr | the engine's instructions. |
| **Payrun** | name, structureId, periodStart, periodEnd, status | status: draft/computed/validated/paid. |
| **Payslip** | payrunId, employeeId, contractId, periodStart, periodEnd, workedDays, status | one per employee per run. |
| **PayslipLine** | payslipId, ruleCode, ruleName, category, amount | audit trail of computation. This is what proves the logic is real. |

Categories (enum): `BASIC, ALLOWANCE, GROSS, DEDUCTION, NET`.
Compute types (enum): `FIXED, PERCENTAGE, FORMULA`.

---

## 3. The three winning engines

### 3.1 Salary computation engine

Input: a Payslip context = { contract, workedDays, attendance, leave, structure.rules }.

Algorithm:
```
sort rules by sequence
categories = {}          // running totals by category, e.g. categories['BASIC']
lines = []
for rule in rules:
    switch rule.computeType:
        FIXED:      amount = rule.amount
        PERCENTAGE: amount = rule.percent * base(rule.percentBase, categories, contract)
        FORMULA:    amount = evalFormula(rule.expr, { categories, contract, attendance, leave })
    lines.push({ ruleCode, category, amount })
    categories[rule.category] = (categories[rule.category] || 0) + amount
net = categories['GROSS'] - categories['DEDUCTION']   // per structure design
return { lines, gross, deductions, net }
```

Key points that impress:
- **Sequence matters** - HRA (20% of Basic) must run after Basic. Deductions run after Gross.
- `base()` resolves `Contract Wage / Basic Salary / Gross Salary` from running totals.
- `FORMULA` supports attendance-based pay, overtime, unpaid-leave deductions. Use a **safe sandboxed evaluator** (a tiny whitelisted expression parser), NOT raw `eval`, and never on client. Example expr from source: `result = categories['BASIC']`.
- Every fired rule writes a `PayslipLine` -> the payslip breakdown is real data, not hardcoded.

### 3.2 Period-based contract resolution

When a Payrun computes for period `[start, end]`, per employee:
```
contract = employee.contracts.find(c =>
    c.status == 'running' AND c.startDate <= period.end AND (c.endDate == null OR c.endDate >= period.start))
```
- Exactly one must match. Zero -> warning "no active contract". Two -> warning "concurrent contracts" (data error).
- Payslip stores the resolved `contractId` so history is auditable.

### 3.3 Leave balance ledger

Balance is **computed**, not stored:
```
balance(employee, type) =
    sum(approved allocations of type, valid in period)
  - sum(approved requests of type that requiresAllocation)
```
- On request approval: if `type.requiresAllocation` and `balance < duration` -> block/warn.
- Types without allocation (e.g. unpaid) don't touch balance.
- Dashboard "leave patterns" reads this.

---

## 4. Payrun workflow (two-step wizard -> processing)

```
NEW ─> Wizard Step 1: pick Salary Structure + Period   (no record yet)
     ─> Continue ─> Step 2: filter eligible employees, user selects
     ─> Create Payrun ─> batch created with selected employees only
     ─> Processing screen: [Compute] [Validate] [Mark Paid] [Send Payslips]
```

State machine: `draft -> computed -> validated -> paid`.
- **Compute**: runs engine per employee, generates/updates Payslips + Lines. Surfaces warnings (missing bank A/C, duplicate payslip, no contract).
- **Validate**: locks numbers after warnings reviewed.
- **Mark Paid**: terminal, becomes historical record.
- **Send Payslips**: bulk email PDF to each employee.
- **Print Payslip**: per-payslip PDF.

---

## 5. RBAC (roles map straight from PS section 3)

| Role | Employees/Attendance/Contracts/Schedules/TimeOff | Payruns/Payslips | Salary Struct/Rules | Admin |
|---|---|---|---|---|
| **Employee** | read own + create own attendance/requests | none | none | none |
| **HR Manager** | full CRUD + approve/refuse requests | none | none | none |
| **HR Payroll User** | full CRUD | CRU | read-only | none |
| **HR Payroll Manager** | full CRUD | full CRUD | full CRUD | none |
| **Admin** | full | full | full | user mgmt, roles |

Enforce on the **server** (Express middleware per route), not just by hiding UI. Frontend hides disallowed modules/actions after login based on role. Hiding-only = insta-fail on judge quiz.

---

## 6. Dashboard (live data, PS section B9)

Recharts + KPI cards, all from real DB queries, filterable by Period / Department / Employee type.

- **KPI cards:** Total Net Salary Paid, Payslips Generated, Avg Salary, Approved Time Off, Attendance Health.
- **Charts:** Salary Cost by Department (bar), Monthly Net Salary Trend (line).
- **Alerts:** payroll statuses, missing required info, duplicate payslips, contract attention.
- **Overviews:** Attendance (present/late/absent/overtime/missing check-outs), Time Off (pending/approved/balances), Department (headcount + salary spend).

Must aggregate across Employee, Contract, Payroll, Attendance, Time Off. No static charts - the PS calls this out explicitly.

---

## 7. Build order (3 people, event-day)

Cut scope before cutting sleep. Ship the vertical slice first, polish later.

**Phase 0 (together, ~1hr):** Prisma schema for all entities + seed data. This unblocks everyone. Agree on the API contract in `api.ts` shape.

**P1 - Backend + engines (owns the winning 20%)**
- Prisma schema + migrations + seed.
- Auth + RBAC middleware.
- Salary computation engine + contract resolver + leave ledger.
- Payrun state machine + PDF/email.

**P2 - Frontend core (owns the 80% CRUD)**
- Employee Kanban/List/Form (central hub + smart buttons).
- Contract, WorkingSchedule, Attendance, TimeOff CRUD (List/Form) via starter primitives.
- Wire `api.ts` from mock to real fetch as P1 lands routes.

**P3 - Payroll UI + Dashboard + demo (owns the wow)**
- Payrun wizard + processing screen + payslip computation view.
- Payslip PDF preview, Send Payslips.
- Dashboard KPIs + charts from live endpoints.
- Owns the 5-min demo script + seed data that tells a story.

Integration seam = the `api.ts` contract. Agree field names Phase 0 so P2/P3 don't block on P1.

---

## 8. Demo script (PS wants two end-to-end scenarios, 5 min)

1. **Employee -> Payslip:** open employee (hub) -> show running contract -> create Payrun (wizard: structure + period) -> select employee -> Compute -> show payslip breakdown lines (Basic, HRA %, deductions, Net) -> Validate -> Print PDF -> Send.
2. **Allocation -> Request:** grant allocation (approve) -> employee files leave request -> approve -> show balance dropped -> show it reflected on dashboard.

Rehearse until it's 5 min flat. A clean two-scenario walkthrough beats ten half-features.

---

## 9. Scope guardrails (what to CUT if behind)

Keep: employee hub, one working contract, salary engine with 4-6 rules, one Payrun end-to-end, PDF, leave ledger, dashboard with 3 KPIs + 1 chart, RBAC for 3 roles.
Cut first: bulk email (fake it with a toast), overtime formulas, Kanban (List is enough), all 5 roles (do 3), attendance corrections UI, monthly trend chart.

The engine and the two demo scenarios are non-negotiable. Everything else is negotiable.

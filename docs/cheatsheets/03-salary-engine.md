# Cheat-sheet: Slice 3 - Salary Structure + Rules + Computation Engine (THE WIN)

This is the slice judges dig into. Everything else is CRUD; this is real logic. Know it cold. 10-min read.

## The one-line pitch
Salary math isn't hardcoded. Rules live in the database (ordered). The engine runs them in sequence, accumulates category totals, and emits one audit line per rule. Adding a new allowance = adding a row, not editing code.

## Why data-driven beats hardcoded (the differentiator)
A weak team writes `net = wage*0.5 + ... - pf`. It demos fine, then dies when a judge says "add a bonus rule" or "different rules for interns." Our version: the structure is a list of rules in the DB; point a contract at a structure; the engine computes. New rule = insert row. That flexibility is the engineering they're grading - same numbers, very different answer to "now change it."

## The data model
- **SalaryStructure** - a named bundle of rules (e.g. "Regular Salary"). A contract points to one.
- **SalaryRule** - `code`, `category`, `sequence`, `computeType`, and type-specific fields. Ordered by `sequence`.
- **PayslipLine** - the output: one row per rule, the audit trail (Slice 4 saves these; Slice 3 previews them).

## Rule categories (the buckets the engine sums)
BASIC, ALLOWANCE, GROSS, DEDUCTION, NET. The engine keeps a running total per category as it goes, so later rules can reference earlier ones.

## The 3 compute types
- **FIXED** - a flat amount (e.g. Meal Allowance = 2000).
- **PERCENTAGE** - `percent` of a `percentBase`. Base is either `CONTRACT_WAGE` or a running category total (BASIC/ALLOWANCE/GROSS/DEDUCTION). E.g. HRA = 20% of BASIC.
- **FORMULA** - an expression over `categories[...]`. E.g. GROSS = `categories['BASIC'] + categories['ALLOWANCE']`; NET = `categories['GROSS'] - categories['DEDUCTION']`.

## How the engine works (`services/payslip.engine.ts`)
1. Sort rules by `sequence`.
2. Init category totals to 0.
3. For each rule: compute its amount by type, round to 2dp, add to its category bucket (BASIC/ALLOWANCE/DEDUCTION accumulate; GROSS/NET are set, not accumulated, since they're totals), push a line.
4. Return lines + category totals + gross/deductions/net.

Order matters: BASIC must run before HRA (HRA is % of BASIC); GROSS before deductions reference it; NET last. `sequence` enforces that.

## The formula safety (judges WILL ask "injection?")
FORMULA uses `new Function`, but the expression is first checked against a whitelist regex: only digits, arithmetic `+ - * / ( )`, and `categories['UPPER_CASE']` are allowed. Anything else - `process`, function calls, property access like `.toString()` - fails with "Unsafe salary formula". So payroll config can write formulas without being able to run arbitrary code. Two unit tests prove the guard blocks `process.exit(1)` and `.toString()`.

## Worked example (seed "Regular Salary", wage 50000)
| Seq | Code | Type | Calc | Amount |
|-----|------|------|------|--------|
| 10 | BASIC | % of CONTRACT_WAGE | 50% x 50000 | 25000 |
| 20 | HRA | % of BASIC | 20% x 25000 | 5000 |
| 30 | MEAL | FIXED | - | 2000 |
| 40 | GROSS | FORMULA | BASIC + ALLOWANCE | 32000 |
| 50 | PF | % of BASIC | 12% x 25000 | 3000 |
| 60 | PT | FIXED | - | 200 |
| 70 | NET | FORMULA | GROSS - DEDUCTION | 28800 |

Gross 32000, Deductions 3200, **Net 28800**.

## Tests (the first real unit tests - `payslip.engine.test.ts`)
Why here and nowhere else: the engine is pure logic (input -> output, no DB, no HTTP) with high blast radius - a bug here corrupts every payslip. CRUD you can eyeball; math you must prove. 7 tests: known net, order-independence, each compute type, rounding, and 2 injection guards. Run: `npm test`.

## Backend files
- `services/payslip.engine.ts` - the pure engine (+ `.test.ts`)
- `services/salaryStructure.service.ts` - structure/rule CRUD + `previewForContract` + `previewForEmployeePeriod` (resolver -> engine)
- `validators/salaryStructure.validator.ts` - Zod; enforces per-type required fields
- `routes/salaryStructure.routes.ts` - config writes = PAYROLL_CONFIG_ROLES only; preview + reads = any logged-in

## Frontend files
- `lib/salary.api.ts` - typed calls
- `pages/salary-structures.tsx` - list + create structure
- `pages/salary-structure-detail.tsx` - ordered rules table + add/edit/delete
- `pages/salary-rule-form-dialog.tsx` - rule editor; fields change with compute type
- `pages/payslip-preview-dialog.tsx` - runs the engine live, shows the breakdown (the demo money shot; opened from a contract row)

## RBAC note
Salary config (structures/rules) = `PAYROLL_CONFIG_ROLES` (HR_PAYROLL_MANAGER, ADMIN) only. Even a plain HR_MANAGER gets 403 - payroll config is more sensitive than employee edits. Reads/preview = any logged-in user.

## Likely judge questions + answers
- **"Add a new allowance without code change?"** -> Add a SalaryRule row (code, category ALLOWANCE, sequence, amount/percent). Engine picks it up next compute. Zero deploy.
- **"How do rules know their order?"** -> `sequence`. Engine sorts by it, so a % rule can depend on a category an earlier rule filled.
- **"Is the FORMULA an injection risk?"** -> No. Whitelist regex allows only `categories[...]` + arithmetic; anything else throws. Two tests prove it.
- **"Where's the audit trail?"** -> Each rule emits a PayslipLine (code, name, category, amount). The payslip is the sum of its lines, each traceable to a rule.
- **"Why not compute in SQL / a stored proc?"** -> Ordered, category-dependent, formula rules are procedural; a typed engine is testable and portable. We unit-test it in isolation.
- **"Two employees, different pay logic?"** -> Different structures. Contract points to the structure that applies.

## Try it (curl)
```
# login as payroll@oxp.com, grab token + Aarav's employee id

# preview via the running contract for a period (resolver -> engine)
curl "localhost:4000/api/salary-structures/preview?employeeId=<EMP>&periodStart=2026-06-01&periodEnd=2026-06-30" \
  -H "Authorization: Bearer <TOKEN>"

# run the engine unit tests
cd backend && npm test
```

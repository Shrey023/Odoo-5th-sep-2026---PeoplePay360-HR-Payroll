# Cheat-sheet: Slice 2 - Contracts + period resolver

Contracts sit between an employee and payroll. Payroll never reads the employee's wage directly - it reads the *contract* that was running during the pay period. 5-min read.

## What this slice delivers
- Contract CRUD, scoped to an employee (shown on the employee detail page).
- A guard: an employee can't have two RUNNING contracts covering overlapping dates.
- A period resolver: given an employee + a date range, return the one running contract that covers it. This is what the payrun engine will call.

## Why contracts exist (the mental model)
An employee's pay can change over time (raise, promotion, new terms). Instead of editing one wage field, you create a new contract. Each contract has a wage, a period (start/end), and a status. Payroll for June looks up "which contract was RUNNING in June" and uses that wage. This gives an audit trail - old contracts stay as history.

## Contract status
- **DRAFT** - being prepared, not active. No guard, doesn't count for payroll.
- **RUNNING** - active. Only one can cover a given period (the guard).
- **EXPIRED** - past/ended. Kept for history.

## The overlap guard (gap #13)
On create/update, if the target status is RUNNING we fetch the employee's other RUNNING contracts and check date overlap. Overlap rule: `aStart <= bEnd && bStart <= aEnd`, treating a null end date as "open forever" (Infinity). If any clash, reject with **409** and name the conflicting reference.

Why: two running contracts in the same month would make payroll ambiguous - which wage? The guard makes "one wage per period" a database-level truth, not a hope.

## The period resolver
`resolveForPeriod(employeeId, periodStart, periodEnd)` returns the single RUNNING contract overlapping that window, or throws **422** if none. Payrun (Slice 4) calls this per employee to know the wage to compute against. Exposed for testing at `GET /contracts/resolve?employeeId=&periodStart=&periodEnd=`.

## Backend files (route -> controller -> service -> validator)
- `routes/contract.routes.ts` - GET list/one/resolve (any logged-in), POST/PATCH/DELETE (HR only)
- `services/contract.service.ts` - CRUD + `assertNoRunningOverlap` (the guard) + `resolveForPeriod`
- `validators/contract.validator.ts` - Zod; also checks endDate >= startDate

## Frontend files
- `lib/contracts.api.ts` - typed calls
- `pages/contract-form-dialog.tsx` - create/edit form (RHF + Zod)
- `pages/employee-detail.tsx` - Contracts table with status badges + New/Edit/Delete (HR only)

## Likely judge questions + answers
- **"Why a separate Contract table instead of a wage on Employee?"** -> Pay changes over time and payroll needs history. The contract carries the wage + period; payroll resolves the contract for the period, so old pay terms stay auditable.
- **"What stops two active contracts at once?"** -> The overlap guard: creating/promoting a RUNNING contract that overlaps another running one returns 409.
- **"How does a payrun know which wage to use?"** -> It calls `resolveForPeriod` with the pay period; that returns the one running contract covering those dates.
- **"What if the contract has no end date?"** -> Treated as open-ended (covers any date on/after start). The overlap math uses Infinity for a null end.

## Try it (curl)
```
# login, grab token + an employee id first (see slice 1 sheet)

# list an employee's contracts
curl "localhost:4000/api/contracts?employeeId=<EMP>" -H "Authorization: Bearer <TOKEN>"

# resolve the running contract for June 2026
curl "localhost:4000/api/contracts/resolve?employeeId=<EMP>&periodStart=2026-06-01&periodEnd=2026-06-30" \
  -H "Authorization: Bearer <TOKEN>"

# try a 2nd overlapping RUNNING -> 409
curl -X POST localhost:4000/api/contracts -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"employeeId":"<EMP>","startDate":"2026-03-01","endDate":"2026-09-30","wage":50000,"status":"RUNNING"}'
```

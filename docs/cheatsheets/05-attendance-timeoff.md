# Cheat-sheet: Slice 5 - Attendance + Time Off + Leave Ledger

The people-operations side: who's present, and who's on leave. The interesting bit is the leave balance ledger - it's derived, never stored. 8-min read.

## What this slice delivers
- **Attendance** - check-in/check-out records; worked hours derived from the times.
- **Time Off Types** - the leave categories (Annual, Unpaid, Sick...), each with flags.
- **Allocations** - granting leave to an employee (approve to make it count).
- **Requests** - taking leave (approve to consume the balance).
- **Balance ledger** - Allocated / Taken / Remaining, computed on the fly.
- **Working schedule recompute** - weekly hours + days/week derived from schedule lines, never typed by hand.

## The leave model (mental picture)
Two sides of an account:
- An **Allocation** is a credit: "grant Aarav 20 annual days." Counts only when APPROVED.
- A **Request** is a debit: "Aarav takes 2 days." Counts only when APPROVED, and only if the type `requiresAllocation`.
- **Balance = sum(approved allocations) - sum(approved requests)**, per employee per type.

We never store a "balance" column. It's always recomputed from the approved rows. Why: a stored balance can drift out of sync with the records; a derived one is always correct by construction. This is the ledger idea - the truth is the transactions, the balance is a view.

## Type flags (why they matter)
- `requiresAllocation` - if true, a request debits the balance (Annual). If false, no balance needed (Unpaid - you can always take it).
- `approvalRequired` - if true, a new request starts TO_APPROVE; if false, it's auto-APPROVED on creation.

So the same request flow behaves differently per type, driven by data, not branches in code.

## Approval flow + the balance guard
- Allocation: DRAFT -> APPROVED / REFUSED. Only a DRAFT can be decided.
- Request: (DRAFT/TO_APPROVE) -> APPROVED / REFUSED. Already-decided requests can't be re-decided (409).
- **The guard:** approving a request that `requiresAllocation` checks the remaining balance first. Over-balance -> **422** with how much is left vs requested. You can't approve leave someone hasn't got.

## Attendance (`attendance.service.ts`)
Worked hours are computed from checkIn/checkOut (ms diff / 3.6M, 2dp), not entered. Still checked in (no checkOut) = 0 hours. Records are marked `manualEdit` when created/edited via the API (vs an automated punch), matching the schema's audit flag.

## Working schedule recompute (`schedule.service.ts`) - gaps #17/#19
The PS says weekly hours must be **derived** from the schedule, not typed. So `upsertLines` replaces a schedule's lines and recomputes:
- `daysPerWeek` = number of lines
- `weeklyHours` = sum over lines of (end - start - break) / 60

Example: 5 lines of 09:00-17:00 with 60-min break = 5 x 7h = **35h**, 5 days. Verified by curl. This closes the "don't let users hand-enter weekly hours" requirement.

## Backend files
- `services/leave.service.ts` - types + allocations + requests + `getBalances` (the ledger)
- `services/attendance.service.ts` - attendance CRUD + hours derivation
- `services/schedule.service.ts` - `upsertLines` + weekly-hours recompute
- `validators/leave.validator.ts`, `attendance.validator.ts`, `schedule.validator.ts`
- routes: `time-off.routes` (`/time-off/...`), `attendance.routes`, `schedule.routes`

## Frontend files
- `lib/timeoff.api.ts` - typed calls (leave + attendance)
- `pages/time-off.tsx` - one page, three tabs (Requests / Allocations / Types) per PS "Time Off" grouping; inline approve/reject
- `pages/request-form-dialog.tsx`, `allocation-form-dialog.tsx`, `time-off-type-dialog.tsx`
- `pages/employee-detail.tsx` - now shows Leave Balances + Attendance for the employee

## RBAC
Time off + attendance writes and approvals = `HR_ROLES`. An employee gets 403 trying to approve (verified). (In a fuller build, employees would self-submit requests; kept HR-gated here for demo simplicity - worth mentioning as a known simplification.)

## Likely judge questions + answers
- **"Where's the leave balance stored?"** -> Nowhere. It's derived: approved allocations minus approved requests, per type. The records are the source of truth.
- **"What stops someone taking more leave than they have?"** -> On approval, if the type requires allocation, we check remaining balance; over-balance returns 422.
- **"Why do some leave types not need a balance?"** -> The `requiresAllocation` flag. Unpaid leave doesn't draw down anything, so no balance check.
- **"How are weekly hours calculated?"** -> Derived from schedule lines (sum of worked minutes minus breaks). Users can't type them, so they can't drift from the actual schedule.
- **"How are worked hours on attendance computed?"** -> From check-in to check-out; still checked-in = 0.

## Try it (curl)
```
# login payroll@oxp.com, get token + Aarav's id

# balances (seed: Annual 20 granted - 2 taken = 18)
curl localhost:4000/api/time-off/balances/<EMP> -H "Authorization: Bearer <T>"

# request 5 days, then approve -> balance drops to 13
curl -X POST localhost:4000/api/time-off/requests -H "Authorization: Bearer <T>" -H 'Content-Type: application/json' \
  -d '{"employeeId":"<EMP>","typeId":"<ANNUAL>","startDate":"2026-08-01","endDate":"2026-08-05","duration":5}'
curl -X POST localhost:4000/api/time-off/requests/<RID>/decide -H "Authorization: Bearer <T>" \
  -H 'Content-Type: application/json' -d '{"status":"APPROVED"}'

# recompute a schedule -> weeklyHours derived
curl -X PUT localhost:4000/api/schedules/<SID>/lines -H "Authorization: Bearer <T>" -H 'Content-Type: application/json' \
  -d '{"lines":[{"dayOfWeek":1,"startTime":"09:00","endTime":"17:00"}]}'
```

# Cheat-sheet: Slice 4 - Payrun + Payslip + PDF + Email

This is where everything connects: a payrun resolves each employee's contract, runs the engine, saves real payslips, and can email PDFs. 8-min read.

## What this slice delivers
- A payrun with a **state machine**: DRAFT -> COMPUTED -> VALIDATED -> PAID.
- Compute = for every in-scope employee, find the running contract for the period, run the salary engine, save a Payslip + its PayslipLines - all in one transaction.
- Warnings before finalizing (e.g. employee with no bank account).
- PDF per payslip (pdfkit) and bulk email (nodemailer, dev sandbox).

## The state machine (and why)
- **DRAFT** - just the scope (name, structure, period, optional employee type). No payslips yet. Editable.
- **COMPUTED** - engine has run; payslips exist. Can recompute (wipes + regenerates).
- **VALIDATED** - locked in; payslips marked validated. This is the "approved" gate.
- **PAID** - marked as paid out.

Each transition is guarded server-side: you can't validate a DRAFT (409), can't pay before validate (409), can't delete a PAID run (409), can't email before validate (409). This mirrors real payroll approval flow - you don't email draft numbers or pay unapproved runs.

## Compute - the core (`payrun.service.ts` `compute`)
1. Load the structure's rules (ordered).
2. Find in-scope employees (ACTIVE, optionally filtered by employee type).
3. For each: query the RUNNING contract overlapping the period. **No contract -> skip** (collected in `skipped`, not a crash).
4. Run `computePayslip(wage, rules)` (the Slice 3 engine).
5. In one `$transaction`: delete old payslips for this run, create new Payslip + PayslipLine rows, set status COMPUTED.

Why a transaction: computing 50 payslips must be all-or-nothing. If employee #30 errors, we don't want a half-saved payrun. Atomicity = correctness for money.

## Warnings (surfaced before validate)
`buildWarnings` scans the payslips for issues a human should see first - currently: employee has no bank account (Neha in the seed). Shown as a banner on the payrun page. The point: catch problems before you validate/pay, not after.

## Idempotent recompute
Recompute deletes existing payslips first, then regenerates. So hitting Compute twice doesn't duplicate. The `@@unique([payrunId, employeeId])` DB constraint is the backstop.

## PDF (`payslip.pdf.ts`)
pdfkit builds the doc in memory and returns a Buffer (no temp files). Header, employee + period, one row per line, then Gross / Deductions / Net. Served with `Content-Type: application/pdf` + a download filename. Frontend fetches it with the auth header (can't use a plain link - the token lives in localStorage), so `downloadFile` in http.ts does an authed fetch -> blob -> download.

## Email (`mailer.ts`)
nodemailer with an **Ethereal** test account - a sandbox SMTP. Nothing reaches real inboxes; each send returns a **preview URL** you open to see the message + attachment. This is deliberate: no SMTP secrets, no spamming real people at a demo, still fully demonstrable. `sendPayslips` loops the run's payslips, generates each PDF, and mails it to the employee's work email. Swapping to real SMTP later = change one transporter config.

## Backend files
- `services/payrun.service.ts` - state machine + compute + validate + markPaid + sendPayslips + buildWarnings
- `services/payslip.pdf.ts` - pdfkit -> Buffer
- `services/mailer.ts` - nodemailer Ethereal transporter
- `validators/payrun.validator.ts` - Zod
- `routes/payrun.routes.ts` - reads + PDF = any logged-in; writes/transitions/send = PAYROLL_WRITE_ROLES

## Frontend files
- `lib/payruns.api.ts` - typed calls
- `pages/payruns.tsx` - list
- `pages/payrun-create-dialog.tsx` - 2-step wizard (details -> review)
- `pages/payrun-detail.tsx` - status-driven action bar, warnings banner, payslip table (with per-row PDF), send button
- `lib/http.ts` - `downloadFile` (authed blob download)

## RBAC
Payroll runs = `PAYROLL_WRITE_ROLES` (HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN). A plain HR_MANAGER can manage employees but **cannot** run payroll (403). Reads/PDF = any logged-in user.

## Likely judge questions + answers
- **"What if two people run compute at once / twice?"** -> Recompute deletes then recreates inside a transaction; the unique(payrunId, employeeId) constraint prevents duplicate payslips.
- **"Employee has no contract for the period?"** -> Skipped, not failed. Returned in `skipped` so the user knows who was left out.
- **"Why a state machine, not a boolean?"** -> Payroll is an approval workflow. Each stage gates the next (can't email drafts, can't pay unvalidated). The guards enforce that server-side.
- **"Is the email real?"** -> Dev sandbox (Ethereal) - returns a preview link, nothing leaves. Production = swap the transporter. Chosen so we don't ship SMTP secrets or spam at a demo.
- **"Where's the payslip breakdown stored?"** -> PayslipLine rows, one per rule, copied at compute time. The payslip is a snapshot - even if a rule changes later, the historical payslip stays as computed.
- **"Why generate the PDF on the fly vs storing it?"** -> The data (lines) is the source of truth; the PDF is a view. Regenerate any time; nothing to keep in sync.

## Try it (curl)
```
# login payroll@oxp.com, get token + a structure id
curl -X POST localhost:4000/api/payruns -H "Authorization: Bearer <T>" -H 'Content-Type: application/json' \
  -d '{"name":"June 2026","structureId":"<SID>","periodStart":"2026-06-01","periodEnd":"2026-06-30"}'
curl -X POST localhost:4000/api/payruns/<PID>/compute  -H "Authorization: Bearer <T>"
curl -X POST localhost:4000/api/payruns/<PID>/validate -H "Authorization: Bearer <T>"
curl -X POST localhost:4000/api/payruns/<PID>/pay      -H "Authorization: Bearer <T>"
curl -X POST localhost:4000/api/payruns/<PID>/send     -H "Authorization: Bearer <T>"   # returns Ethereal preview URLs
curl -o slip.pdf localhost:4000/api/payruns/payslips/<PSID>/pdf -H "Authorization: Bearer <T>"
```

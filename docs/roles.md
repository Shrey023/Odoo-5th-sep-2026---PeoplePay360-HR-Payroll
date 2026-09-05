# Roles (RBAC)

5 roles from `UserRole` enum (`backend/prisma/schema.prisma`). A user can hold **one or more** roles (`roles UserRole[]`). Access is enforced **server-side** in `authorize(...)` (`backend/src/middleware/rbac.middleware.ts`), not just hidden in the UI - the middleware 403s any role not in the route's allow-list.

Roles are additive: each row below can also do everything the rows above it can.

| Role | Can do | Seed login |
|---|---|---|
| `EMPLOYEE` | Read-only self stuff (view own payslips, own data). No write access. | aarav@oxp.com |
| `HR_MANAGER` | Manage employees, contracts, time off, attendance, schedules. **Cannot** run payruns or edit salary config. | hr@oxp.com |
| `HR_PAYROLL_USER` | Everything HR_MANAGER can, **plus** run payruns (compute / validate / mark paid / send). **Cannot** edit salary structures/rules. | *(not seeded)* |
| `HR_PAYROLL_MANAGER` | Everything HR_PAYROLL_USER can, **plus** create/edit salary structures and rules (payroll config). | payroll@oxp.com |
| `ADMIN` | All of the above. Full access. | admin@oxp.com |

All seed logins use password `password123`.

## Role bundles (how the table maps to code)

Routes reference these bundles, not individual roles:

| Bundle | Members | Guards |
|---|---|---|
| `HR_ROLES` | HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN | Employee/contract/time-off/attendance/schedule **writes** |
| `PAYROLL_WRITE_ROLES` | HR_PAYROLL_USER, HR_PAYROLL_MANAGER, ADMIN | Payrun create + state transitions (compute/validate/pay/send) |
| `PAYROLL_CONFIG_ROLES` | HR_PAYROLL_MANAGER, ADMIN | Salary structure + rule writes (stricter than HR) |

Reads (GET) are open to any authenticated user; the guards above apply to writes/actions. `EMPLOYEE` is in **no** bundle, so it hits 403 on every guarded write.

## Notes
- Only 4 of the 5 roles have a seed login. `HR_PAYROLL_USER` exists in the enum + bundles but no seed user - add one if a demo needs the "payroll user but not config" distinction (HR_PAYROLL_MANAGER already covers the superset).
- Salary config is intentionally **stricter** than general HR: an HR_MANAGER gets 403 editing salary rules (verified in Slice 3).

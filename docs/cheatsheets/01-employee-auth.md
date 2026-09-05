# Cheat-sheet: Slice 1 - Auth + Employee CRUD

What login does + how the Employee module (the hub) works. 5-min read.

## What this slice delivers
- Real login/register with JWT tokens (no more mock).
- Employee module: Kanban + List views, search, create/edit/delete, and a detail page (the hub with smart-button counts).
- Server-side role checks (only HR roles can create/edit/delete employees).

## The request flow (frontend -> backend)
1. User logs in -> backend checks password (bcrypt), returns a JWT.
2. Frontend stores the token, sends it on every request as `Authorization: Bearer <token>`.
3. `authenticate` middleware verifies the token, loads the user.
4. For write actions, `authorize(...HR_ROLES)` checks the user's roles.
5. Controller validates the body (Zod) -> service does the DB work (Prisma) -> response.

## Backend files (layered: route -> controller -> service)
- `routes/auth.routes.ts` - /login, /register, /me
- `routes/employee.routes.ts` - GET list/one (any logged-in user), POST/PATCH/DELETE (HR only)
- `services/employee.service.ts` - the actual DB queries; `getById` also returns smart-button counts
- `validators/employee.validator.ts` - Zod schemas (what a valid employee looks like)

## Frontend files
- `lib/http.ts` - fetch wrapper; attaches the token, throws on error
- `lib/auth.tsx` - login/logout/me + `hasRole()` for hiding UI
- `lib/employees.api.ts` - typed calls to the employee endpoints
- `pages/employees.tsx` - Kanban/List toggle + search + New button (New only shows for HR)
- `pages/employee-detail.tsx` - the hub: profile + smart-button counts (Contracts/Attendance/Time Off/Allocations)
- `pages/employee-form-dialog.tsx` - create/edit form (RHF + Zod)

## Why it's built this way (if asked)
- **Kanban + List both open the same data** - the PS requires both views; clicking either goes to the same detail page.
- **Smart-button counts** - the employee form is the central hub; counts come from one endpoint (`getById`) that runs 4 count queries.
- **RBAC on the server** - the New/Edit buttons are hidden in the UI for non-HR, but the real block is server-side middleware. Hiding alone isn't security.
- **Search is server-side** - the list endpoint takes a `search` param and does a case-insensitive match on name/email/position.

## Likely judge questions + answers
- **"What stops an employee from editing other employees?"** -> The write routes require an HR role; `authorize` middleware rejects others with 403. UI also hides the buttons.
- **"How does the hub know how many contracts an employee has?"** -> The detail endpoint runs count queries per related table and returns them as `counts`.
- **"Where does the token come from and how is it checked?"** -> Issued on login (signed JWT), sent as a Bearer header, verified by `authenticate` middleware on every protected route.

## Try it (curl)
```
# login -> copy the token
curl -X POST localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"payroll@oxp.com","password":"password123"}'

# list employees
curl localhost:4000/api/employees -H "Authorization: Bearer <TOKEN>"
```

Demo logins (all password `password123`): admin@oxp.com, payroll@oxp.com, hr@oxp.com, aarav@oxp.com

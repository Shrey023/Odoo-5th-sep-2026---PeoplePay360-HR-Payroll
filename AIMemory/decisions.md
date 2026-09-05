# Locked Decisions

Do not re-litigate. Each has a reason. Add new ones with date + why.

| Date | Decision | Why |
|------|----------|-----|
| 2026-09-01 | Frontend = React + Vite + TS + Tailwind + shadcn/ui | Biggest ecosystem, most sample code + AI help, shadcn kills UI boilerplate. Vite over Next.js = no SSR overhead for a demo SPA. |
| 2026-09-01 | Backend = Postgres(Docker)+Node/Express+Prisma if backend-confident; else Supabase-local | 4 people = enough hands for real backend, which impresses Odoo hiring judges. Supabase IS Postgres, so not either/or. Prisma kills raw-SQL boilerplate. |
| 2026-09-01 | DB runs in Docker | Offline/wifi-safe at venue. Venue wifi dies - real risk. |
| 2026-09-01 | Deploy = Vercel (front) + Render/Railway (back) | Free tier, one-click, live URL for demo. |
| 2026-09-01 | Pre-build a PS-agnostic starter kit before event | ~80% of any PS is the same CRUD skeleton. Pre-building it = event day spent on the winning 20%. Allowed since generic/PS-agnostic. |
| 2026-09-01 | Memory system = AGENTS.md (source of truth) + AIMemory/ (agent-work-mem style, markdown) | Zero install, git-native, works across Claude Code/OpenCode/Cursor. MCP memory servers (Cognee/agentmemory) need setup time we don't have in 24hr. |
| 2026-09-01 | Simplicity over ambition | Clean finished simple app beats broken ambitious one. Judges + hiring value polish + you being able to explain it. |
| 2026-09-05 | Team is 3 people (was 4) | One member dropped. Cut scope harder, fewer parallel tracks. |
| 2026-09-05 | Backend LOCKED = Node + Express + TS + Prisma + Postgres(Docker) | PS (PeoplePay360) rewards real business logic. Salary engine is custom code either way; Supabase forces Edge Functions + RLS for the hard parts = more friction + harder to explain live. Express = trivial boilerplate, custom logic in plain TS we own + can defend to judges. |
| 2026-09-05 | Support libs: bcrypt+JWT (auth), pdfkit (payslip PDF), Nodemailer+Mailtrap (fake email for demo), Zod shared front+back | All free, lightweight, explainable. pdfkit over Puppeteer = no chromium weight. |
| 2026-09-05 | Build approach = vertical slice first, risk-first | Nail employee->payrun->payslip end-to-end + demoable before widening. Build salary engine while fresh (riskiest part). See SYSTEM_DESIGN.md. |

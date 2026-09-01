# AGENTS.md - Single Source of Truth

This is the ONE instruction file every AI tool reads (Claude Code, OpenCode, Cursor, Codex, etc).
`CLAUDE.md` just imports this. Humans edit only this file. No drift.

## Read this first, every session

1. Read `AIMemory/INDEX.md` and `AIMemory/work.log` to catch up on what other agents/teammates did.
2. Append what YOU do to `AIMemory/work.log` (see `AIMemory/PROTOCOL.md`).
3. Before big work, skim `README.md` for the plan and locked decisions.

## Project

Odoo Hackathon - 4-person team. Goal: WIN. Odoo is a hiring funnel, so judges quiz you live and reward real engineering, not just a working demo.

The problem statement (PS) is revealed at the start hour. ~80% of any PS is the same CRUD boilerplate (auth + roles, CRUD entity, search/filter, dashboard, one "smart" feature). We pre-build that 80% so event-day is spent on the winning 20%.

## Locked stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui. (Vite, not Next.js.)
- **Backend:** Postgres in Docker + Node/Express + Prisma IF someone is backend-confident; else Supabase-local (Docker). DB always in Docker (offline/wifi-safe).
- **Libs:** React Hook Form + Zod, TanStack Query, TanStack Table, Recharts, lucide-react, React Router.
- **Deploy:** Vercel (frontend) + Render/Railway or local (backend). All free tier.
- **Cost:** $0.

## Hard rules

- **Understand your own code.** Odoo penalizes blind copy-paste and quizzes you live. Every person must be able to explain every file they touched. AI writes fast - you still own it.
- **Simplicity wins.** A clean, finished, well-explained simple app beats a broken ambitious one. Cut scope before cutting sleep.
- **Commit often.** Small commits, clear messages (Conventional Commits: `type(scope): desc`). No AI co-author trailers.
- **Branch per person/feature.** One owner merges to `main`.
- **Log your work** to `AIMemory/work.log` so nobody re-derives context or wastes tokens.

## Conventions

- TypeScript everywhere. No `any` unless justified.
- shadcn components over hand-rolled UI. RHF+Zod for every form.
- Keep components small. Reuse the starter-kit primitives (table, form, dashboard card).

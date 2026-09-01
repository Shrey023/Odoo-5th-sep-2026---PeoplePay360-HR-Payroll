# Project Overview - 60-second primer

**What:** Odoo Hackathon. 4-person team. Goal = win. Odoo = hiring funnel, judges quiz you live, reward real engineering + clean UX, not just a demo.

**The insight:** PS is revealed at start hour, but ~80% of any Odoo PS is the same CRUD skeleton (auth+roles, CRUD entity, search/filter, dashboard, one smart feature). We pre-build that 80%. Event day = map PS onto the skeleton + build the winning 20%.

**Stack (locked):** React+Vite+TS+Tailwind+shadcn/ui front. Postgres(Docker)+Node/Express+Prisma back (or Supabase-local if no backend-confident person). RHF+Zod, TanStack Query/Table, Recharts. Deploy Vercel+Render. All free.

**How we work together:**
- One source of truth for rules = `../AGENTS.md` (CLAUDE.md imports it).
- Shared memory = this `AIMemory/` folder. Log work to `work.log`, hand off via `handoff_*.md`.
- Any AI tool (Claude Code / OpenCode / Cursor) reads the same files. No context loss when switching tools.
- Git: branch per person/feature, one owner merges main, commit often.

**Golden rules:** understand your own code (live quiz), simplicity beats ambition, log everything, don't waste tokens re-deriving what's already written.

**Where to go next:** full plan + timeline in `../README.md`. Locked decisions in `decisions.md`. Recent work in `work.log`.

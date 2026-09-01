# Odoo Hackathon - Prep Brief

Research notes and battle plan for the Odoo Hackathon. Compiled 2026-09-01.

## What the Odoo hackathon really is

Not an Odoo-module contest. It is a **full-stack web app sprint** with a surprise problem statement (PS). You build from scratch, free tech stack (React/Node/Mongo is common). The Odoo brand is a hiring funnel - they watch you build under pressure.

- **Format:** 8hr virtual round -> top teams shortlisted -> 24hr on-site final. PS revealed at the start hour (9-10am), hidden before. Virtual-round PS is different from the final-round PS.
- **Team:** 1-4 people, 18+, cross-college allowed, no fee. Once registered you cannot apply to another Odoo hackathon for 3 months.
- **Scale:** massive. 18,000+ registered in 2025, ~1,100 reached the final, 150+ hired directly.
- **Judged on:** problem understanding, innovation, technical implementation, UI/UX, team collaboration. You must understand your own code (blind copy-paste = penalty). Use dynamic/real data, clean responsive UI, structured backend.

## Past problem-statement patterns (prep gold)

All past PS are **CRUD web platforms with a social-good or ops angle**. Real examples:

- **StackIt** - minimal Q&A forum (StackOverflow-lite)
- **Skill Swap Platform** - users trade skills
- **ReWear** - community clothing exchange
- **QuickDesk** - helpdesk / ticket system
- **AssetFlow** - asset tracking ERP
- **Playdoo** (2nd place) - sports arena booking
- Natural-farmer marketplace, carbon tracker, fintech budgeting app, grievance system

**Pattern lock:** auth + roles (user/admin), CRUD entity, search/filter, dashboard, one "smart" feature. Same skeleton every time.

## Why this matters

You cannot know the PS. But **~80% of every PS is the same boilerplate**. Win = have that boilerplate pre-built and drilled, then map the PS onto it on event day.

## Pre-build: PS-agnostic starter kit

Allowed if generic and PS-agnostic. Build before the event:

- Auth (JWT: register/login/roles)
- User CRUD + admin panel
- Reusable UI: table + search + filter + pagination, modal forms, dashboard cards
- Responsive layout + consistent theme
- Seed / dynamic data setup

Event day = map PS onto skeleton, not build the skeleton.

## Decisions locked (2026-09-01)

- **Team size:** 4 people.
- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui. Locked. (Vite, not Next.js - no SSR overhead needed.)
- **Backend:** decided by team's backend confidence:
  - Someone solid with Node/Express + SQL -> **Postgres (Docker) + Node/Express + Prisma** (custom, more impressive; Odoo is a hiring funnel and rewards real backend chops).
  - Nobody backend-confident -> **Supabase-local (Docker)** (saves time; redirect that person to features).
  - Note: **Supabase IS Postgres** (managed/self-host wrapper), not an either/or with Postgres.
- **Docker either way:** run the DB in Docker so it works offline - venue wifi is a real risk.
- **Deploy:** Vercel (frontend) + Render/Railway or local (backend), all free tier.
- **Cost:** entire stack is **$0** (free/open-source + free tiers).
- **Using Claude/AI:** fine for speed, BUT Odoo rule = "you must understand code you submit; blind copy-paste = penalty." Judges quiz you live. Every person must be able to explain their own code.

## Toolkit - don't rawdog, use these

The whole point: ~80% of any PS is boilerplate. Don't hand-write auth, tables, and forms under time pressure. Use a battle-tested library set so you spend the 24hrs on the *feature that wins*, not plumbing.

### Core stack (recommended)

**React + Vite + TypeScript + Tailwind.** Vite = instant dev server, no Next.js overhead. TypeScript catches bugs at 3am.

**UI kit - biggest single lever: [shadcn/ui](https://ui.shadcn.com/).** Copy-paste components, Tailwind-native, you own the code (clean UI for judges, no runtime bloat). Ships tables, dialogs, forms, dropdowns, toasts, cards.

### The library set

| Need | Tool | Why |
|------|------|-----|
| Auth | **Supabase Auth** (or Clerk) | login + roles in minutes |
| DB + backend | **Supabase** (Postgres + auto REST/realtime API) | skip writing a whole backend |
| Forms | **React Hook Form + Zod** | validation free; shadcn uses RHF natively |
| Data fetch/cache | **TanStack Query** | loading/error/refetch handled |
| Tables | **TanStack Table** | sort + filter + paginate free |
| Charts | **Recharts** | dashboard eye-candy fast |
| Icons | **lucide-react** | ships with shadcn |
| Routing | **React Router** | pages |
| Deploy | **Vercel** (frontend) + Supabase (backend) | one-click, live URL for demo |

**Alt fast-track:** [Refine](https://refine.dev/) or [React Admin](https://marmelab.com/react-admin/) = CRUD + auth + tables out-of-box via data providers. Even faster, less UI flexibility. Keep as backup.

**If forced to custom backend** (some PS want it): Node + Express + MongoDB + JWT. Slower but full control.

### Note on `affaan-m/ecc`

The repo found during research is an **AI-agent tooling framework** (agents/skills/hooks for coding assistants), NOT a hackathon starter kit. No CRUD-app value. Skip it.

## Team skills (split roles)

- **Frontend / UI:** React, Tailwind, shadcn, responsive layout, form handling
- **Backend / data:** Supabase (schema, RLS, auth) - or Node/Express/Mongo if custom
- **Glue:** TanStack Query, API wiring, app state
- **Everyone:** git flow, env setup, one-command deploy

## Pre-event drills (build muscle memory)

1. Wire shadcn + RHF + Zod form end-to-end (add/edit an entity).
2. Supabase auth + roles + one table full CRUD.
3. TanStack Table with search/filter/paginate on that table.
4. Deploy the whole thing to Vercel, get a live URL.

## Memory & co-working (the multi-tool problem)

We switch between AI tools (Claude Code, OpenCode, Cursor...) and 4 humans work in parallel. Two failure modes, two fixes. Don't confuse them:

### Problem 1 - instructions drift
Each tool reads a different config file (Claude reads `CLAUDE.md`, OpenCode reads `AGENTS.md`). Edit one, the rest go stale.

**Fix: `AGENTS.md` is the single source of truth.** It's the open standard (Linux Foundation, read by OpenCode/Codex/Cursor). `CLAUDE.md` is just a one-line `@AGENTS.md` import. Humans edit only `AGENTS.md`. Zero drift. **(Already set up in this repo.)**

### Problem 2 - work memory lost on tool switch
"OpenCode built X, I come back to Claude, it has no idea." Config files hold *rules*, not *history*. This needs a shared work log.

**Fix: `AIMemory/` folder (agent-work-mem style).** Pure markdown in git, zero install, no MCP/daemon. Every agent reads it at session start and appends what it did. Works across Claude Code / OpenCode / Cursor / Codex. **(Already set up in this repo.)**

```
AIMemory/
├── INDEX.md            # read first: topic map + how to catch up
├── PROJECT_OVERVIEW.md # 60-second primer for any new session
├── PROTOCOL.md         # rules for reading/writing memory + token discipline
├── decisions.md        # locked decisions + reasons (don't re-litigate)
├── work.log            # append-only: what got done, by whom, when
└── handoff_*.md        # cross-agent/teammate handoffs, created as needed
```

**Why this over MCP memory servers (Cognee/agentmemory):** those need install + config time we don't have in 24hr. Markdown-in-repo is instant and every tool already reads files.

### Token discipline (nobody runs low)
- On session start: read `AIMemory/INDEX.md` -> `PROJECT_OVERVIEW.md` -> last ~20 lines of `work.log`. Don't re-read the whole repo.
- Don't re-derive decisions already in `decisions.md` / `AGENTS.md` - point to them.
- Keep memory entries terse. Reference `path:line`, never paste whole files.
- Delegate heavy searches to sub-agents so main context stays lean.

### Human co-working
- **Branch per person/feature.** One owner merges to `main`.
- `work.log` doubles as async standup - who did what, no verbal sync needed.
- Commit often, small, Conventional Commits format.

## Team roles (4 people)

| Person | Owns |
|--------|------|
| P1 - Backend | Postgres/Docker, schema, Prisma, Express API, auth |
| P2 - Frontend core | React+Vite setup, shadcn, layout, routing, the reusable primitives |
| P3 - Features | CRUD screens, the PS-specific "smart feature" |
| P4 - Glue + polish | TanStack wiring, UI polish, deploy, demo, README/pitch |

Roles overlap - swap as needed. But each area has one clear owner so nothing falls through.

## Event-day playbook

1. **Hour 0:** Read the PS together. Identify the CRUD skeleton vs the "smart 20%". Write it into `AIMemory/work.log`.
2. **Hour 0-1:** Clone the pre-built starter kit. Rename entities to match PS. P1 designs schema.
3. **Hour 1-N:** Parallelize by role. Log progress + handoffs to `work.log`.
4. **Mid-point:** Cut scope. Lock the demo path. Simplicity beats a half-broken ambitious build.
5. **Last 2hr:** Freeze features. Polish UI, seed demo data, deploy, rehearse the pitch + who-explains-what (judges quiz live).

## Next steps

1. **Build the PS-agnostic starter kit** (biggest lever, do first) - React+Vite+shadcn+auth+one CRUD entity+table+dashboard, wired end-to-end.
2. **Mock run** on an old PS (StackIt or ReWear) end-to-end for speed.
3. **Confirm team roles + backend fork** (is anyone backend-confident? -> custom vs Supabase).
4. **Drill the setup** so any teammate can clone + run in one command.

Suggested stack: **React + Vite + TS + Tailwind + shadcn/ui + TanStack Query/Table + RHF/Zod**, Postgres(Docker)+Node/Prisma or Supabase-local, deploy on Vercel.

## How future chats stay in sync

This repo IS the memory. Any new session (this tool or another):
1. Reads `AGENTS.md` (rules) + `AIMemory/` (history + decisions).
2. Continues where the last one stopped - no re-explaining.
3. Appends its own work to `AIMemory/work.log`.

Keep `README.md`, `AGENTS.md`, and `AIMemory/` committed to git. That's the whole system.

## Sources

- [Odoo Hackathon 2026 official](https://hackathon.odoo.com/)
- [2nd place journey - Meet Goti](https://meetgoti.medium.com/from-19-000-participants-to-2nd-place-our-odoo-hackathon-journey-da5f91a3b1e3)
- [Odoo India Hackathon 2025 recap](https://www.odoo.com/blog/odoo-news-5/odoo-india-hackathon-2025-1820)
- [Problem Statements Odoo Hackathon '25](https://www.scribd.com/document/887419725/Problem-Statements-Odoo-Hackathon-25-1)
- [Hackathon judging - 6 criteria (TAIKAI)](https://taikai.network/en/blog/hackathon-judging)
- [RitikRikhi odoo-hackathon-2025 repo](https://github.com/RitikRikhi/odoo-hackathon-2025)
- [shadcn/ui](https://ui.shadcn.com/)
- [React form libraries compared 2026 (Formisch)](https://formisch.dev/blog/react-form-library-comparison/)
- [Best React libraries and tools 2026 (jsdev.space)](https://jsdev.space/react-stack-2026/)
- [Shadcn UI templates & starter kits 2026 (AdminLTE)](https://adminlte.io/blog/shadcn-ui-templates/)
- [React + Supabase boilerplates index](https://starterindex.com/react+supabase-boilerplates)

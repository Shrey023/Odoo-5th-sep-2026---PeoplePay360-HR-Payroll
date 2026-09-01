# AIMemory - Index

Read this first. Shared work memory for all agents (Claude Code, OpenCode, Cursor, etc) and all 4 teammates.
Pure markdown, lives in git. No install, no daemon.

## Files

- `INDEX.md` - this file. Topic index + what lives where.
- `PROJECT_OVERVIEW.md` - 60-second onboarding for any new agent/session.
- `PROTOCOL.md` - the rules every agent follows when reading/writing memory.
- `work.log` - append-only event log. What got done, by whom/what, when. READ THIS to catch up.
- `handoff_*.md` - cross-agent/cross-teammate handoffs (created as needed).
- `decisions.md` - locked decisions and their reasons (so nobody re-litigates).

## How to catch up (do this every session)

1. Read `PROJECT_OVERVIEW.md` (fast primer).
2. Read the last ~20 lines of `work.log` (recent state).
3. Check for any `handoff_*.md` addressed to you.
4. Then start work. Append your events to `work.log` as you go.

## Topic map

- Stack + decisions -> `../AGENTS.md`, `decisions.md`
- Full plan + timeline -> `../README.md`
- What's been built so far -> `work.log`

# AIMemory - Protocol

Rules every agent (and human) follows so memory stays useful and tokens stay low.

## On session start

1. Read `INDEX.md` -> `PROJECT_OVERVIEW.md` -> last ~20 lines of `work.log`.
2. Check `handoff_*.md` for anything addressed to you.
3. Do NOT re-read the whole repo or re-derive decisions already in `decisions.md` / `AGENTS.md`. That wastes tokens. Trust the memory.

## While working

Append to `work.log` when you: finish a feature, make a decision, hit a blocker, or hand off. One line each. Format:

```
[YYYY-MM-DD HH:MM] <agent-or-person> :: <what happened>. <next step / blocker if any>.
```

Example:
```
[2026-09-01 14:30] claude :: Set up AGENTS.md + AIMemory. Next: scaffold Vite+shadcn starter.
```

## Handoffs

When passing work to another agent/person, create `handoff_<to>_<topic>.md`:

```
TO: <opencode / person-name>
FROM: <you>
TASK: <what to do>
CONTEXT: <files touched, current state>
DONE-WHEN: <acceptance>
```

Delete the handoff file once accepted.

## Token discipline (important for us)

- Keep entries terse. Link, don't paste.
- `work.log` stays ~50 recent events; move old ones to `archive/` if it bloats.
- Never dump full file contents into memory - reference `path:line`.
- If context is already in `AGENTS.md` / `decisions.md` / `README.md`, point to it, don't repeat.

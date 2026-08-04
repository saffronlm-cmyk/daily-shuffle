---
name: save-conversation
description: |
  Save the current session as a structured entry in the Daily Shuffle rolling log
  (logs/daily-shuffle_log.md). Use whenever Saffron says "save this conversation",
  "log this session", "capture this", "save notes from this", "create a conversation
  log", or anything similar. ALSO trigger proactively at the end of any session where
  code was changed, data was touched, decisions were made, or the project advanced —
  even if she doesn't ask. This is the single source of truth for the log entry
  template and the prepend/commit workflow; CLAUDE.md's "Session Logging" section
  points here.
---

# save-conversation

## Purpose

Conversations are ephemeral — once closed, the context is gone. Every session ends with
a full entry prepended to `logs/daily-shuffle_log.md` so the next session can pick up
**exactly** where this one left off, with zero archaeology.

These are **handoff documents first**, reference files second. Err on the side of more
detail, not less.

**The standard:** a future Claude session with zero memory of this conversation must be
able to continue the work without asking Saffron to re-explain anything. That means
capturing not just what was done, but the reasoning, the exact files touched, the
gotchas, and the precise next action.

## There is one mode

Rolling Log + GitHub Push. Always. The log file is `logs/daily-shuffle_log.md`
(repo-relative), newest entry at top, committed on the session's working branch.
Do not write logs anywhere else — not `~/Documents`, not the scratchpad, not a new file.

## Process

1. **Read the existing log first** — at minimum the top entry. Note what context is
   already captured so you cross-reference it by date instead of repeating it
   (e.g. "See 2026-07-01 entry for the USDA pipeline details").
2. **Draft the entry** using the full template below. Every section, every time — if a
   section genuinely doesn't apply, write "N/A" so the reader knows it was considered.
   No condensed version regardless of session length.
3. **Prepend** the new entry directly under the file's header block (above the previous
   newest entry). Never append to the bottom; never edit prior entries.
4. **Commit and push** on the current working branch:
   `git add logs/daily-shuffle_log.md && git commit -m "session log: YYYY-MM-DD <short-title>" && git push -u origin <branch>`
   Never push to `main` directly. If the session already has a draft PR, the log commit
   rides in it; if not, open one per the environment's PR rules.
5. **Report** the commit hash and one-line confirmation to Saffron. If the push fails,
   say so explicitly with the error — never fail silently.

## Go long / go short

Go long on: **Decisions & Reasoning** (reasoning evaporates fastest), **Next Steps**
(the first item must be executable with no warm-up), **Notes & Gotchas**, exact
artifact paths.

Go short on: background already in a prior entry (cross-reference by date), and process
narration that adds nothing ("then I ran the script").

## Template (use in full, every time)

```markdown
# [Short descriptive title]
**Date:** YYYY-MM-DD
**Project:** Daily Shuffle — [area]
**Mode:** Rolling Log + GitHub Push
**Status:** [Complete / In Progress / Blocked]

---

## Project Context
[Broader project this session sits within. If not the first entry, reference the prior
entry by date and add only what's new or changed since then.]

## Session Goal
[What this specific session tried to accomplish, 1–3 sentences. Be precise — "fix the
null-member bug in pipeline_v3.py and regenerate the June CSVs" beats "finish the
pipeline".]

## State Before This Session
[Where the work stood at session start. What was broken, incomplete, or pending —
the "where we picked up from" section.]

## What Was Done
[Full narrative: explored, attempted, built, fixed, decided, abandoned. Include what
DIDN'T work and why — that stops the next session re-treading the same ground. Brief a
capable colleague who wasn't in the room.]

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| filename.ext | Description | Created / Modified / Deleted | /full/path/ |

[Every file touched. If modified, note what changed. If deleted, why.]

## Decisions & Reasoning
[Every meaningful choice: decision → options considered → choice → reasoning. Example:
- **Chose Supabase RLS over app-level auth**: app-level would require token management
  across three services; RLS keeps it in one place and is already provisioned.]

## Current State (end of session)
[Exact state right now: working / partially done / known-broken. The "pick up from
here" section.]

## Next Steps
[Ordered, specific, actionable. Item 1 must be immediately executable. Example:
1. Run `python3 scripts/usda_staples.py --sample 10` and check confidence_flag column
2. If wrong-form matches appear, add a TERM_OVERRIDES row — see script header
3. Once clean, apply reviewed rows to staple_products via Supabase MCP]

## Open Questions / Blockers
[Unresolved items and what unblocks them. N/A if none.]

## Environment & Config Notes
[Repo, branch, PR number. Env vars/credentials in play (names only, NEVER values).
Supabase table names, cache version if bumped, non-obvious config. N/A if standard.]

## Notes & Gotchas
[Edge cases, assumptions baked in, warnings. Be specific: "the measured cup-weights in
§3.3 are weighed, not density-derived — don't rescale them" is useful; "some cup
issues" is not. N/A if none.]
```

## Example of a great entry

The 2026-07-01 entry "Quantity Normalisation — §6 Decisions Signed Off" at the top of
`logs/daily-shuffle_log.md` is the reference standard: it records each decision WITH the
option that was rejected and who overrode what ("Saffron overrode my US-240 ml
recommendation"), flags a trap for future editors (don't rescale the measured
cup-weights), and its Next Steps name the exact column, flags, and CSV the apply-session
must produce.

## Do-nots

- Do NOT write the log anywhere except `logs/daily-shuffle_log.md` in this repo.
- Do NOT append at the bottom or rewrite prior entries — prepend only.
- Do NOT use a condensed template for "small" sessions — full template, always.
- Do NOT repeat context a prior entry already holds — cross-reference by date.
- Do NOT include credential/key VALUES — names only.
- Do NOT push to `main`; the log commit goes on the session's working branch.
- Do NOT skip the log because the session "only discussed things" — decisions ARE the
  artifact; log them.

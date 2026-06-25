## Session Logging (always on)

Project: Daily Shuffle
Log file: `logs/daily-shuffle_log.md`

At the end of every session — or whenever asked — save a conversation log by following the instructions and template below exactly. Do not skip this step, even for short sessions.

### Trigger phrases

Any of the following should invoke the log: "save this conversation", "log this session", "capture this", "save notes from this", "create a conversation log". Also trigger proactively at the end of any session where artifacts were produced, decisions were made, or the project advanced meaningfully.

### Mode: Rolling Log

This repo always uses the Rolling Log mode. Save to the log file path specified above.

Prepend workflow:

1. Read the existing log file if it exists — note what context is already captured
2. Write the new session entry using the full template below
3. Prepend it above the existing content (newest entry at top)
4. Do not repeat context already in a prior entry — cross-reference by date instead (e.g. "See 2026-06-10 entry for schema details")
5. Commit the updated log file: `git add <log-path> && git commit -m "session log: YYYY-MM-DD <short-title>" && git push`

If the log file does not yet exist, create it with the first session entry and commit.

### The standard

A future Claude session with zero memory of this conversation must be able to pick up and continue the work without asking for re-explanation. Write for that reader. Err on the side of more detail, not less. Every entry uses the full template — no condensed version regardless of session length.

### Template (use in full, every time)

```markdown
# [Short descriptive title]
**Date:** YYYY-MM-DD
**Project:** [Project name / area]
**Status:** [Complete / In Progress / Blocked]

---

## Project Context
[What is the broader project this session sits within? What's the overall goal?
If this is not the first log entry, reference the prior entry by date for background
and add only what's new or changed since then.]

## Session Goal
[What was this specific session trying to accomplish? One to three sentences.
Be precise — "finish the pipeline" is worse than "fix the null-member bug in
pipeline_v3.py and regenerate the June dashboard CSVs".]

## State Before This Session
[What was the state of the work when this session started?
What was broken, incomplete, or pending? What had the previous session left off at?
This is the "where we picked up from" section — essential for continuity.]

## What Was Done
[Full narrative. What was explored, attempted, built, fixed, decided, or abandoned?
Include things that didn't work and why — that context prevents the next session
from re-treading the same ground. Write as if briefing a capable colleague
who wasn't in the room.]

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| filename.ext | Description | Created / Modified / Deleted | /full/path/ |

[Every file touched. If modified, note what changed. If deleted, note why.]

## Decisions & Reasoning
[Every meaningful choice and why. This is the most valuable section — reasoning
disappears fastest and is hardest to reconstruct. Structure as:
decision → options considered → choice made → reasoning.

Example:
- **Chose Supabase RLS over app-level auth**: App-level would require token
  management across three services; RLS keeps it in one place and is already
  provisioned on the project.
- **Left the cafe_products table denormalised**: Normalising would save ~2KB
  but break four existing queries; deferred until next schema review.]

## Current State (end of session)
[Exact state of the work right now, as this session closes.
What's working, what's partially done, what's known-broken.
This is the "where to pick up from" section for the next session.]

## Next Steps
[Ordered, specific, actionable. The first item must be immediately executable —
no warm-up required. Include enough detail that the next session knows exactly
what to do without asking.

Example:
1. Run `python pipeline_v3.py --month=june` and check for null errors in console
2. If nulls appear, check the `member_id` join at line 84 — suspected culprit
3. Once clean, push the 5 CSVs to Google Sheets and update the dashboard link]

## Open Questions / Blockers
[Anything unresolved, uncertain, or waiting on external input.
Name the blocker and what's needed to unblock it. Write N/A if none.]

## Environment & Config Notes
[Technical context a future session needs:
- Repo, branch, and working directory
- Env vars or credentials in play (names only, never values)
- Database project IDs, table names, schema details relevant to this work
- Package versions, tool dependencies, or non-obvious config set this session
Write N/A if nothing unusual.]

## Notes & Gotchas
[Conventions adopted, edge cases discovered, assumptions baked in,
things that tripped things up, warnings for the next session.
Be specific: "the WodBoard CSV always has a trailing comma on line 1 — strip
it before parsing" is useful. "There were some CSV issues" is not.
Write N/A if nothing to flag.]
```

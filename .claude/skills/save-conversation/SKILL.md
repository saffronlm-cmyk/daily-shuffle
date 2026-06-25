---
name: save-conversation
description: |
  Saves the current conversation as a structured .md file so it can be referenced in future sessions. Use whenever Saffron says "save this conversation", "log this session", "capture this", "save notes from this", "create a conversation log", or anything similar. Also trigger proactively at the end of any substantial work session where artifacts were produced, decisions were made, or a project advanced meaningfully — even if she doesn't explicitly ask. The goal is to create a comprehensive handoff document that gives future Claude sessions everything needed to pick up exactly where this one left off — no archaeology required. Supports three modes: per-file (default for one-off sessions), rolling log (ongoing projects), and GitHub push (cloud/repo-backed work).
---

# save-conversation

## Purpose

Conversations with Claude are ephemeral — once closed, the context is gone. This skill creates a structured `.md` handoff document comprehensive enough that a future session can pick up exactly where this one left off, without needing to re-read the conversation or reverse-engineer decisions.

These are **handoff documents first**, reference files second. Write them accordingly — err on the side of more detail, not less.

---

## Modes

| Situation | Mode |
|---|---|
| One-off session, no named project | Per-File |
| Named project (ONE LDN, Folio, Daily Shuffle, etc.) | Rolling Log |
| Working in Cowork / cloud environment | Rolling Log + GitHub if repo is relevant |
| Session produced code / schema / skill changes | Rolling Log + GitHub Push |
| Saffron says "push to GitHub" / "commit this" | GitHub Push |
| No persistent local filesystem (pure cloud) | GitHub Push (primary) |

---

## Mode 1: Per-File (one-off sessions)

Creates a new dated `.md` per conversation.

**Filename:** `YYYY-MM-DD_short-descriptive-title.md`

**Save location:** `~/Documents/Claude/conversation_logs/`

---

## Mode 2: Rolling Log (named projects)

Appends a full session entry to a single running `.md` per project. Most recent session at the top. **Every entry uses the full template** — no condensed version. Before writing, read the existing log to avoid repeating context that's already captured; reference it instead (e.g. "See 2026-06-10 entry for full Supabase schema").

**Log filename:** `{project-slug}_log.md`

**Save locations:**

| Project | Path |
|---|---|
| ONE LDN (general) | `~/Documents/Claude/WORK/ONE_LDN/conversation_logs/one-ldn_log.md` |
| ONE LDN — Cafe & Stock | `~/Documents/Claude/WORK/ONE_LDN/conversation_logs/one-ldn-cafe_log.md` |
| ONE LDN — Dashboard / Pipeline | `~/Documents/Claude/WORK/ONE_LDN/conversation_logs/one-ldn-dashboard_log.md` |
| ONE LDN — Passes / Seasonality | `~/Documents/Claude/WORK/ONE_LDN/conversation_logs/one-ldn-passes_log.md` |
| Folio | `~/Documents/Claude/conversation_logs/folio_log.md` |
| Daily Shuffle | `~/Documents/Claude/conversation_logs/daily-shuffle_log.md` |
| Deloitte / job applications | `~/Documents/Claude/conversation_logs/deloitte-prep_log.md` |
| Sleven / client engagements | `~/Documents/Claude/conversation_logs/sleven_log.md` |
| Women's Wellness Research | `~/Documents/Claude/conversation_logs/wwresearch_log.md` |
| Any other named project | `~/Documents/Claude/conversation_logs/{project-slug}_log.md` |
| Truly one-off | `~/Documents/Claude/conversation_logs/YYYY-MM-DD_title.md` |

**Prepend workflow:**
1. Check if the log file exists
2. If yes → read existing content, then prepend new session block above it (newest at top)
3. If no → create the file with the first session entry
4. Do not repeat background already captured in a prior entry — cross-reference it by date instead

---

## Mode 3: GitHub Push (cloud / repo-backed work)

Commits the log (per-file or rolling) to a GitHub repo. Every entry uses the **full template** — no condensed version, same rule as Mode 2.

**Target path within repo:** `logs/YYYY-MM-DD_session-title.md` (per-file) or `logs/{project-slug}_log.md` (rolling)

**Workflow — `gh` CLI (preferred):**
```bash
cd /path/to/repo
git add logs/filename.md
git commit -m "session log: YYYY-MM-DD short-title"
git push origin main
```

**Workflow — GitHub API (fallback if `gh` unavailable):**
```python
import base64, requests, json, os

token = os.environ["GITHUB_TOKEN"]  # never hardcode
repo  = "username/repo-name"
path  = "logs/filename.md"

# Get SHA if file already exists (required for update)
r = requests.get(f"https://api.github.com/repos/{repo}/contents/{path}",
                 headers={"Authorization": f"token {token}"})
sha = r.json().get("sha") if r.status_code == 200 else None

with open("/path/to/local/file.md", "rb") as f:
    content = base64.b64encode(f.read()).decode()

payload = {"message": f"session log: YYYY-MM-DD short-title", "content": content}
if sha:
    payload["sha"] = sha

requests.put(f"https://api.github.com/repos/{repo}/contents/{path}",
             headers={"Authorization": f"token {token}"},
             data=json.dumps(payload))
```

> ⚠️ Always read `GITHUB_TOKEN` from environment. If unavailable, ask Saffron to confirm before proceeding. Never fail silently — report the commit URL on success, or the error on failure.

---

## What to Capture

The standard for a good handoff document: **a future Claude session with zero memory of this conversation should be able to pick up and continue the work without asking Saffron to re-explain anything.**

That means capturing not just what was done, but the full working context — the state of the system, the reasoning behind choices, the exact files touched, the gotchas discovered, and the precise next action.

Go long on:
- **Decisions & Reasoning** — this disappears fastest and is hardest to reconstruct
- **Next Steps** — be specific enough that "start here" is unambiguous
- **Notes & Gotchas** — edge cases, assumptions, things that tripped things up
- **Artifacts** — exact filenames, paths, and what each file is for

Go short on:
- Background that's already in a prior log entry (cross-reference instead)
- Process narration that doesn't add context ("then I ran the script")

---

## Full Template

Use this for every entry — per-file, rolling log, and GitHub. No condensed version.

```markdown
# [Short descriptive title]
**Date:** YYYY-MM-DD
**Project:** [Project name / area]
**Mode:** [Per-File / Rolling Log / GitHub Push]
**Status:** [Complete / In Progress / Blocked]

---

## Project Context
[What is the broader project this session sits within? What's the overall goal?
If this is a rolling log and context was captured in a prior entry, reference it:
"See 2026-06-10 entry for full background." Add only what's new or changed.]

## Session Goal
[What was this specific conversation trying to accomplish? One to three sentences.
Be precise — "finish the pipeline" is worse than "fix the null-member bug in pipeline_v3.py
and regenerate the June dashboard CSVs".]

## State Before This Session
[What was the state of the work when this session started?
What was broken, incomplete, or pending? What had the last session left off at?
This is the "where we picked up from" section — essential for continuity.]

## What Was Done
[Full narrative of the work. What was explored, attempted, built, fixed, decided, or abandoned?
Include things that didn't work and why — that context prevents future sessions from
re-treading the same ground. Write as if briefing a capable colleague who wasn't in the room.]

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|-----------|--------|----------|
| filename.ext | Description | Created / Modified / Deleted | /full/path/ |

[Include every file touched. If a file was modified, note what changed and what the file
looked like before if relevant. If it was deleted, note why.]

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| skill-name | Specific contribution this session |

## Decisions & Reasoning
[Every meaningful choice made this session, and why. This is the most valuable section.
Structure as decision → options considered → choice made → reasoning.
Example:
- **Chose Supabase RLS over app-level auth**: App-level would require token management
  across three services; RLS keeps it in one place and is already provisioned on the project.
- **Left the cafe_products table denormalised**: Normalising would save ~2KB but break four
  existing queries; deferred until next schema review.]

## Current State (end of session)
[What is the exact state of the work right now, as this session closes?
What's working, what's partially done, what's known-broken?
This is the "where to pick up from" section for the next session.]

## Next Steps
[Ordered, specific, actionable. The first item should be immediately executable — no
warm-up required. Include enough detail that the next session knows exactly what to do
without asking.
Example:
1. Run `python pipeline_v3.py --month=june` and check for null errors in the console
2. If nulls appear, check the `member_id` join in line 84 — suspected culprit from today
3. Once pipeline runs clean, push the 5 CSVs to Google Sheets and update the dashboard link
4. Then review the pass seasonality chart — Pete flagged the Y-axis scale is wrong]

## Open Questions / Blockers
[Anything unresolved, uncertain, or waiting on external input.
Name the blocker and what's needed to unblock it.]

## Environment & Config Notes
[Anything about the technical environment that a future session needs to know:
- Which repo, branch, and directory the work lives in
- Any env vars, API keys, or credentials that were in play (names only, not values)
- Tool versions, package dependencies, or gotchas with the local setup
- Database project IDs, table names, or schema details relevant to the work
- Any non-obvious configuration that was set during this session]

## Notes & Gotchas
[Conventions adopted, edge cases discovered, assumptions baked into the work,
things that tripped things up, warnings for the next session.
Be specific: "the WodBoard CSV always has a trailing comma on line 1 — strip it before parsing"
is useful. "There were some CSV issues" is not.]
```

---

## Writing Guidelines

**Write for a reader with no memory of this conversation.** Don't reference "the file we discussed" — name it. Don't say "we decided on the approach" — say which approach and why.

**Decisions section is the most valuable.** Artifacts are visible; reasoning evaporates. Prioritise capturing the why behind every non-obvious choice.

**Current State and Next Steps are the handoff core.** A future session will read these first. Make them precise enough to act on immediately.

**Cross-reference, don't repeat.** In rolling logs, if something is already captured in a prior entry, reference it by date rather than copying it out again.

**Check file paths before writing them.** Only include paths you've confirmed exist.

**Proportionality within comprehensiveness.** A 10-minute setup session still gets the full template, but some sections will be brief. A 3-hour analysis session warrants depth in every section. Never skip a section entirely — if it genuinely doesn't apply, write "N/A" so a future reader knows it was considered.

---

## Workflow

1. Review the full conversation
2. Determine mode (per-file / rolling / GitHub) using the table at the top
3. For rolling logs — read the existing log first; note what's already captured
4. Draft the full template entry, cross-referencing prior entries where relevant
5. For rolling logs — prepend the new entry above existing content
6. Confirm save path exists (create directory if needed; note fallback if not)
7. Save the file
8. For GitHub push — commit and report the URL
9. Present via `present_files`

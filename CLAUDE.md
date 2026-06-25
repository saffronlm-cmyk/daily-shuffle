# Daily Shuffle

A personal meal-planning PWA (Progressive Web App) — shuffle a meal plan, manage recipes, build a grocery list, and track food/macros. Ships as a static site with **no build step**.

## Architecture

- **`index.html`** — the entire app. All markup, `<style>` CSS, and `<script>` JS live in this one file (~5,500 lines). There is no bundler/transpiler; edit it directly.
- **`sw.js`** — service worker, cache-first strategy. **Bump the `CACHE` constant (currently `daily-shuffle-v23`) on every shippable change** or installed PWAs keep serving stale HTML. Users must reload/hard-refresh (sometimes twice) after a deploy for the new cache to take effect — this is the #1 cause of "my fix isn't showing."
- **`manifest.json`** — PWA manifest (icons, theme, standalone display).
- **`legacy/`** — verbatim-lifted tabs/features stashed during a foundations restructure (Track/Food Log, Pantry, Discover/Edamam search, Wellness/Supplements, Macro Calculator). Not loaded by the live app. See `legacy/README.md` for source line references and the re-grafting checklist before reviving any of these.
- **`scripts/`** — standalone Python 3 price-book pipeline (stdlib only, no `pip install`): `price_pricebook.py` (CSV → Apify scrape → filled CSV) → `csv_to_seed.py` (filled CSV → patches `seedPriceBook()` in `index.html`). See `scripts/README.md` for usage and `handoff.md` for the detailed pipeline state/decisions. This is a build-only tool — it is never run from an agent sandbox (egress to `api.apify.com` is blocked); the user runs it locally and pastes results back.
- **`pricebook.csv`** — committed input to the pipeline above.

## Tabs (current, in `index.html`)

`tab-recipes`, `tab-plan` (Shuffle), `tab-grocery`, `tab-add` (Add Recipe), `tab-tracker` (Tracker — food/macro log). Tabs removed during the foundations restructure live in `legacy/`.

## Data & sync

- **Local persistence**: most state lives in `localStorage` under `ds_*` keys (e.g. `ds_pricebook`, `ds_custom_recipes`, `ds_hidden_recipes`, `ds_grocery`, `ds_favourites`, `ds_trk_*` for the tracker). Check existing key names before adding new state.
- **Bundled Supabase project** (`jsxcctrskkkxgdxfaduo`, hardcoded as `RECIPE_LIB_URL`/`RECIPE_LIB_KEY` near `index.html:1102`): backs the recipe library **and** the Tracker (`recipes`, `staple_products`, `food_log`, `day_meta`, `saved_meals` tables, all PK-keyed with open `anon ALL` RLS, upserted via `Prefer: resolution=merge-duplicates`). The Tracker's `TRK_SB_URL`/`TRK_SB_KEY` (~`index.html:4765`) prefer this bundled project and fall back to the user's personal Supabase creds.
- **Personal Supabase creds** (`ds_supabase_url`/`ds_supabase_key`, set via Settings → Cloud Sync): optional, used by the separate `user_library` cross-device sync path for custom recipes/overrides/nutrition/etc. Most users never set these — don't assume they're populated.
- **No per-user auth** — it's a personal single-user app; all writes use a shared anon key keyed by date/id, not scoped by `user_id`. Multi-user/privacy is a deferred design question (see log).
- **Write helpers must check `res.ok`** and surface a ⚠ toast on failure — a past bug silently dropped tracker writes because failures were ignored, making sync look broken with no signal. Don't regress this.

## AI features

In-browser calls direct to `https://api.anthropic.com/v1/messages` using the user's own key (`ds_api_key` in `localStorage`, set via Settings), model `claude-haiku-4-5-20251001`, header `anthropic-dangerous-direct-browser-access: true`. Used for: pantry item parsing, recipe quick-add, bulk staple paste import, tracker AI quick-add.

## Dev workflow

- No CI, no required checks — PRs merge freely once opened.
- Validate JS changes by checking each `<script>` block parses (e.g. `new Function(...)` over the extracted block) since there's no bundler/linter step enforcing this.
- `canonicalise()` exists in **three places** (the app in `index.html`, and both pipeline scripts) — keep all three in sync or price-book keys/aliases stop matching.
- Generated/local-only files are gitignored: `pricebook.filled.csv`, `price_report.md`, `scripts/seed_snippet.js`, `index.html.bak`.

---

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

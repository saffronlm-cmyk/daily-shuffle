# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

# Apify price-book pipeline — build, fix, and merge
**Date:** 2026-06-25
**Project:** Daily Shuffle
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress (pipeline code merged; actual price fill still pending on Saffron's machine)

---

## Project Context
Daily Shuffle is a static, single-file PWA (`index.html`) — a GF/DF nutrition
planner with a macro tracker, AI meal generation, recipe discovery, and a
localStorage-backed **price book** (`ds_pricebook`) used to cost recipes. This
session built the tooling to populate that price book with real UK supermarket
prices instead of hand-entered guesses. First entry in this log — no prior
entries to cross-reference.

## Session Goal
Build (not run) two dependency-free Python scripts: one to fill `pricebook.csv`
with real UK prices via an Apify scraper, and one to regenerate the app's
`seedPriceBook()` from the filled CSV. Saffron runs the actual scrape herself on
her Mac with her own Apify token (the cloud sandbox cannot reach
`api.apify.com`). Mid-session the goal expanded to fixing systematic mismatches
where spices/nuts were being priced as liquids.

## State Before This Session
The original pipeline (PR #7) had already been merged to `main` on 2026-06-24 at
commit `9b26458`, but it had three problems discovered in real test runs:
1. Wrong Apify actor input schema (guessed `searchQuery`/`maxItems`).
2. Tesco/Sainsbury's actors blocked by anti-bot; only ASDA worked.
3. Matching ignored the CSV's Category/Product/variant structure, so a one-word
   product search (e.g. "cayenne") matched the wrong *form* (hot sauce).

## What Was Done
- **Fixed the Apify integration** (commit `a69c376`): corrected actor input to
  `{"queries":[term], "maxResultsPerQuery":N}`; mapped the real ASDA output
  fields; reduced to **ASDA-only** after confirming Tesco/Sainsbury's free
  `illehius` actors return 403/dead-proxy. Cheapest-across-stores logic was kept
  intact so working actors can be dropped in later with no code change.
- **Made matching category- and unit-aware** (commit `1990aff`) after the first
  full run (189/208 priced) showed mismatches: Cayenne→hot sauce 354ml,
  Hazelnut→nut milk 1000ml, Lime→lime juice, Vanilla→2L drink, Baking
  Soda→liquid 75ml. Added `allowed_units(category, product)` which restricts the
  acceptable base units `{g, ml, each}` and rejects wrong-form result names,
  driven by the CSV `Category` plus word heuristics (`_SOLID_CATS`,
  `_PRODUCE_CATS`, `_LIQUID_WORDS`, `_SOLID_WORDS`, `_BAD_FORM_WORDS`), plus
  `UNIT_OVERRIDES` and an expanded `TERM_OVERRIDES`. Validated every known bad
  case flips correct while legit liquids (soy sauce, milk) still pass.
- **Fixed an own-words rejection bug**: "Bicarbonate of **Soda**" was tripping
  the "soda" bad-form word. Fix: `reject_words -= set(canonicalise(product).split())`.
- **Wrote `handoff.md`** (commit `ba0852d`) capturing full pipeline state.
- **Opened draft PR #13**, Saffron marked it ready, and it **merged to `main`**.
  (PR #7's branch had advanced past its merge point, so the post-merge fixes
  needed their own PR — #13.)
- Helped Saffron debug runtime issues on her machine: literal placeholder token
  → 401; running from the wrong directory → `fatal: not a git repository` (must
  `cd` into the repo first); token not persisting → re-`export` each session.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|-----------|--------|----------|
| scripts/price_pricebook.py | Fill pipeline; ASDA-only + v2 category-aware matching | Modified | repo root /scripts/ |
| scripts/csv_to_seed.py | Regenerates app's `seedPriceBook()` from filled CSV | Unchanged this session | /scripts/ |
| scripts/README.md | Novice run guide | Created earlier (PR #7) | /scripts/ |
| handoff.md | Pipeline resumption notes | Created | repo root |
| logs/daily-shuffle_log.md | This conversation log | Created | repo root /logs/ |
| pricebook.csv | Source ingredient list (input) | Unchanged | repo root |
| .gitignore | Ignores generated outputs | Modified earlier | repo root |

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This log entry (Rolling Log + GitHub Push mode) |

## Decisions & Reasoning
- **ASDA-only, not three-store comparison**: Tesco and Sainsbury's free
  `illehius` actors are blocked by anti-bot (HTTP 403 / dead proxy) and return
  nothing. ASDA is the only one that gets through. Kept the cheapest-across-
  stores code so working actors can be added later with zero refactor.
- **Reject mismatches → leave blank (no caching)**: Better an unpriced product
  than a confidently-wrong, wrong-form price. Consequence: the unmatched count
  may *rise* vs the naive v1 run; those land in `price_report.md`. No caching, so
  each run re-scrapes (acceptable at this scale/cost).
- **Build-only, Saffron runs it**: the cloud sandbox's egress allowlist blocks
  `api.apify.com`, and the scrape spends real pay-per-result money on her token.
  So the scripts are designed to run on her Mac; nothing is executed from here.
- **Scope = products with occurrences ≥ 3** (~208): pricing one-off ingredients
  isn't worth the query cost.
- **Category-aware filtering over a bigger match threshold**: the real failures
  were wrong *form* (right words, wrong product type), which a score threshold
  can't catch — only unit/category constraints can.
- **Separate PR (#13) for post-merge fixes**: PR #7 was already merged at an
  older commit; reopening it wasn't possible, so the fixes got a clean new PR.

## Current State (end of session)
PR #13 is **merged into `main`**. `main` now contains: the ASDA-only Apify
integration, v2 category-aware matching, and `handoff.md`. CI: none configured
on this repo. **Critically, the app's prices are unchanged** — `pricebook.csv`
is still unfilled and `index.html`'s `seedPriceBook()` is untouched. The
pipeline is *ready to run* but has not been run end-to-end against live data.

## Next Steps
1. On Saffron's Mac: `cd` into the repo (where `pricebook.csv` lives — verify
   `git status` works), then `git pull`.
2. `export APIFY_TOKEN=apify_api_...` (real token from console.apify.com →
   Settings → Integrations; must re-export each terminal session).
3. `python3 scripts/price_pricebook.py` (full run). Paste back the summary line
   (`Priced X/208 …`) and `cat price_report.md`.
4. Verify the previously-mismatched items (Vanilla, Cayenne, Hazelnut, Lime,
   Baking Soda) are now correctly priced or cleanly blank — and watch for
   over-rejection (a genuinely liquid pantry item forced to grams by a bad CSV
   Category). Add `TERM_OVERRIDES`/`UNIT_OVERRIDES` entries for any stragglers.
5. Once the fill looks clean: `python3 scripts/csv_to_seed.py --in
   pricebook.filled.csv` (preview), then `--apply` to patch `index.html`
   (writes `index.html.bak`). Review the diff before committing.

## Open Questions / Blockers
- **Blocker (external):** the full scrape can only run on Saffron's machine with
  her token — sandbox egress blocks `api.apify.com`. Nothing else proceeds until
  she runs it and shares the output.
- **Open:** will v2 over-reject any legitimate liquids whose CSV Category is
  wrong? Only the post-run `price_report.md` will reveal this.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`. Dev branch this session:
  `claude/gifted-mendel-2cq60n`. Base: `main`.
- Apify endpoint: `run-sync-get-dataset-items`. Actor: `illehius~asda-scraper`.
  Input `{"queries":[term],"maxResultsPerQuery":N}`. ASDA output fields:
  `name`, `price`, `unitSize`, `unitPrice`, `unitPriceMeasure`, `productUrl`.
- Secret (name only): `APIFY_TOKEN` — never persisted, re-exported per session.
- Python: stdlib only (urllib, csv, json, argparse, re). No `pip install`.
- App seed flag bumps `ds_pb_seeded_v2` → `ds_pb_seeded_v3` so new prices load.
- Cloud sandbox is ephemeral: anything not committed/pushed is lost.

## Notes & Gotchas
- `canonicalise()` is duplicated in `price_pricebook.py`, `csv_to_seed.py`, AND
  `index.html` — all three MUST stay in sync or keys/aliases won't match.
- The own-words rejection bug (product rejected for containing its own name,
  e.g. "soda") is subtle — any new bad-form word that overlaps a real product
  name will resurface it. Fix pattern: subtract the product's own words.
- `maxResultsPerQuery` MUST be set or the actor returns `[]`.
- Use `--probe TERM` to confirm actor field names before a big run; use
  `--dry-run` to preview the query list and cost with no token/spend.
- Generated files (`pricebook.filled.csv`, `price_report.md`,
  `scripts/seed_snippet.js`, `index.html.bak`) are git-ignored.
- `handoff.md` at repo root is the quick-start companion to this log.

---

# Tracker: cross-device sync fix, saved meals, TDEE/deficit, skill install
**Date:** 2026-06-25
**Project:** Daily Shuffle
**Mode:** Rolling Log + GitHub Push
**Status:** Complete

---

## Project Context
Daily Shuffle is a personal PWA (progressive web app) shipped as a single `index.html` plus a `sw.js` service worker, in the GitHub repo `saffronlm-cmyk/daily-shuffle`. It includes a **Tracker** tab — a MyFitnessPal-style food/macro tracker tailored for a coeliac (gluten-free) and dairy-free user with PCOS-aware flags. The tracker persists to a Supabase project and is intended to work across devices (phone + laptop) as an installed PWA.

This is the first entry in this rolling log, so it captures the working context in full.

## Session Goal
Several threads in one session:
1. Fix the Tracker not loading seeded staples / recipes.
2. Diagnose and fix tracking not persisting across sessions/devices.
3. Add a **bulk paste** importer for staple products.
4. Design + build **saved meals** (reusable multi-product meal compositions).
5. Add **TDEE logging** and correct the deficit math at the top of the tracker.
6. Install the **save-conversation** skill into the repo.

## State Before This Session
- The Tracker UI, Supabase persistence wiring, staples manager, and AI quick-add already existed (built in prior work — see task history: migration for `staple_products`/`food_log`/`day_meta` + RLS applied, 25 staples seeded).
- Bug: seeded staples and the recipe picker weren't appearing in the app.

## What Was Done
Shipped as five PRs, all merged to `main`:

- **PR #9 — creds fix.** Root cause of staples/recipes not loading: the tracker's REST calls used the user's *optional personal* Supabase credentials (`supabaseUrl`/`supabaseKey` from Settings → Cloud Sync), which were empty. The tracker tables actually live in the **bundled** project referenced by the hardcoded `RECIPE_LIB_URL`/`RECIPE_LIB_KEY` (`index.html:1102-1103`). Added `TRK_SB_URL`/`TRK_SB_KEY` constants (`index.html` ~4765) that prefer the bundled project and fall back to personal creds. Repointed all 9 tracker REST call sites. The separate `user_library` cloud-sync path was left untouched.

- **Bulk paste importer** (folded into the #9 branch). New "📋 Bulk paste a list" button in the Staples manager: paste freeform product text → Claude (haiku) parses into structured `staple_products` rows → review/edit/drop → batch insert in one REST call (`trkUpsertStaplesBatch`). Reuses the quick-add Anthropic pattern.

- **PR #10 — surface sync failures.** The food_log/day_meta write helpers (`trkPushEntry`, `trkPushDeleteEntry`, `trkSaveMeta`) ignored the HTTP response, so a rejected write was invisible — data looked saved but only lived in the per-device `localStorage` mirror. This is *why* logging never persisted before the creds fix. Now each checks `res.ok` and toasts a ⚠ warning on failure. Verified the backend end-to-end: impersonated the `anon` role and inserted into both `food_log` and `day_meta` successfully (then cleaned up the test rows); schema matches the app payload field-for-field; RLS is wide open (`anon ALL` with `true`).

- **PR #11 — saved meals + entry quantity editing.** New `saved_meals` table. A saved meal stores `name`, optional `meal_type`, and an `items` array. Each item is **product-level and linked**: `source_type` + `source_id` link back to the originating staple (so the meal auto-updates if the staple's nutrition changes), plus `per_unit` macros + `qty` + `unit` so non-staple/AI items still rescale. Save from a meal card (💾 save as meal) or from the AI quick-add confirm screen. Apply via a new 🍱 Saved meals tile in the add chooser; each item drops in as its own entry, staple-linked items recomputed from current staple nutrition. Manager to rename/delete. Also added an ✎ entry editor that rescales macros when you change title/quantity (makes "alter quantities after applying a meal" real). Writes back via the existing `id`-keyed upsert.

- **PR #12 — TDEE + deficit.** New nullable `tdee` column on `day_meta` and a TDEE input on the exercise card (Apple Watch end-of-day total burn). When TDEE is set: header shows **Deficit = TDEE − Food** (flips to "Surplus" with over-colour when food > burn); exercise is treated as already inside TDEE and *not* added separately (no double-count); Goal is excluded from the equation, shown only as faint reference and still driving macro target bars. When no TDEE: deficit line reads "— log TDEE" rather than a misleading number.

- **PR #15 — save-conversation skill.** Installed `.claude/skills/save-conversation/SKILL.md` (this skill) from an uploaded `.skill` bundle.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|-----------|--------|----------|
| index.html | The entire app (UI + tracker logic). Creds fix, bulk import, sync-failure handling, saved meals, entry editing, TDEE/deficit. | Modified | `/daily-shuffle/index.html` |
| sw.js | Service worker. Cache version bumped repeatedly; now `daily-shuffle-v23`. | Modified | `/daily-shuffle/sw.js` |
| .claude/skills/save-conversation/SKILL.md | The save-conversation skill definition. | Created | `/daily-shuffle/.claude/skills/save-conversation/` |
| logs/daily-shuffle_log.md | This rolling log. | Created | `/daily-shuffle/logs/` |
| Supabase: saved_meals table | New table for saved meals. | Created (migration `create_saved_meals`) | project `jsxcctrskkkxgdxfaduo` |
| Supabase: day_meta.tdee column | Nullable numeric for per-day TDEE. | Created (migration `add_tdee_to_day_meta`) | project `jsxcctrskkkxgdxfaduo` |

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | Produced this handoff log entry (first run, immediately after the skill was installed). |

## Decisions & Reasoning
- **Tracker points at the bundled Supabase project, not personal creds**: personal creds are empty for most users, so the tracker silently fell back to localStorage-only. The recipe library already used the hardcoded bundled project; the tracker tables live there too. Fallback to personal creds retained for anyone who sets them.
- **Cross-device sync uses a single shared anon-key dataset keyed by date, no per-user auth**: for a personal single-user app this is what makes cross-device "just work" with zero setup. Trade-off: anyone running the app sees the same data. Documented future path: add a passphrase or Supabase Auth and scope rows by `user_id`. Not built — deferred until/unless Saffron wants privacy/multi-user.
- **Saved meals are linked + product-level, not a flat macro snapshot**: Saffron wants to reuse the same meal across days *and* tweak quantities, and have edits to a staple's nutrition flow through. So items carry `source_id` (staple link) + `per_unit` macros + `qty`. A "flat macro blob" is just the degenerate one-item manual case — falls out of the same model.
- **Deficit = TDEE − Food, with Goal excluded and exercise folded into TDEE**: Apple Watch EOD total burn already includes active/workout energy, so adding logged exercise on top would double-count. Goal stays out of the deficit equation (Saffron's explicit call) but still drives macro targets.
- **No-TDEE days show "— log TDEE" rather than a computed number (option a)**: `exercise − food` isn't a real expenditure and would read as a phantom deficit. Honest blank until the day's burn is entered.
- **Surface write failures via res.ok check**: silent failures previously masked the entire persistence problem; never again.
- **Saved-meal naming via browser `prompt()`**: quick and reliable in the PWA; flagged as easy to swap for an in-modal field later.

## Current State (end of session)
All five PRs merged to `main`. The live app at cache `v23` has: working cross-device persistence, bulk staple import, saved meals with linked items + quantity editing, and TDEE-based deficit. Both Supabase migrations (`saved_meals`, `day_meta.tdee`) are applied. The save-conversation skill is in the repo and available to future Cloud sessions.

## Next Steps
1. **Saffron to load v23** — reopen the PWA twice (or hard-refresh) so the service worker updates; verify staples list, saved meals, and TDEE/deficit all behave.
2. If saved-meal naming feels clunky on mobile, replace the `prompt()` calls (`trkSaveMealFromSlot`, `trkSaveMealFromQa`, `trkRenameSavedMeal`) with an in-modal text field.
3. Optional: if privacy/multi-user is ever wanted, add a passphrase or Supabase Auth and scope `food_log`/`day_meta`/`saved_meals`/`staple_products` by `user_id` (currently global).
4. Optional: quick-add staple linking matches by name/alias only (`trkFindStapleId`); meals saved from a meal card carry exact `source_id`. Could improve quick-add fidelity if needed.

## Open Questions / Blockers
None outstanding. Privacy/multi-user is the main deferred design question, awaiting Saffron's call.

## Environment & Config Notes
- **Repo:** `saffronlm-cmyk/daily-shuffle`. Mandated dev branch for Cloud sessions: `claude/keen-wright-0ldzxz` (reset to `origin/main` per PR; all work via draft PRs, never pushed to `main` directly).
- **App shape:** single `index.html` + `sw.js`. No build step. JS lives in `<script>` blocks; validate by evaluating each block with `new Function(...)`.
- **Supabase project:** `jsxcctrskkkxgdxfaduo` (`https://jsxcctrskkkxgdxfaduo.supabase.co`). Anon key hardcoded as `RECIPE_LIB_KEY` (`index.html:1102-1103`); tracker uses `TRK_SB_URL`/`TRK_SB_KEY` (~`index.html:4765`).
- **Tracker tables:** `recipes`, `staple_products` (25 seeded), `food_log` (PK `id` text), `day_meta` (PK `date_key` text, now has `tdee`), `saved_meals` (PK `id` text). All have open `anon ALL` RLS. Writes use `Prefer: resolution=merge-duplicates` so re-POSTing a row by PK upserts.
- **Service worker:** bump `CACHE` in `sw.js` on every shippable change (currently `daily-shuffle-v23`) or the PWA serves stale cached HTML.
- **AI features:** call Anthropic directly from the browser with the user's `ds_api_key` (localStorage), model `claude-haiku-4-5-20251001`, header `anthropic-dangerous-direct-browser-access: true`.
- **Proxy gotcha:** the agent environment's HTTPS proxy blocks direct `curl` to `*.supabase.co`; validate REST behaviour via the Supabase MCP (e.g. `set local role anon;` to test RLS) rather than curl.

## Notes & Gotchas
- **PWA caching is the #1 "it didn't work" cause.** After any merge, Saffron must reload twice / hard-refresh for the new `sw.js` cache version to take effect. If a fix "isn't showing," check the cache version first.
- **Repo has no CI** (`get_status` → `total_count: 0`) and no required checks, so PRs merge freely once opened.
- **Same dev branch reused across PRs.** Because every PR uses `claude/keen-wright-0ldzxz`, build sequential PRs one at a time: reset the branch to `origin/main` only *after* the previous PR merges, or they collide.
- **Write helpers are now fail-loud** — if a sync ever breaks, expect a ⚠ toast, not silent data loss.
- **Don't double-count exercise on TDEE days** — this invariant is baked into the deficit math; preserve it if the header is ever refactored.

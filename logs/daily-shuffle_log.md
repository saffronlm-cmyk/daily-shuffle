# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

# Recipe Parser Overhaul + Persistent Locked Plan + Drink Tracking
**Date:** 2026-06-29
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Status:** Complete — implemented, verified, pushed; draft PR #24 open (no CI in this repo)

---

## Project Context
Single-file PWA (`index.html`, ~5,900 lines, no build step) — see the 2026-06-25 entry for the
broader normalisation/price-book stream and architecture. This session is a separate UX/parsing
pass driven by a `/goal` task across three tabs (Shuffle, Tracker, Add Recipe).

## Session Goal
Three asks: (1) make the shuffled meal plan persist + lockable ("set in stone"); (2) add drinks/coffee
tracking to the Tracker; (3) overhaul Add Recipe AI parsing — separate qty/ingredient/prep, parse macros
in the same call, and resolve the "Key ingredients to buy" field's role vs the grocery list.

## State Before This Session
- `currentPlan` was in-memory only (lost on reload). Calendar already rendered in `renderPlanOutput`.
- Tracker `TRK_MEALS = [breakfast,snack,lunch,dinner,dessert]`; no drinks bucket.
- Recipe parser (`parseWithAI`) returned ingredients as `{group, item}` (one mashed string incl. qty+prep).
  No macros in the parse — separate `estimateNutritionWithAI` second step. `prefillForm` dumped flattened
  items into `f-ingredients` ("Key ingredients to buy") and left the real Ingredients textarea EMPTY.
- **Key finding:** `groceryItems` / the `f-ingredients` field is STORED BUT NEVER READ. The grocery list
  (`_groceryAggregate`) is built entirely from `RECIPE_FULL_DATA[id].ingredients` (full list, summed).
  So the user's hypothesis was exactly right — the field was vestigial and only risked confusing costs.

## What Was Done
- **Parser (`parseWithAI`)**: ingredient schema → `{group, qty, unit, item, prep}` with explicit split rules
  + examples; added `nutrition {kcal,protein,carbs,fat}` (per-serving estimate). `prefillForm` now rebuilds
  readable grouped lines ("qty unit item, prep") into `f-ingredients-full` (the real source of truth) and
  fills method/tips/storage/macros. Stopped concatenating tips/storage into Notes (they have own fields now).
- **Removed the "Key ingredients to buy" field** (`#f-ingredients`) from the form; dropped its refs in
  `addRecipe` (groceryItems now `{}`), `prefillForm`, `clearForm`. Relabelled Ingredients textarea to say it
  builds the grocery list. Fixed a latent bug in `estimateNutritionWithAI` (`i.item` map) to handle the
  structured `{qty,unit,name}` shape.
- **Plan persistence + lock**: added `savePlan()`/`revivePlan()` (ds_current_plan; ISO dates + recipe id/name
  snapshots, rehydrated to live recipe refs or a stub), `planLocked` (ds_plan_locked) + `togglePlanLock()`,
  a lock bar in `renderPlanOutput`, guards in `respinDay`/`openPicker`, reshuffle disabled while locked,
  lock reset on fresh generate (both manual + AI), `revivePlan()` wired into DOMContentLoaded. CSS for the bar.
- **Tracker drinks**: added `'drinks'` to `TRK_MEALS` + a "🥤 Drinks & coffee" chooser tile with one-tap
  presets (`TRK_DRINK_PRESETS`) and a custom-drink form (`trkOpenDrinks`/`trkAddDrinkPreset`/`trkSubmitDrink`).
- Bumped `sw.js` CACHE v24 → v25.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | All three features | Modified | /home/user/daily-shuffle/ |
| sw.js | Cache bump v24→v25 | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

## Decisions & Reasoning
- **Removed the key-ingredients field rather than keeping it**: it was provably dead code (never read), and
  the grocery list is already the sum of full ingredients — keeping it only invited the confusion the user
  flagged. Single source of truth = the Ingredients textarea.
- **AI splits fields, but save path still re-parses the rebuilt textarea**: keeps ONE storage code path
  (manual `parseQty` → `{qty,unit,name,note}`) instead of forking on AI-vs-manual. parseQty + `_stripPrep`
  already separate qty and strip prep for the grocery key, so "200g chicken thighs, sliced" → grocery key
  "chicken thighs". Lower risk than rewriting `addRecipe`'s storage.
- **Lock via handler guards, not per-button markup**: the calendar generates respin/pick buttons in many
  places; guarding `respinDay`/`openPicker` (+ disabling reshuffle) is far less invasive than conditionalising
  every button, and can't be bypassed.
- **revivePlan stores name snapshots**: so a deleted / not-yet-synced recipe still shows a label instead of
  "—"; live recipe is preferred when present.

## Current State (end of session)
All implemented, committed (branch `claude/recipe-parsing-ingredients-1ta5nr`), pushed. Draft PR #24 open.
Verified clean on the first pass — see Next Steps for the verification method. Subscribed to PR #24 activity;
no CI in this repo (`get_status` total_count 0); one-shot self check-in scheduled ~1h out.

## Next Steps
1. User reviews PR #24; merge when happy (repo merges freely, no CI).
2. After deploy, hard-refresh twice for the v25 cache to take (known PWA gotcha).
3. Optional follow-ups: parser could store qty/unit/prep structurally end-to-end (skip the textarea re-parse);
   drinks presets could be user-editable; consider a "water total" summary in the tracker.

## Open Questions / Blockers
N/A — all asks implemented with documented defaults. The user phrased some asks as questions; decisions above
are reversible if they disagree.

## Environment & Config Notes
Branch `claude/recipe-parsing-ingredients-1ta5nr`, cwd /home/user/daily-shuffle. No CI. Verify method:
`new Function()` over each `<script>` block (3 blocks, 0 failures) + headless Playwright smoke
(executablePath /opt/pw-browsers/chromium). Supabase recipe-library fetch fails in sandbox (network blocked) —
pre-existing, unrelated.

## Notes & Gotchas
- `groceryItems` on recipe objects is now always `{}` for new recipes; old recipes keep theirs but it's still
  never read — safe.
- Adding to `TRK_MEALS` is the supported way to add a tracker bucket; it drives both rendering and the meal
  `<option>` lists. No schema change needed (food_log keys by meal_id string).
- Bump `sw.js` CACHE on any further change or the PWA serves stale HTML.

---

# Ingredient Normalisation, Consolidation & Variant-Level Price Book
**Date:** 2026-06-25 (session spanned 2026-06-06 → 2026-06-25)
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — Phase 1 (naming/normalisation) complete; Phase 2 (apply to app) pending

**Branch / merge status:** All artifacts below live on branch `claude/recipe-ingredient-prices-RYSob`, which is **not merged** to `main` (its `index.html` predates main's nutrition-tracker work, so it conflicts; only this log entry was brought to `main`). NOTE: `main` already has the **Apify price-book pipeline** that *consumes* `pricebook.csv` — see the "Apify price-book pipeline" entry below; that is the Phase-3 auto-pricing this entry refers to as future work. `main` holds an older 988-row `pricebook.csv`; this branch produced the cleaner 812-row version.

---

## Project Context
Daily Shuffle is a single-file PWA (`index.html` ~250 KB + `legacy/` stashed modules) for shuffling
recipes into meal plans with a grocery list and a cost/price book. Recipes live in Supabase
(`recipes.ingredient_sections`, free-text). The price book lives in browser `localStorage`
(`ds_pricebook`) and syncs to Supabase `user_library`. Goal of this work stream: turn the messy,
free-text recipe ingredients into a clean normalised vocabulary so each ingredient can be priced once
and recipe/plan/grocery costs compute automatically. First entry in this log — full roadmap also lives
in `HANDOFF.md` at repo root (the living roadmap; this log is the session record).

## Session Goal
Scope missing ingredient prices → normalise the recipe ingredient wording → consolidate
like/comparable variants → produce a variant-level price book the user can fill in → set up the
machinery (CSVs + in-app importers) to apply it all later.

## State Before This Session
Nothing existed for this stream. Price book was a 38-row seed in `index.html`. Recipe ingredients were
raw free-text with no normalisation, no consolidation, no per-ingredient pricing. No roadmap doc.

## What Was Done
A long, iterative build, roughly in order:
1. **Scoped** the architecture: recipes in Supabase (project `jsxcctrskkkxgdxfaduo`), 305 ready recipes /
   3,915 ingredient lines (3,485 real, **430 null** across 36 recipes). Found the engine fns
   (`canonicalise`, `parseQty`, `_toBase`, `classifyAisle`, `lookupPriceBook`, `savePriceBook`,
   `computeRecipeCost`, `_groceryAggregate`) and the unused `priceBook[].aliases` hook.
2. **Missing-prices sheet** (615 unpriced ingredients) → **recipe normalisation worksheet** (3,915 lines
   parsed to qty/unit/ingredient/note).
3. Built **two in-app importers** in `index.html` (committed, NOT deployed): "Import ingredient CSV"
   (`importRecipeIngredientsCsv`) and "Import price CSV" (`importPriceBookCsv`).
4. **Consolidation**: built a rules-engine clusterer; iterated through several rounds of the user's
   specific decisions to merge/keep-distinct comparable variants; produced a reviewable
   consolidation worksheet and a comprehensive **category → product → variant** master list.
5. **Re-modelled** after the user edited the master: confirmed the tier semantics (see Decisions), split
   the "compound" problem into true ingredient-splits vs prep/medium-to-note, produced a reconciled
   **split-plan** (28 splits), applied splits + pepper normalisation.
6. **Full master-driven regeneration** (`tools-apply-master.mjs`): the user's curated master became the
   single source of truth; generated the final recipe worksheet (names from master) + variant-level
   price book.
7. **Fixed a matcher gap** the user flagged: exact-canon matching only covered 92% of lines; switched to
   `canon(cleanRaw(name))` + UK/US spelling normalise (yoghurt↔yogurt) → **99%**. Exported the residual
   32 wordings for fold-in.
8. **Tidied** the repo to a self-contained pipeline; **promoted the edited master into the repo**;
   wrote/realigned `HANDOFF.md` as the project roadmap (none existed); saved this session log.

Things tried and corrected: initially had **product/variant roles backwards** (assumed product = price
unit) — the user's edits proved variant = price unit, product = family; re-modelled accordingly.
Initially conflated ingredient-splits with prep/medium separation — the user caught it; separated them.

## Artifacts Produced / Modified
Branch: `claude/recipe-ingredient-prices-RYSob`. Repo root unless noted.

| File | What it is | Status | 
|------|-----------|--------|
| `ingredient-master.csv` | **Naming source of truth** — user-curated `category/product/product change/variant/variant change/…`. Promoted from upload into repo. | Created |
| `split-plan.csv` | 28 confirmed compound splits + renames (input) | Created |
| `recipe-ingredient-normalisation.csv` | Original per-line parse from Supabase (input; source of `original_line`) | Created |
| `tools-apply-master.mjs` | **Generator** — `node tools-apply-master.mjs` → the two outputs. Matches on `canon(cleanRaw(name))`+spelling-normalise | Created |
| `recipe-ingredient-normalisation.final.csv` | **Output** — recipes with `ingredient` = master `variant change`; splits baked in; ~99% mapped (`review='unmatched'` flags misses) | Created |
| `pricebook.csv` | **Output / fill-in sheet** — one row per variant (price unit): `Ingredient, Product, Category, Pack size, Pack unit, Pack price, Store, Aliases, occurrences`; ~811 variants, usage-sorted | Created |
| `unmatched-ingredients.csv` | ~32 residual recipe wordings to fold into the master | Created |
| `HANDOFF.md` | The project roadmap for this stream (Phases 0–4, data model, file inventory) | Created |
| `logs/daily-shuffle_log.md` | This session log | Created |
| `index.html` | Added the two importers (Settings → Recipe Library / Price Book) | Modified |
| `docs/SESSION-LOG.md` | Improvised raw-ish transcript before the skill was available | **Deleted** (superseded by this structured log) |
| `missing-ingredient-prices.csv`, `pricebook-aliases.csv`, `ingredient-consolidation.csv`, `ingredient-master`(auto baseline)`, `recipe-…consolidated.csv`, `compound-split-candidates.csv`, `tools-cluster-ingredients.mjs`, `tools-apply-consolidation.mjs` | Superseded generations + tools | **Deleted** (in git history) |

## Skills Used
| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This handoff log (Rolling Log + GitHub Push mode, full template) |

## Decisions & Reasoning
- **Data model — variant = price unit + recipe name; product = family/grouping only; category = aisle.**
  Confirmed from the user's master edits (almond/soya/dairy milk all → product "Milk" but priced
  separately as variants). Product is organisation, *not* a shared price. (I had it backwards first;
  the edits corrected me.)
- **Apply to both price book + recipes, moderate grouping, reviewable-CSV-first.** Chosen via
  AskUserQuestion. Non-destructive: the master keeps the original `variant` and adds `*_change`
  columns, so the mapping is auditable/re-runnable and traceable back to recipes.
- **Aliases attach to the variant, not the product**, and **recipes are rewritten to the variant**, so
  the grocery list groups naturally without code; `product` is carried into the app only to *group*
  the grocery list within an aisle. Leverages the pre-existing-but-unused `priceBook[].aliases`.
- **Splits happen at recipe-line grain (qty is per occurrence); name changes are 1→1 via the master;
  prep/medium descriptors (in brine, drained, to taste) move to the note — NOT a split.** The user
  flagged that splitting-ingredients vs separating-prep are different operations; kept them separate.
- **Specific consolidation rules** (locked): `A or B`→first+note · only `white sugar`→Sugar · flavoured
  yoghurts distinct · bare defaults (onion→Yellow Onion, flour→Plain Flour, butter→Butter,
  cabbage→White Cabbage, oil→Vegetable Oil, yog(h)urt→Plain Yoghurt) · citrus juice/zest/whole→fruit ·
  light olive oil→Olive Oil · light/dark soy & Light Sour Cream distinct · white pepper distinct ·
  cracked/ground/black→Black Pepper · UK spellings · `dairy free milk` intentional · nut butters ≠
  Butter · named oils ≠ Vegetable Oil · jasmine/basmati rice protected.
- **Matcher: `canon(cleanRaw(name))` + yoghurt↔yogurt normalise, not exact canon.** Exact-canon left
  qty/measure cruft ("juice of 1 lime", "sheets rice paper", "½ cups bean sprouts") and the UK/US
  yoghurt spelling unmatched → only 92%. The cleaned key (same cleaning the master keys were built
  with) → 99%, and dropped price variants 987→811.
- **Master promoted into the repo + superseded files removed.** Makes the pipeline self-contained and
  not dependent on the ephemeral upload path; reduces confusion. History preserves the removed tools.
- **HANDOFF.md is the roadmap** because no project-wide phasing doc existed; `legacy/README.md` is a
  separate parallel track (stashed Track/Pantry/Wellness modules to re-graft later).

## Current State (end of session)
Phase 1 done: recipe ingredient names normalised in `recipe-ingredient-normalisation.final.csv`
(~99% mapped to the master; **computed in the CSV, NOT yet written to live recipes**), 28 splits
applied, variant-level `pricebook.csv` scaffolded (empty prices), residual 32 in
`unmatched-ingredients.csv`. Importers exist on the branch but the branch is **not deployed**. Nothing
has been written to the live Supabase recipes or the live price book yet.

## Next Steps
1. **User fills `pricebook.csv`** top-down (usage-sorted; first ~100 cover most recipes); tidy rough
   Product labels (e.g. `Maple Syrup → "Syrup"`).
2. Optionally **fold `unmatched-ingredients.csv` (32 rows)** into `ingredient-master.csv`, then re-run
   `node tools-apply-master.mjs`.
3. **Phase 2 — apply to the app** (next session): (a) extend `importPriceBookCsv` to read **Aliases** +
   **Product** columns and allow alias-only rows; (b) add a `product` field to price entries and group
   the grocery list **by product within aisle**; (c) tighten the greedy `lookupPriceBook` substring
   fallback (egg↔eggplant) now aliases exist; (d) **PR to deploy** the branch; (e) import
   `recipe-ingredient-normalisation.final.csv` + filled `pricebook.csv`; (f) handle the `-2/-3` split
   row_key ordering in the importer.
4. **Re-enter the 430 null lines** (36 recipes) from source.
5. **Phase 3 — auto-pricing** (Supabase Edge Function or local scraper, keyed on the variant vocab;
   manual-override flag). **Phase 4 — cost features** (recipe/plan cost surfacing, shop-by-product
   grocery, per-100g, budget-aware planning, price history, store comparison) — see HANDOFF.md §5.

## Open Questions / Blockers
- Orange juice: rolled into `Orange` (fruit) — fine if squeezed, wrong if a carton; user to confirm.
- `Garlic Clove` vs `Garlic` still separate variants — merge by setting `variant change = Garlic`?
- Where the "dairy-free sub OK" style notes should surface (recipe note vs price-book note).
- Not blocking: waiting on the user to fill prices to validate the whole model end-to-end.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`, branch `claude/recipe-ingredient-prices-RYSob` (work NOT on
  `main`; not deployed). Cloud/remote Claude Code env with a **network allowlist** (direct Supabase
  REST was blocked; used the Supabase MCP instead).
- Supabase project `jsxcctrskkkxgdxfaduo` ("saffronlilith's Project"). Tables: `recipes`
  (`ingredient_sections` JSONB, `import_status='ready'`), `user_library` (row `id='default'`, holds the
  synced price book blob; `priceBook` field currently empty).
- App secrets already in `index.html`: `RECIPE_LIB_URL` + anon key (`RECIPE_LIB_KEY`). localStorage keys:
  `ds_pricebook`, `ds_recipe_cache`, `ds_overrides`, `ds_custom_recipes`.
- Pipeline: `node tools-apply-master.mjs` reads `ingredient-master.csv` + `split-plan.csv` +
  `recipe-ingredient-normalisation.csv` → writes the two output CSVs. Node 22; scripts are ESM `.mjs`.
- In-app importer entry points (index.html): `importRecipeIngredientsCsv`, `importPriceBookCsv`,
  `patchRecipeToLibrary` (pushes recipe edits to cloud), `lookupPriceBook` (~line 2750),
  `savePriceBook` (~2558).

## Notes & Gotchas
- **Recipe ingredients store medium/prep inline** ("tuna in brine", "1 large carrot, diced") — the
  parser moves these to the note; don't treat them as splits.
- **UK vs US spelling**: master uses "yoghurt"; recipes mix "yogurt" — the matcher normalises
  yoghurt↔yogurt. Any new matching logic must keep this.
- **430 null recipe lines** have no text at all (lost on import) — they can't be normalised, only
  re-entered from the original recipes.
- **Split rows use `row_key` suffixes `-2/-3`** — the importer currently sorts by numeric section/line;
  it must be taught to order these (Phase 2).
- **`.numbers` files can't be parsed** here (Apple proprietary) — always ask for CSV export.
- The `present_files`/file-delivery to the user worked throughout via the file-send tool; CSVs were the
  exchange format.

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

# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

# Quantity Normalisation — §6 Decisions Signed Off (step 2, ruleset locked)
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — the 5 open questions from the step-2 proposal are answered and locked into `quantity-normalisation-plan.md`. Ruleset is now ready to *apply* in a future session; no recipe data touched yet; step 3 still not started.

---

## Project Context
Immediate follow-up to the entry below ("Ingredient Quantity Normalisation — Ruleset & Source-of-Truth Proposal"). That proposal (PR #34) was merged, then Saffron answered the §6 sign-off questions in chat. This session records those answers durably in the plan doc.

## Session Goal
Pose the §6 open questions to Saffron and bake her answers back into `quantity-normalisation-plan.md` so the apply-session has them without re-litigating.

## What Was Done
- Posed the 5 §6 questions (4 via the question picker, garnish inline). Answers:
  1. **Source of truth** → new non-destructive `ingredient_grams` jsonb column (as recommended).
  2. **Cup basis** → **UK cup = 250 ml** (Saffron overrode my US-240 ml recommendation).
  3. **Bare mains** → default portion + `estimated` flag (as recommended).
  4. **Garnish/"to serve"** → 5 g default (as recommended).
  5. **8 no-`serves` recipes** → **skip them** (Saffron overrode my "normalise anyway"); flag `serves_missing` for a manual serves fill first.
- Updated `quantity-normalisation-plan.md`: added a "Resolved decisions" box at top; changed §3.3 base cup 240→**250 ml** and recomputed the **nine density-derived cup values** (water 250, soy 275, oil 227, syrup 350, sugar 213, paste 263, dairy 255, flour 133, cocoa 103; fallback liquid 250, fallback solid 156) — left the empirical measured cup-weights (cheese/rice/oats/leafy/berries/veg) unchanged since those are weighed, not density-derived; updated the §4 pumpkin-puree example to 255 g; §5 step 1 now says skip the 8 no-serves recipes with a `serves_missing` flag; rewrote §6 from "open questions" to "resolved decisions".

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| quantity-normalisation-plan.md | Ruleset doc, decisions now locked in | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

## Decisions & Reasoning
- **UK cup (250 ml) over US (240 ml)**: Saffron's call; she's UK-based. Only the cup differs from US (tsp/tbsp identical), and only the *density-derived* cup cells scale by 250/240 ≈ ×1.042 — the measured solid cup-weights (1 cup rice = 185 g etc.) are empirical and unaffected.
- **Skip the 8 no-serves recipes rather than normalise-then-divide-later**: Saffron preferred not to produce per-serving nutrition off a guessed serves count; cleaner to block them behind a manual serves fill (`serves_missing` flag) than to carry an estimate through step 3.

## Current State (end of session)
Plan doc fully reflects the locked decisions. `recipes`/`staple_products` unchanged. Branch `claude/daily-shuffle-qty-normalisation-d8su8h` restarted from merged main (post-#34) with the doc/log update; new draft PR to be opened (the old #34 is merged and must not be reused).

## Next Steps
1. **Apply-session** (future): add `ingredient_grams` jsonb column via `apply_migration`; run §3 over the 327 recipes (skip the 8 no-serves, flag `serves_missing`); emit the pre-write review CSV for spot-check; set `review_flags += quantities_estimated` where lines are `estimated`/`unresolved`.
2. **Then** step 3 (bulk nutrition) using expanded `staple_products` + `ingredient_grams`.

## Open Questions / Blockers
N/A — all five sign-off questions resolved.

## Environment & Config Notes
Same as the entry below. Branch `claude/daily-shuffle-qty-normalisation-d8su8h` (restarted from main after #34 merged, per the merged-PR-is-finished convention). No app-code change → no cache bump.

## Notes & Gotchas
- Only density-derived cup cells were rescaled to 250 ml; measured cup-weights were deliberately left. If a future editor "fixes" the measured rows to 250 ml by formula they'll be wrong — those are weighed values.
- The old proposal PR #34 is **merged** — do not reopen it; this follow-up is a new PR on a fresh branch off main.

---

# Ingredient Quantity Normalisation — Ruleset & Source-of-Truth Proposal (step 2, planning)
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — proposal written for review; **no recipe data touched.** Awaiting Saffron's sign-off on 5 open questions before any live write.

---

## Project Context
Step 2 of the 3-step nutrition-estimation plan. See the two 2026-07-01 entries below: "USDA Staple Lookup Built…" (step 1, complete — `staple_products` now 167 rows) and "Nutrition Estimation Feasibility…" (the 3-step plan + full background). Step 3 (bulk recipe nutrition pass) is deliberately still pending and must not run until quantities are normalised and this proposal is approved.

## Session Goal
Propose the ingredient-quantity normalisation ruleset (gram-weight defaults/conversions for vague units + a "to taste"/unquantified policy) and a quantity-source-of-truth approach, grounded in the *actual* shape of the data, for review before touching anything. Explicitly did NOT apply changes or run step 3.

## State Before This Session
Step 1 done. Quantities never normalised: `ingredient_sections` still mixes legacy plain-string lines and newer `{qty,unit,name,note,group}` objects, with many `qty:null` "to taste"/no-amount lines. No gram-normalisation had ever been attempted.

## What Was Done
Measured the data live via Supabase MCP (project `jsxcctrskkkxgdxfaduo`) rather than assuming, then wrote the proposal:
1. **Item-shape census**: 4049 legacy strings, 56 structured objects, 53 nulls (blank placeholder lines). Confirmed the `jsonb_typeof` branch is real and strings dominate.
2. **Unit-bucket distribution** across all real lines (first-match precedence): tbsp 831, tsp 734, leading-number-no-unit 601, already-metric(g/ml/l) 599, no-number-no-unit 549, cup 435, vague(pinch/dash/handful/scoop/slice/sprig/bunch) 204, clove 88, imperial 32, "to taste" 32. → ~35% already metric/trivial, ~49% deterministic conversion, ~16% the judgement tail.
3. **Sampled** the hard buckets: dual-unit lines carry an embedded gram (`1 cup (60g)`, `3 tbsp / 65ml`, `1/2 cup (150g)`) → highest-confidence signal; the no-number tail splits into bare seasonings, garnish/"to serve", and bare mains missing a qty (`Chicken breasts`, `chickpeas`).
4. **Found a reusable accelerant**: `recipe-ingredient-normalisation.final.csv` (repo root, from the 2026-06-25 stream) already holds per-line `qty,unit,ingredient,note` keyed `recipe_id|section_ord|item_ord` — parsed stated qtys but never converted to grams or filled blanks; predates recipes added since, so treat as accelerant not source of truth.
5. **Wrote `quantity-normalisation-plan.md`** (repo root): the full ruleset — density-class volume→gram table (tbsp/tsp/cup, because a tbsp of oil vs honey vs cocoa differ hugely, so a flat "1 tbsp=15g" is wrong), per-piece count→gram table, vague-measure defaults, imperial/range/fraction/dual-unit/heaped parsing, and a 4-way unquantified policy (to_taste / garnish / estimated bare-main / unresolved) each with a `qty_source` provenance flag. Recommends a **new non-destructive `ingredient_grams` jsonb column** on `recipes` (parallel array indexed by sec|item) rather than mutating `ingredient_sections` — this *changes the approach floated in the prior log* ("apply across ingredient_sections"), flagged explicitly as open-question #1.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| quantity-normalisation-plan.md | The step-2 proposal (ruleset + source-of-truth + open questions) | Created | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

No recipe/Supabase data changed. No `index.html`/`sw.js` change → no cache bump needed.

## Decisions & Reasoning
- **New `ingredient_grams` column over mutating `ingredient_sections`**: non-destructive/reversible (drop column), zero app-code risk (app reads `ingredient_sections` for display + grocery list; converting 4049 strings→objects would touch every render path for no nutrition benefit), self-describing audit (`qty_source`+`detail`), clean step-3 input. Departs from the prior log's in-place framing on purpose — raised as open Q1 for a yes/no.
- **Density-class volume table, not a flat per-spoon gram**: oil ≈14g/tbsp, honey ≈21g, cocoa ≈6g, flour ≈8g — a single default would be systematically wrong on a large share of the 2000+ tbsp/tsp/cup lines. Class chosen by keyword-matching the ingredient name (reuse `staple_products` aliases).
- **Prefer the embedded metric on dual-unit lines** (`1 cup (60g)` → 60g): highest-confidence signal, ~599 lines already have it; ignore the vague half.
- **Bare mains get a default portion + `estimated` flag (recommended) not left null**: keeps calorie totals realistic while marking low confidence via per-line `qty_source=estimated` + recipe-level `review_flags += quantities_estimated`. Left as open Q3 since it trades honesty vs completeness.
- **US cup = 240ml** (vs UK 250ml): `cup` is a US convention and this corpus's UK recipes use metric weights; ~4% effect. Open Q2.
- **Reviewable-CSV-first before any live write**, per the established pricebook/staples convention.

## Current State (end of session)
Proposal complete and committed on branch `claude/daily-shuffle-qty-normalisation-d8su8h`. `recipes` unchanged (no `ingredient_grams` column exists yet). `staple_products` unchanged (167 rows from step 1). Nothing applied. Draft PR to be opened.

## Next Steps
1. **Saffron reviews `quantity-normalisation-plan.md`** and answers the 5 open questions (esp. Q1 source-of-truth column, Q3 bare-main portioning). Red-line the §3 conversion tables.
2. On approval: `apply_migration` to add `ingredient_grams` jsonb to `recipes`; run the §3 rules (deterministic parts mechanical, judgement parts Claude-reasoned per line) over all 327 recipes via Supabase MCP; emit a per-line review CSV before the live write; set `review_flags += quantities_estimated` where needed.
3. **Then** step 3 (bulk nutrition) using expanded `staple_products` + `ingredient_grams`.

## Open Questions / Blockers
The 5 sign-off questions in §6 of `quantity-normalisation-plan.md`: (1) new column vs in-place; (2) US vs UK cup; (3) bare-main portioning aggressiveness; (4) garnish 5g default vs exclude; (5) handling the 8 no-`serves` recipes. All block execution but not the proposal. Recommendations given for each.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/daily-shuffle-qty-normalisation-d8su8h` off latest `main` (PR #33 merged). cwd `/home/user/daily-shuffle`.
- Supabase project `jsxcctrskkkxgdxfaduo`: `recipes` (327 non-deleted; `serves` set on 319/327; `ingredient_sections` jsonb two-shaped; `review_flags` array exists; no gram column yet). Supabase MCP reads work fine from this sandbox (USDA/Apify egress still blocked, but irrelevant here — no external calls needed for step 2).

## Notes & Gotchas
- **Unicode-fraction gotcha**: a `\m[0-9]` regex does NOT match `½/¼/¾/⅓/⅔/⅛`, so lines like `½ tsp baking soda` leak into "no-number" buckets. The proposal's parser normalises unicode fractions first; any future SQL bucketing must include the fraction chars (as the §1 unit-distribution query does).
- **`ingredient_sections` also contains 53 `null` items** (blank placeholder rows, mostly recovered-but-empty sections) — skip these, they carry no ingredient.
- One structured object in the wild has a parser miss: `{"qty":null,"name":"70g vegan chocolate protein powder"}` — the gram is stuck in the name. The §3 parser should re-extract leading metric from names, not just trust the `qty` field.
- Don't run step 3 until quantities are approved+applied — the whole point of step 2's ordering.

# USDA Staple Lookup Built + 122 Generic Staples Loaded to Supabase
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — step 1 of the 3-step nutrition plan done end-to-end (script built, run by Saffron locally, reviewed, applied to `staple_products`). Steps 2 (quantity normalisation) and 3 (bulk recipe nutrition pass) still pending.

---

## Project Context
Direct continuation of the 2026-07-01 "Nutrition Estimation Feasibility — Research & Planning" entry (immediately below). That session produced a 3-step plan: (1) expand `staple_products` via a local USDA lookup script; (2) normalise ingredient quantities; (3) bulk-repopulate recipe nutrition. This session executed step 1 in full.

## Session Goal
Build `scripts/usda_staples.py` (Next Steps #1 from the prior entry), have Saffron run it locally against USDA FoodData Central, review/fix matches over several iterations, and apply the confirmed generic-staple macros into the bundled Supabase `staple_products` table.

## State Before This Session
Planning done, nothing built. `staple_products` had 45 rows, all Saffron's branded/specific products (plus a few she'd since added as "(generic)" — see Gotchas), no generic pantry basics like salt/oil/garlic. Saffron held a USDA FDC API key locally.

## What Was Done
1. **Regenerated the candidate list**: re-ran the ingredient-frequency SQL (in the prior entry) via Supabase MCP → 209 names ≥4 recipes. Hand-deduped to **`scripts/staple_candidates.csv`** (~135 canonical names): merged regex artifacts / plurals / near-synonyms (e.g. `arlic cloves`→garlic), dropped junk (`water`, `oil`, `of salt`), and added `force-include` core items (potato, butter, cheddar, beef mince, lentils, black beans, bread, pasta, natural yoghurt). Columns: `name,category,recipe_count,source,merged_from`.
2. **Built `scripts/usda_staples.py`** (stdlib-only, build-only, mirrors `price_pricebook.py`): searches FDC `Foundation,SR Legacy`, extracts per-100g cal/protein/carbs/fat/fibre/sugar, writes a reviewable CSV with match score + confidence flag. Modes: `--dry-run`, `--probe`, `--sample`, `--in/--out`.
3. **Iterated over ~5 rounds of Saffron running it locally** (sandbox is gateway-blocked from `api.nal.usda.gov`, so she runs it and pastes results back — same pattern as Apify). Fixes made in response to real output:
   - **Foundation energy bug**: Foundation foods store Energy under nutrient number **957/958** (Atwater), not 208 → calories came back blank for ~20 items. Fixed `extract_nutrients` to resolve 208/957/958 (KCAL only, priority-ordered).
   - **Wrong-form matches**: word-overlap scoring rubber-stamped wrong forms (avocado→"Oil, avocado", carrot→dehydrated, milk→"Crackers, milk", etc.). Added ~45 `TERM_OVERRIDES` steering to the right whole/raw/cooked entry or a documented proxy.
   - **Override scoring**: `match_score` now scores against the override term (not `max(name,term)`) when a name has an override — a bare name that fully matches several forms saturated at 1.0 and couldn't distinguish them (coconut cream sweetened vs raw).
   - **Detail-endpoint 404s**: FDC `/food/{fdcId}` 404s on some entries (egg, milk, cheddar, tuna, dill, dijon) — now non-fatal, falls back to nutrients embedded in the `/foods/search` payload.
   - **`REJECT_SUBSTRINGS`** (puff/fries/tots/tater) so raw sweet potato beats "Sweet Potato puffs".
   - Per Saffron's calls: beans/grains → **cooked** forms (rice/pasta/chickpeas/lentils/black beans); sweetcorn → whole kernel; coconut cream → unsweetened/raw; oats stay dry.
4. **Applied to Supabase** (this channel is NOT sandbox-blocked): assembled final rows from the three report CSVs (main + `staple_report_cooked.csv` + `staple_report_retry.csv`, retry/cooked winning), via a local builder (`scratchpad/build_staples_sql.py`). Inserted **122 rows** into `staple_products` (serving 100 g, aliases from cleaned `merged_from`, `flags={usda_seed}`, provenance in `notes`). Table now 45→**167 rows**, all seeded rows have calories.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| scripts/usda_staples.py | USDA FDC lookup script | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates.csv | ~135 deduped candidate names (committed input) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates_cooked.csv | 5-row subset (beans/grains → cooked) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates_retry.csv | 11-row subset (404 recoveries + wrong-form fixes) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/README.md | Docs for the new pipeline | Modified | /home/user/daily-shuffle/scripts/ |
| .gitignore | Ignore `scripts/staple_report*.csv` | Modified | /home/user/daily-shuffle/ |
| `staple_products` (Supabase) | +122 generic-staple rows, tagged `usda_seed` | Modified | project jsxcctrskkkxgdxfaduo |

Report CSVs (`staple_report*.csv`) are git-ignored and live only on Saffron's machine; the data was pasted into this session and is captured in the applied rows.

## Decisions & Reasoning
- **Skipped 7 items Saffron already has as generics** (fish sauce, sriracha, mayonnaise, egg, blueberries, raspberries, almond milk) rather than duplicate — avoids matcher ambiguity, doesn't overwrite her curated values. Where she only had a *branded* version (almond butter/Legend, dark chocolate/Lidl, peanut butter/Pip&Nut, protein powder/Free Soul, tinned salmon), kept the generic as **additive** so bare recipe terms are grounded.
- **Skipped 6 no-USDA-generic items for hand-fill**: nutritional yeast, coconut aminos, gochujang, chilli crisp, thai red curry paste, rice paper.
- **serving 100 g for all** (USDA basis), including liquids — reference macros for grounding, not a serving suggestion.
- **`flags={usda_seed}` + FDC id in `notes`** so the whole batch is identifiable and reversible (`delete ... where 'usda_seed' = any(flags)`).
- **Proxies documented in-code** where USDA lacks a generic: coconut sugar→brown sugar, rice vinegar→distilled vinegar, gochugaru→cayenne, chilli oil→sesame oil, vanilla paste→vanilla extract, dark chocolate→"SPECIAL DARK bar".

## Current State (end of session)
Step 1 complete. `staple_products` = 167 rows (45 original + 122 seeded). The in-app `fetchMacroEstimate` reads this table live and alias-aware, so it benefits immediately with zero code changes. Branch `claude/focused-darwin-enipb5`, draft PR #33 open (scripts + docs; the DB change is not in git). No app code (`index.html`/`sw.js`) touched — no cache bump needed.

## Next Steps
1. **Hand-fill the 6 skipped items** + blank `missing:` cells (milk sugar ≈5g lactose; cheddar/tuna/dijon sugar ≈0; some Foundation produce missing fibre/sugar) in `staple_products` whenever convenient — Saffron said she'll do this as needed.
2. **Step 2 (separate session): ingredient quantity normalisation** — gram-weight defaults for vague units ("1 tbsp", "1 medium avocado") and a policy for "to taste"; apply across `ingredient_sections` for all 327 recipes (branch on `jsonb_typeof` — legacy string vs structured object shapes).
3. **Step 3: bulk Claude Code pass** over all 327 recipes using the expanded `staple_products` + normalised quantities to (re)populate nutrition columns, with chain-of-thought + self-consistency + `review_flags`.
4. Merge PR #33 when happy (no CI in this repo).

## Open Questions / Blockers
- Whether the in-app matcher prefers the new generic over an existing branded row for a bare term (e.g. "peanut butter") wasn't verified against `fetchMacroEstimate`'s exact logic — expected to be fine (closest-canonical match), but worth confirming if estimates look off.
- Carried over, unresolved: chicken thighs/tomato-paste-style Foundation rows have `fibre_g`/`sugar_g` null (legitimately ~0 for meat; left null not 0).

## Environment & Config Notes
- Supabase project `jsxcctrskkkxgdxfaduo`; table `staple_products` (PK on `id` uuid — **no unique constraint on `name`**, so dedupe is manual). Seeded rows tagged `flags @> {usda_seed}`.
- `api.nal.usda.gov` blocked at the sandbox egress gateway (same as `api.apify.com`) — `usda_staples.py` must run on Saffron's machine with `USDA_FDC_API_KEY` exported per shell. Supabase MCP is NOT blocked.
- USDA quirks encoded in the script: Foundation energy = nutrient 957/958; `/food/{fdcId}` 404s on some entries; search payload carries nutrients as a fallback.

## Notes & Gotchas
- **`staple_products` already had a few generics** beyond the "all branded" snapshot in the prior entry (Fish sauce/Sriracha/Mayonnaise/Eggs/Blueberries/Raspberries "(generic)", Unsweetened almond milk, Chilli crisp oil) — those were the 7 skipped. Re-check existing rows before any future bulk staple insert; don't trust the older "no generics" claim.
- **Aliases were cleaned** from `merged_from` (dropped regex artifacts, my annotation parentheticals, and "juice of…" fragments; fixed `arlic→garlic`, `reen→green`, etc.). The raw `merged_from` column still contains the artifacts — don't load it verbatim.
- **`canonicalise` singular/plural quirk**: words ending vowel+"es"/"s" (e.g. "potatoes", "tomatoes") don't reduce to singular, so plural search terms can dock a point off the match score (cosmetic — sweet potato flagged `review_match` at 0.75 despite a correct 86-kcal match). Prefer singular in overrides.
- To roll back this batch: `delete from public.staple_products where 'usda_seed' = any(flags);`

# Nutrition Estimation Feasibility — Research & Planning
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — planning complete, nothing implemented yet; next session executes step 1 of a 3-step sequence

---

## Project Context
See 2026-06-25 ("Ingredient Normalisation…") and 2026-06-29 ("Recipe Parser Overhaul…") entries for architecture background. This session opened a new work stream: whether/how to calculate and persist accurate nutritional info (calories/macros) for the recipe library, and how to raise the accuracy of AI-estimated nutrition generally. Purely research + planning — no code was written or executed this session.

## Session Goal
Assess feasibility and realistic accuracy of estimating recipe nutrition and saving it to the bundled Supabase project, then turn that into a concrete, sequenced implementation plan Saffron can execute across sessions.

## State Before This Session
Unknown to Saffron going in (surfaced this session): the `recipes` table already has `calories`/`protein_g`/`carbs_g`/`fat_g`/`fibre_g`/`sugar_g`/`gi_estimate` columns, ~97% populated — but a live query showed many of those existing values are themselves flagged `review_flags` like `nutrition_not_stated`, `nutrition_incomplete`, `calories_approximate`, meaning a lot of "existing" data is already a prior estimate, not verified truth. An in-app AI estimator already exists (see below) but has a persistence gap nobody had noticed.

## What Was Done
1. **Live Supabase investigation** (project `jsxcctrskkkxgdxfaduo`, via Supabase MCP — this channel is NOT blocked by the sandbox egress policy, unlike raw internet calls, see Environment notes): confirmed schema, counted 335 total recipes / 327 non-deleted, 327 with `calories` set, only 8 with zero nutrition (2 of those have no ingredients at all). Sampled `review_flags` distribution — ~90+ recipes carry a nutrition-uncertainty flag despite having numbers.
2. **Code investigation** (via a research subagent, not exploration I duplicated): found the existing in-app estimator — `fetchMacroEstimate()` / `estimateNutritionWithAI()` in `index.html` (~lines 3206–3337). It calls Claude Haiku (`claude-haiku-4-5-20251001`), grounds the prompt against the user's `staple_products` table (exact macros preferred over guesses), divides by servings client-side. **Gap found: it only saves to `localStorage` (`ds_nutrition` via `saveNutrition()`) and never PATCHes back to the Supabase `recipes` row** — `patchRecipeToLibrary()` (the function that does write to Supabase) doesn't touch the macro columns at all. So AI estimates don't survive a cache rebuild or sync across devices.
3. **Diagnosed why Haiku's estimates are weak**: prompt (`index.html:3224-3236`) demands raw JSON immediately with `max_tokens: 256` — no chain-of-thought/per-ingredient breakdown before the final number, which is the single biggest accuracy lever missing. Only 45 `staple_products` rows exist to ground against. `ingredient_sections` (jsonb) mixes two shapes — legacy plain-text strings (`"2 whole chickens"`) and newer structured objects (`{qty, unit, name, note, group}`, only present in recipes added after the 2026-06-29 parser overhaul) — and many structured `qty` fields are explicitly `null` for "to taste"/no-amount items, so even a perfect ingredient-macro lookup can't fix an unknown quantity.
4. **Checked git/session-log history** to answer "did the ingredient normalisation work already cover quantities?" — No. The 2026-06-25 entry's `ingredient-master.csv` pipeline normalised ingredient *naming* for price-matching only (e.g. "garlic clove(s)" variants → one canonical name); it explicitly left 430 lines across 36 recipes null rather than inventing quantities. The 2026-06-29 parser split *already-stated* qty/unit/name apart for new recipes going forward, but never retroactively applied to the existing 327, and never fills in a quantity when the recipe never gave one. Quantity normalisation (vague units like "1 tbsp"/"to taste" → gram-weight estimates) has never been attempted — confirmed as a genuinely open gap, not a re-run of prior work.
5. **Ran an ingredient-frequency analysis** across all 4,104 ingredient lines (SQL below) to scope a staple-expansion target: 209 unique ingredient names appear in ≥4 recipes (covering ~59% of all lines); 457 names at ≥2 recipes (~73%); 1,080 names are singleton (appear in exactly 1 recipe, long tail not worth systematic pre-loading). Cross-checked against the current 45 `staple_products` rows — they're almost entirely Saffron's specific branded products (Legend almond butter, Pip & Nut peanut butter, etc.), not one generic pantry basic (salt, olive oil, garlic, oats, honey, eggs, milk…) is covered despite those being the highest-frequency ingredients in the library.
6. **Investigated existing Edamam integration** (`legacy/discover.js`) as a possible ready-made nutrition source: it only calls Edamam's Recipe Search API v2, which returns nutrition for *existing public recipes matched by search* — it can't compute nutrition for arbitrary custom ingredient text, so it's the wrong product for this need. Edamam's separate Nutrition Analysis API (feed in a title + ingredient lines, get computed nutrition) is the right shape but is a different product needing separate registration; free tier is only 400 requests/month. Not pursued further once USDA was chosen.
7. **Chose and vetted USDA FoodData Central** as the nutrition-data source for generic/commodity ingredients: free signup (`fdc.nal.usda.gov/api-key-signup`, name+email only), 1,000 req/hr once registered. Saffron signed up and holds a key locally (not shared with or stored by Claude Code).
8. **Ruled out both alternative delivery paths, empirically, not by assumption**:
   - *Live in-app feature*: Saffron tested `fetch('https://api.nal.usda.gov/...')` directly from her own browser console — it throws a CORS error. Confirmed non-viable without a backend proxy, which this app doesn't have.
   - *Calling USDA directly from this Claude Code session*: attempted via both `curl` and the WebFetch tool — both got a **403 from the sandbox's own egress gateway** before ever reaching USDA (`connect_rejected`, "policy denial" per `$HTTPS_PROXY/__agentproxy/status`), i.e. the exact same restriction that already blocks `api.apify.com` for the price-book pipeline (see 2026-06-25 Apify entry). So USDA calls can only happen from a script Saffron runs locally — mirroring the existing `price_pricebook.py`/`csv_to_seed.py` pattern exactly.
9. **Landed on a 3-step sequence** (Saffron's own framing, confirmed this session): (1) expand `staple_products` via a local USDA lookup script; (2) a separate future session to normalise ingredient quantities; (3) a Claude-Code bulk pass to (re)populate recipe nutrition using both of the above as inputs. Confirmed the *order* matters: the bulk pass's accuracy ceiling is capped by unknown quantities regardless of ingredient-level macro quality, so quantity normalisation should land before the bulk pass, not after or in parallel.

## Artifacts Produced / Modified
None. This was a pure research/planning session — no files in the repo were created or changed except this log entry. The ingredient-frequency query and its output (below) exist only in this log; no CSV or script was saved.

**Reusable SQL** (ingredient-frequency scan, run against Supabase project `jsxcctrskkkxgdxfaduo` via the Supabase MCP `execute_sql` tool) — re-run this rather than re-deriving it by hand:
```sql
with sections as (
  select r.id, jsonb_array_elements(r.ingredient_sections) as sect
  from public.recipes r
  where r.import_status <> 'deleted' and r.ingredient_sections is not null
),
items as (
  select id, jsonb_array_elements(sect->'ingredients') as item
  from sections
),
raw as (
  select id,
    case when jsonb_typeof(item) = 'string' then trim(both '"' from item::text)
         else item->>'name' end as raw_name
  from items
),
clean1 as (
  select id, regexp_replace(raw_name, '\(.*?\)', '', 'g') as t
  from raw where raw_name is not null
),
clean2 as (
  select id,
    lower(trim(regexp_replace(t,
      '^[0-9¼½¾⅓⅔⅛/.\s–-]*\s*(g|kg|ml|l|tsp|tbsp|tbsps|teaspoons?|tablespoons?|cups?|oz|lb|lbs|cloves?|whole|large|medium|small|slices?|sprigs?|handfuls?|pinch(es)?|bunch(es)?|packs?|cans?|tins?)?\s*',
      '', 'i'))) as t2
  from clean1
),
clean3 as (
  select id, split_part(t2, ',', 1) as name
  from clean2
)
select name, count(*) as n, count(distinct id) as recipe_count
from clean3
where name is not null and length(name) > 2
group by name
order by n desc;
```
Top hits (partial, illustrative — see Notes & Gotchas for known regex artifacts): salt (67 recipes), olive oil (57), maple syrup (58), soy sauce (48), baking powder (54), honey (38), garlic cloves (~50 combined across mangled variants), eggs (36), cinnamon (33), vanilla extract (36), spring onions (30), cucumber (31), baking soda (30), coconut oil (27), cocoa powder (26), avocado (26), red onion (25), sesame oil/seeds (~49 combined), chia seeds (24), oats/oat flour (~56 combined), milk/"milk of choice" (~36 combined).

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This log entry (Rolling Log + GitHub Push mode) |

## Decisions & Reasoning
- **Prioritise grounding-data expansion (staple_products) before touching the in-app prompt/model.** Expanding staples removes guessing entirely for the ingredients it covers — a strictly-better, no-downside win — whereas prompt/model changes only make the *guessing* better. Sequenced first.
- **USDA FoodData Central over Edamam Nutrition Analysis API for the staple expansion.** Edamam's matching product is the right shape (NLP ingredient-line → nutrition) but free tier caps at 400 req/month and needs separate app registration under Saffron's account (unconfirmed whether she already has access). USDA is free, instant signup, higher rate limit, and better suited to *generic per-ingredient* lookups (which is what staple expansion actually needs) rather than whole-recipe NLP parsing.
- **Local build-only script, not an in-app feature, for the USDA calls** — decided only after empirically ruling out the alternative twice: Saffron confirmed CORS failure from her own browser, and I confirmed this Claude Code sandbox is gateway-blocked from `api.nal.usda.gov` (same as `api.apify.com`). Not an assumption — both were tested. Mirrors the exact `price_pricebook.py` pattern already established and proven for Apify.
- **Target the ≥4-recipe-occurrence ingredient tier (~209 names, ~59% line coverage) for the staple expansion, not the full long tail.** USDA lookups are free/cheap so cost isn't the constraint — the constraint is review effort (each match needs a sanity check, per the Apify pipeline's "wrong form" lesson e.g. cayenne→hot sauce) and diminishing returns (1,080 singleton-recipe ingredients each only help one recipe). Agreed to also force-include core protein/carb/dairy items (chicken breast, rice, potatoes, etc.) even if just under the frequency cutoff, since they swing calorie totals far more than a correctly-priced spice does.
- **Prefer USDA `dataType=Foundation,SR Legacy` over branded entries when the script is built** — generic/unbranded reference data avoids the same class of "right words, wrong product form" mismatch that bit the Apify price matcher.
- **Reviewable CSV output before writing to `staple_products`, not auto-apply** — consistent with the project's established convention (`pricebook.csv`/`price_report.md`) of never letting an automated match write directly to live data unreviewed.
- **Quantity normalisation sequenced BEFORE the bulk nutrition pass, and parked as its own separate session** rather than folded into this stream. Reasoning: it's a large enough problem (deciding gram-weight defaults for every vague/"to taste" ingredient line across the whole corpus) to deserve its own planning session, and doing it first means the bulk pass only needs to run once at full quality rather than twice.
- **The eventual bulk pass will be Claude Code reasoning directly, not a nested Anthropic API call.** Because a future session has direct Supabase read/write access (proven this session), it can match against `staple_products` itself, apply chain-of-thought per recipe, run a self-consistency double-check (re-derive, flag >20% disagreement), and write `review_flags` for low-confidence recipes — capabilities the in-app Haiku call structurally can't have (single constrained JSON-only prompt, no multi-pass, no direct DB access).

## Current State (end of session)
No implementation. `staple_products` still has 45 rows (all branded, no generic staples). `recipes` nutrition columns unchanged (327/335 populated, many flagged as prior estimates). Ingredient quantities unchanged (still `null` for "to taste"/no-amount lines). Saffron holds a USDA FDC API key locally — not committed or referenced anywhere in the repo. No new branch was created this session (pure investigation, no code changes to stage).

## Next Steps
1. **New session — build `scripts/usda_staples.py`** (stdlib-only Python, build-only like `price_pricebook.py`): input the ~209-ingredient-name list (regenerate via the SQL above, plus the agreed core-protein/carb/dairy additions — no frozen file exists yet, see Open Questions). For each name, call FDC `/foods/search?dataType=Foundation,SR%20Legacy` then `/food/{fdcId}` for the best match; output a review CSV (`name, matched_description, fdc_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g per 100g, confidence_flag`).
2. Saffron runs it locally: `export USDA_FDC_API_KEY=...` then `python3 scripts/usda_staples.py` (same run pattern as the Apify script — re-export each terminal session, never persisted to a file).
3. Saffron reviews/corrects the output CSV (catch wrong-form matches per the Apify lesson) and shares it back.
4. A Claude Code session applies the confirmed rows into `staple_products` directly via the Supabase MCP `execute_sql`/insert tools (project `jsxcctrskkkxgdxfaduo`) — no second script needed, this channel isn't blocked by the sandbox egress policy.
5. **Separate future session: plan + execute ingredient quantity normalisation** — design gram-weight defaults/conversion rules for vague units ("1 tbsp", "1 medium avocado") and a policy for genuinely-unquantifiable "to taste" items, then apply across `ingredient_sections` for all 327 recipes (both the legacy plain-string shape and the newer structured shape — see Notes & Gotchas).
6. **Then: bulk Claude Code pass** over all 327 recipes using the expanded `staple_products` + normalised quantities to (re)populate `calories/protein_g/carbs_g/fat_g/fibre_g/sugar_g`, with per-recipe chain-of-thought reasoning and a self-consistency double-check, writing `review_flags` (reuse existing vocabulary — see Notes & Gotchas) for low-confidence recipes.
7. **Lower priority / optional**: apply the same chain-of-thought + model-upgrade (Haiku → Sonnet) improvements to the in-app `fetchMacroEstimate`/`estimateNutritionWithAI` (`index.html:3206-3337`), and fix the persistence gap (add a Supabase PATCH of the macro columns, mirroring `patchRecipeToLibrary`) so future in-app "Re-estimate" clicks stop being localStorage-only.

## Open Questions / Blockers
- **No frozen ingredient list yet** — the ≥4-recipe-occurrence threshold (~209 names) plus "add core protein/carb/dairy items" guidance was agreed verbally/in this log, but nobody has written the literal final list to a file. The next session should either re-run the SQL above or explicitly confirm the categorical additions with Saffron before running the USDA script, to avoid scope drift.
- Whether Saffron's existing Edamam account (`ds_edamam_id`/`ds_edamam_key`) has separate access to the Edamam Nutrition Analysis API was never checked — moot now that USDA was chosen, but worth knowing if USDA coverage turns out to have gaps (e.g. some prepared/composite foods USDA doesn't model well).
- Carried over from 2026-06-25, still unresolved and unrelated to this stream: orange juice→"Orange" rollup correctness, and whether `Garlic Clove`/`Garlic` should merge to one variant.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`, no feature branch created this session (investigation only).
- Supabase project `jsxcctrskkkxgdxfaduo` ("saffronlilith's Project"). Tables relevant to this stream: `recipes` (335 rows; `calories/protein_g/carbs_g/fat_g/fibre_g/sugar_g/gi_estimate` columns already exist, no migration needed) and `staple_products` (45 rows: `name, aliases[], serving_qty, serving_unit, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, gi_estimate, flags[], notes`).
- **This cloud/remote Claude Code environment cannot reach `api.nal.usda.gov` or `api.apify.com`** — both confirmed via gateway-level 403 (`connect_rejected`, policy denial) at `$HTTPS_PROXY/__agentproxy/status`, before the request ever leaves the sandbox. Any script hitting either of these APIs must be built here but run on Saffron's own machine. Supabase access via the MCP tools is a separate channel and is NOT subject to this restriction — confirmed working throughout this session (schema reads, frequency queries, all succeeded).
- USDA FoodData Central: free signup at `fdc.nal.usda.gov/api-key-signup`; 1,000 req/hr with a registered key (30/hr, 50/day on the public `DEMO_KEY`). Saffron has a key; it is not stored in this repo or shared with Claude Code.
- Edamam credentials (`ds_edamam_id`/`ds_edamam_key`, used by the legacy Discover tab) are for the Recipe Search API v2 only — confirmed via `legacy/discover.js` — not usable for arbitrary-ingredient nutrition analysis without separate registration for the Nutrition Analysis API product.

## Notes & Gotchas
- **The ingredient-frequency regex has known artifacts**: it sometimes eats a leading "g" from words starting with g when preceded by a number, because it pattern-matches "g" as a unit abbreviation (e.g. "3 garlic cloves" → "arlic cloves", "green onions" → "reen onions"). True unique-ingredient counts are somewhat lower than the raw 209/457 figures once these are manually merged — dedupe by eye when building the final candidate list, don't trust the raw grouped names verbatim.
- **`ingredient_sections` jsonb has two shapes in the wild**: legacy plain strings (`"2 whole chickens"`) and newer structured objects (`{qty, unit, name, note, group}` — only present in recipes added after the 2026-06-29 parser overhaul). Any script/query touching this must branch on `jsonb_typeof(item)`.
- **`qty: null` in the structured shape is not a data bug** — it reflects recipes that genuinely never specified an amount ("salt, to taste", bare "olive oil"). This is exactly the quantity-normalisation gap; don't treat it as something to "fix" by re-parsing, it needs new logic (gram-weight defaults/conversion rules).
- **`review_flags` already has an informal vocabulary in use**: `nutrition_not_stated`, `nutrition_incomplete`, `calories_approximate`, `serves_estimated`, `method_inferred`, etc. Reuse or closely match these when the bulk pass flags low-confidence recipes rather than inventing a new taxonomy.
- **The in-app estimator already reads live from `staple_products`** (`fetchMacroEstimate`, `index.html:3206`, alias-aware match) — expanding that table benefits the in-app "Re-estimate" button immediately with zero code changes, since no new wiring is needed for it to pick up new staples.
- This session made heavy, correct use of the Supabase MCP tools directly (not raw `curl`/`fetch`) for all live-data investigation — continue that pattern; it's the only channel proven to reach this project's Supabase instance from this sandbox.

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

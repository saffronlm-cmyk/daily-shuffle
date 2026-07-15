# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

# Mobile Editorial Redesign — Foundation + All Screens Re-skinned
**Date:** 2026-07-15
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (mobile) — desktop layout is the next session's work

---

## Project Context
See earlier entries (2026-07-01 nutrition estimation; 2026-06-25/29 ingredient + parser work) for data/architecture background. This session was a **visual redesign stream**, orthogonal to the price/nutrition data work. Saffron used Claude Design (claude.ai/design) to mock up a mobile-first editorial reskin of the app and exported two handoff bundles; this session implemented them on the live repo.

## Session Goal
Implement the Claude Design high-fidelity prototypes as a mobile-first editorial redesign of the whole app — new oxblood/cream + Fraunces brand register, floating bottom tab bar, and every screen re-skinned — **without breaking any existing functionality**. Desktop layout explicitly deferred to a later session.

## State Before This Session
App was desktop-oriented: top header + horizontal emoji nav, light cream/taupe theme (`--bg #F5F2EC` etc.), plain cards. Single-file `index.html` (~6,200 lines, grew to ~6,500). No design tokens beyond the three legacy theme blocks. On branch `claude/focused-darwin-enipb5` with an unrelated uncommitted `HANDOFF.md` edit (price-book stream — left untouched all session).

## What Was Done
Worked in four passes, verifying each in-browser via a localhost server + Chrome automation (file:// is blocked by the extension, so `python3 -m http.server 8747` was used throughout).

1. **Foundation + Recipe Library proof** (plan-approved first). Added the prototype's design tokens to `:root` (namespaced `--fn-*`/`--ed-*`/`--cta`, Fraunces via Google Fonts with Georgia fallback, radii/shadow/glass). Inlined the needed Lucide icons as a hidden `<svg><symbol>` sprite at top of `<body>` (offline-safe, no new network requests — deliberate, the app is cache-first PWA). Wrapped the app as a ~430px mobile column centered on a dark `#2A2320` backdrop on wide screens. Added a floating oxblood bottom tab bar (markup after `</main>`) wired to the **existing** `switchTab()` (added a `.tabbar` active/dot sync line inside it). Relocated settings to a top-corner icon. Re-skinned Recipe Library: kicker + Fraunces title, pill search + filter button, restyled `#recipesFilterbar` chips, and rewrote the `renderRecipes()` card template to the prototype's image cards (gradient placeholders, archival `No. 0NN` badges, glass hearts using `--ed-oxblood-bright`, hero + 2-col grid). Updated `toggleFav()` selectors from `.recipe-card/.fav-btn` → `.rl-card/.rl-fav`.

2. **Rolled the register across the other four tabs.** Rather than replace the app's richer functionality with the simpler mockups, **remapped the legacy `:root` tokens** (`--bg`, `--surface`, `--accent`, `--text`, …) to the editorial palette so modals + every un-bespoke screen inherit cream/oxblood at once; then gave Shuffle / Grocery / Add / Tracker editorial headers (kicker + Fraunces title) and pill-styled primary actions (oxblood CTA).

3. **Two bespoke prototypes** (second bundle: `daily-shuffle-prototype-screens-1`, which added the Recipe Detail + Nutrition designs the first bundle lacked). **Nutrition Dashboard**: full rewrite of `renderTracker()` — oxblood editorial stat strip (Eaten/Burned/Deficit), calorie hero card with a real SVG progress ring, name-leads macro cards, per-meal log cards; `trkEntryRow()` reskinned to `.nd-logrow`. **Recipe Detail modal**: restyled `openModal()`'s output — kicker + `No. 0NN` archive mark, Fraunces title, icon meta row (users/clock/££), oxblood pill multiplier, numbered-circle method, compact single-line nutrition tiles. Kept it as the app's feature-rich centered modal (edit/delete/cost/tips/estimate) rather than the prototype's full-screen photo-hero + "Add to plan" sticky bar, since the app has no recipe photos and no add-to-plan-from-detail action.

4. **Cleanup pass** (Saffron's follow-ups). Stripped emoji app-wide per the no-emoji brand rule via a `deEmoji()` helper that mutates the label-map constants at source (`CRAVING_LABELS`, `PROTEIN_LABELS`, `MEAL_TYPE_LABELS`, `CARB_TYPE_LABELS`, `CUISINE_EMOJI`, `PROTEIN_EMOJI`, `FILTER_CHIPS`) plus targeted edits + `perl -i` sweeps for inline-markup and JS status strings. Removed Grocery header duplication and rebuilt grocery rows to the prototype's catalogue design (round oxblood check + colour swatch + stacked name/qty + price). Gave Shuffle day cards the editorial register. Reconciled cafe/coastal alt themes to accent-only swaps on the shared base.

5. **Two layout bugs** (Saffron's final follow-ups). Tracker had no side margin (`.trk-wrap` padding was `4px 0 60px`) → `4px 22px 60px` + de-doubled the header inline padding. Add Recipe form overflowed and looked off-brand: **root cause = responsive breakpoints key off viewport width (`@media max-width:768px`), which never fires now that the app is a fixed 430px column on desktop**, so `.form-grid` stayed 2-col and spilled the card. Fixed with `#tab-add .form-grid { grid-template-columns: 1fr }` and a full editorial restyle of the Add form (cards, inputs, chips, buttons). Hit the project's classic **stale-service-worker trap** mid-verify — a reload showed no change until the SW cache was bumped; confirmed via a `?v=` cache-busted URL.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | The entire app — all redesign markup/CSS/JS changes | Modified | /Users/saffron/daily-shuffle/ |
| sw.js | Service worker — cache bumped v32 → v34 | Modified | /Users/saffron/daily-shuffle/ |
| HANDOFF.md | Pre-existing price-book edit — **NOT touched/committed** this session | Untouched | /Users/saffron/daily-shuffle/ |

Committed as `342bc14` on branch `claude/mobile-redesign-foundation` (index.html + sw.js only). Not pushed, not merged, not deployed.

## Decisions & Reasoning
- **Additive tokens, then remap legacy tokens** rather than find/replace every hardcoded colour: kept the diff safe and let un-bespoke screens inherit the register for free.
- **Inline SVG sprite, not icon files**: preserves the single-file, offline-first, no-new-requests nature of the PWA.
- **Kept app functionality over prototype simplicity**: the mockups (esp. Shuffle/Grocery/Recipe-Detail) are thinner than the shipped features; adapted the *look* onto the real feature set rather than downgrading.
- **Recipe Detail stayed a centered modal**, not the prototype's full-screen hero — no recipe photos exist and there's no "add to plan from detail" action to anchor the sticky CTA.
- **Left HANDOFF.md out of the commit**: it's an unrelated uncommitted change from the price-book stream that predates this work.
- **Mobile-only for now**: all new layout assumes the ~430px column; desktop is a separate deliberate effort (next session).

## Current State (end of session)
Full mobile editorial redesign is live on the branch and verified in-browser across all five tabs + Recipe Detail modal: tab bar switches with active dots, favourites toggle + persist, cards open the detail modal, search/filters work, grocery checks toggle, tracker renders real data, Add form saves. JS parses clean (3 inline `<script>` blocks, 0 errors via the `new Function()` check). SW at v34.

## Next Steps
1. **Desktop layout** — the stated next deliverable. The whole redesign currently assumes a fixed ~430px mobile column; the key structural issue to solve first is that **responsive rules key off viewport width but the app is a fixed-width column**, so a real desktop layout needs either (a) a max-width breakpoint that expands the column into a multi-pane desktop shell (e.g. persistent side nav instead of the bottom tab bar, multi-column recipe grid, side-by-side plan+grocery), or (b) container-query-based components. Decide the desktop information architecture with Saffron before building.
2. Consider pushing the branch + opening a PR (nothing pushed yet) once desktop lands, or push now if she wants to test on a phone.
3. Optional polish carried over: recipe cards still use gradient placeholders (no photography); the prototype's full-screen recipe-detail hero + "Add to plan" flow was not built.

## Open Questions / Blockers
- **Desktop IA is undecided** — bottom tab bar vs. side nav, how the mobile column expands, whether plan+grocery go side-by-side. Needs a design decision with Saffron before implementation (worth another Claude Design pass or a plan-mode discussion).
- No recipe photography exists; cards/hero use warm gradient placeholders. Real images would need a source + storage decision.

## Environment & Config Notes
- Repo: `/Users/saffron/daily-shuffle`, branch `claude/mobile-redesign-foundation` (created off `claude/focused-darwin-enipb5`). Remote `origin` = github.com/saffronlm-cmyk/daily-shuffle. Commit `342bc14` local-only.
- Verify loop: `python3 -m http.server 8747` in the repo, open `http://localhost:8747/index.html` (file:// blocked by the Chrome extension). Bump `sw.js` CACHE or use a `?v=` query when a reload "doesn't show" — SW is cache-first for assets.
- JS sanity check (no linter/bundler): extract inline `<script>` blocks and `new Function(src)` each — used all session, kept at 0 errors.
- Prototype bundles: `~/Downloads/daily-shuffle-high-fidelity-prototypes` (screens 1: library/shuffle/grocery/add + 4 editorial screens) and `~/Downloads/daily-shuffle-prototype-screens-1` (Recipe Detail + Nutrition + a design-system change memo). Design tokens live under each bundle's `_ds/…/tokens/`.

## Notes & Gotchas
- **Design tokens are namespaced**: bespoke screens use `--fn-*`/`--ed-*`/`--cta`; the legacy `--bg/--surface/--accent/--text` were *remapped* to the same palette so both coexist. Don't delete the legacy vars — lots of un-migrated inline styles still reference them.
- **`deEmoji()` runs once at load** over the label-map constants — new emoji added to those maps get stripped automatically; emoji hardcoded in markup/JS strings do not (had to sweep those manually).
- **Two prototype bundles, not one**: the 4 editorial screens (Splash/Onboarding/Empty/Weekly-recap) from bundle 1 were **deferred** and never built — they're new features, not reskins.
- **Fraunces loads from Google Fonts** — degrades to Georgia offline. Acceptable for now; revisit if full-offline serif fidelity matters.
- Standard project gotcha reconfirmed: the service worker will serve stale HTML/CSS after an edit — bump `sw.js` CACHE every shippable change (now v34).

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

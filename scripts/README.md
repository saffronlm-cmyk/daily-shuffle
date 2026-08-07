# Scripts

## Browser smoke test (`smoke_test.mjs`)

Headless-browser smoke test for the app itself — unlike the Python pipelines below,
this one **is** meant to run from agent sandboxes (fully offline; it seeds fixture
recipes into `ds_recipe_cache` and asserts clean boot, tab switching, and shuffle):

```bash
node scripts/smoke_test.mjs
```

Exit 0 = all checks passed. See `.claude/skills/smoke-test/SKILL.md` for when to run
it and how to extend it.

## CLAUDE.md drift check (`claude_md_drift.mjs`)

Compares the facts `CLAUDE.md` states against the repo (tabs, scripts/ files, root
data files, `canonicalise()` copies, sw.js passthrough hosts). Also sandbox-safe:

```bash
node scripts/claude_md_drift.mjs
```

Exit 0 = no drift. Runs as a ship-check step and inside the weekly CLAUDE.md-audit
routine.

# Price-book pipeline

Two small Python scripts (standard library only — no `pip install` needed) that
fill `pricebook.csv` with real UK supermarket prices and feed them into the app.

```
pricebook.csv  ──(price_pricebook.py + Apify)──>  pricebook.filled.csv
pricebook.filled.csv  ──(csv_to_seed.py)──>  updated seedPriceBook() in index.html
```

## What you need

- **Python 3** (already on macOS / Linux; `python3 --version` to check).
- An **Apify account** and an **API token**: apify.com → sign in → Settings →
  Integrations → API token. It looks like `apify_api_xxxxxxxx…`.
- The script uses three pay-per-result actors (a few cents to a couple of
  dollars for a full run):
  - Tesco — `illehius/tesco-scraper`
  - Sainsbury's — `illehius/sainsburys-scraper`
  - ASDA — `illehius/asda-scraper`

> **Heads-up:** these are community actors, so their result field names *might*
> differ slightly from the defaults. Use `--probe` (below) to check before a
> big run, and edit the `FIELD = {...}` / `build_actor_input()` block at the top
> of `price_pricebook.py` if needed.

## Step 1 — fill the prices (`price_pricebook.py`)

```bash
# Preview only — what would be looked up, and how many queries. Spends nothing,
# needs no token:
python3 scripts/price_pricebook.py --dry-run

# Put your token in the environment:
export APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxx

# Check the REAL shape of one actor's results (one tiny query per store) so you
# can confirm the field names are right:
python3 scripts/price_pricebook.py --probe "chicken breast"

# Small real run first (first 10 products) to sanity-check the output:
python3 scripts/price_pricebook.py --sample 10

# Full run:
python3 scripts/price_pricebook.py
```

Outputs:
- `pricebook.filled.csv` — your CSV with `Pack size / unit / price / Store`
  filled in (cheapest of the three shops wins).
- `price_report.md` — products it could not confidently match, plus
  low-confidence picks to eyeball.

Useful flags: `--min-occ N` (only price products used ≥ N times; default 3),
`--max-items N` (results per shop per product; default 5),
`--price-per-1000 5` (show a cost estimate at $5/1000 results).

## Step 2 — update the app (`csv_to_seed.py`)

```bash
# Preview the generated seed (writes scripts/seed_snippet.js, changes nothing):
python3 scripts/csv_to_seed.py --in pricebook.filled.csv

# Actually patch index.html (a backup index.html.bak is written first):
python3 scripts/csv_to_seed.py --in pricebook.filled.csv --apply
```

This rewrites the `seedPriceBook()` function in `index.html`, keying each entry
by Product (the same way the app's `canonicalise()` does) and attaching every
ingredient variant as an alias so recipes match. It bumps the seed flag to
`ds_pb_seeded_v3` so the new prices load on next open.

## Notes / scope

- **Amazon** is intentionally not included (no consistent UK-grocery actor; poor
  fit for fresh food).
- Generic one-word products (`Oil`, `Salt`, `Sugar`) produce broad searches;
  check those in `price_report.md`.
- Generated files (`pricebook.filled.csv`, `price_report.md`,
  `scripts/seed_snippet.js`, `index.html.bak`) are git-ignored.

## Nutrition-estimation pipeline (`usda_staples.py`)

A separate, unrelated pipeline that expands the app's `staple_products` table
(used to ground AI macro estimates) with generic ingredient macros from USDA
FoodData Central. See `logs/daily-shuffle_log.md` ("Nutrition Estimation
Feasibility — Research & Planning", 2026-07-01) for the full background and
the 3-step sequence this is step 1 of.

```
staple_candidates.csv  ──(usda_staples.py + USDA FDC)──>  staple_report.csv
```

- `staple_candidates.csv` — **committed input**: ~135 canonical staple
  ingredient names, hand-deduped from an ingredient-frequency scan of the
  recipe library (raw scan found 209 names appearing in ≥4 recipes; many
  were regex artifacts, singular/plural variants, or near-synonyms — see the
  log entry for the full list of merges and intentional drops like bare
  `"water"`/`"oil"`). Columns: `name, category, recipe_count, source,
  merged_from`. `source` is `organic` (surfaced by the frequency scan) or
  `force-include` (core protein/carb/dairy items added manually even though
  they fell under the ≥4-recipe cutoff, e.g. `potato`, `butter`, `beef mince`).

```bash
# Free signup (name + email only): fdc.nal.usda.gov/api-key-signup
export USDA_FDC_API_KEY=your_key_here

# Preview only — what would be looked up. Spends nothing, needs no key:
python3 scripts/usda_staples.py --dry-run

# Check the real shape of one result (useful for debugging a bad match):
python3 scripts/usda_staples.py --probe "garlic"

# Small real run first (first 10 names) to sanity-check:
python3 scripts/usda_staples.py --sample 10

# Full run:
python3 scripts/usda_staples.py
```

Output: `scripts/staple_report.csv` (git-ignored) — `name, category,
recipe_count, source, matched_description, fdc_id, data_type, match_score,
calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, confidence_flag`, all
macros per 100g. Review this before it's applied anywhere: check
`confidence_flag` values other than `ok` (`review_match`, `low_confidence_match`,
`missing:...`, `no_match`) for wrong-form matches, same lesson as the
price-book pipeline's `price_report.md`. Nothing is written to Supabase by
this script — a later Claude Code session applies the reviewed rows to the
`staple_products` table directly via the Supabase MCP tools.

Prefers USDA's `Foundation`/`SR Legacy` (generic/unbranded) data over branded
entries, for the same reason `price_pricebook.py` avoids bare one-word
searches on branded catalogs — it avoids "right words, wrong product form"
mismatches (a spice search returning a branded hot sauce, etc.). Because the
match score is just word-overlap, a wrong *form* can still score highly (e.g.
"avocado" → "Oil, avocado"), so a `TERM_OVERRIDES` table at the top of the
script steers ~40 known-tricky names toward the right entry (whole/raw foods,
or a documented proxy where USDA has no generic — UK `cornflour` → US
`cornstarch`, `coconut sugar` ~ brown sugar, `rice vinegar` ~ distilled
vinegar, etc.). Scoring compares the description against both the original
name and the override term, so a rename-style override still scores.

A handful of ingredients have no usable USDA Foundation/SR Legacy generic and
are expected to come back `no_match` or poor — fill these by hand after
review: **nutritional yeast, coconut aminos, gochujang, chilli crisp, thai red
curry paste, rice paper, vanilla paste** (proxied to vanilla extract).

The `/food/{fdcId}` detail endpoint 404s on some entries (samples/withdrawn
ids); the script treats that as non-fatal and falls back to the nutrients
embedded in the `/foods/search` result, noting `[detail HTTP 404; used
search-result nutrients]` in the console. If a whole candidate needs
re-looking-up (fixed override, transient error), drop it into a small subset
CSV and re-run just those with `--in`/`--out` — e.g. `staple_candidates_cooked.csv`
(beans/grains → cooked forms) and `staple_candidates_retry.csv` (detail-404
recoveries + wrong-form override fixes) were built exactly that way.

**This is a build-only script, run locally, never from a Claude Code
sandbox** — `api.nal.usda.gov` is blocked at the sandbox's own egress gateway
(confirmed via both `curl` and WebFetch returning a 403 `connect_rejected`
before ever reaching USDA), the same restriction that already applies to
`api.apify.com` above.

---

## `normalise_quantities.py` — ingredient quantity normalisation (nutrition step 2)

Applies the ruleset in `quantity-normalisation-plan.md` (§3) to turn every
ingredient line into a **gram weight + provenance flag** (`qty_source`), for the
whole recipe. Feeds the step-3 bulk nutrition pass (which then divides by
`serves`).

Unlike the USDA/Apify scripts this one needs **no external network** — it runs
in the Claude Code sandbox on a JSON dump of the `recipes` table pulled via the
Supabase MCP channel (not sandbox-blocked). Stdlib only.

```
# 1. dump id/serves/ingredient_sections for every recipe (via Supabase MCP
#    execute_sql -> a JSON file; recipes with no serves are skipped per the §6
#    sign-off and flagged serves_missing). Measure the counts, don't trust a doc.
# 2. run:
python3 scripts/normalise_quantities.py recipes_dump.json quantity_review.csv ingredient_grams_updates.json

# merge Saffron's reviewed rulings back in (see quantity-review-decisions.md):
#   reviewed lines take her grams and get qty_source='reviewed'
python3 scripts/normalise_quantities.py recipes_dump.json quantity_review.csv ingredient_grams_updates.json \
    --decisions=quantity-review-decisions.v2.csv

# cut the next review worklist — only the lines still needing a human ruling
python3 scripts/normalise_quantities.py recipes_dump.json worklist.csv updates.json \
    --decisions=quantity-review-decisions.v2.csv --review-only
```

`--decisions` reads `recipe_id, sec, item, corrected_grams, note`. A numeric
`corrected_grams` overrides the computed value; `N/A`, a `0`, or a note containing
"exclude from nutritional" sets `exclude_from_nutrition: true` on that line, which
keeps the grams (cost, grocery list) but tells step 3 not to count the macros.

**`BARE_SERVING` holds one person's portion and is multiplied by `serves`**, because
`grams` on this path is a whole-recipe weight. Nothing else scales — a bare count
noun is already one whole item, and pinches/handfuls/garnishes don't grow with batch
size. Getting this wrong is what made every bare staple in a multi-serve recipe come
out short before 2026-08-07.

Outputs (git-ignored):
- `quantity_review.csv` — one row per ingredient line (`recipe_id, section, sec,
  item, original, name, grams, qty_source, detail, serves, exclude_from_nutrition,
  reviewed, skip_reason`) for human spot-check **before** the live write.
- `ingredient_grams_updates.json` — one object per recipe
  (`{id, ingredient_grams:[{sec,item,name,grams,qty_source,detail,group?,
  exclude_from_nutrition?}], add_flags}`), written into a new
  `recipes.ingredient_grams` jsonb column after review.

`qty_source` vocabulary (high→low confidence): `stated` · `converted` ·
`defaulted` · `to_taste` · `garnish` · `estimated` · `unresolved`. Any recipe
with an `estimated`/`unresolved` line also gets `review_flags += quantities_estimated`.

Keyword matching is word-boundary prefix (`\b` + term) so `oil` doesn't match
"b**oil**ing" while `strawberr` still matches "strawberries". The gram tables
(density classes, per-piece counts, vague defaults, bare-serving fallbacks) live
at the top of the file and were tuned over several passes against the real
corpus — see the plan doc for the source-of-truth rationale.

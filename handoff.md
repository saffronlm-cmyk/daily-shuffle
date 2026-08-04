# Handoff — Apify price-book pipeline

Resume point for filling `pricebook.csv` with real UK supermarket prices and
feeding them into the app. Read this top-to-bottom before doing anything.

## TL;DR — where we are

- The pipeline is **built and pushed**. Branch: `claude/gifted-mendel-2cq60n`.
  Latest commit: `1990aff` ("Make price matching category- and unit-aware").
- The user (a novice, runs everything on **their own Mac** with **their own
  Apify token** — the sandbox cannot reach `api.apify.com`) still needs to do
  the next real scrape run and paste the results back.
- The immediately pending step: **pull `1990aff`, re-run the full scrape, and
  verify the v2 category-aware matching fixed the bad picks.**

## The two scripts

```
pricebook.csv ──(price_pricebook.py + Apify)──> pricebook.filled.csv
pricebook.filled.csv ──(csv_to_seed.py)──> updated seedPriceBook() in index.html
```

1. **`scripts/price_pricebook.py`** — reads `pricebook.csv`, drops junk rows,
   collapses to unique Products used ≥ `--min-occ` (default 3, ~208 products),
   queries ASDA via Apify, applies category-aware matching + cheapest-unit-price
   wins, writes `pricebook.filled.csv` + `price_report.md`.
2. **`scripts/csv_to_seed.py`** — reads the filled CSV, regenerates the app's
   `seedPriceBook()` IIFE in `index.html`, keyed by `canonicalise(Product)` with
   ingredient/alias variants attached. Bumps seed flag `ds_pb_seeded_v2` →
   `ds_pb_seeded_v3` so new prices load on next open. `--apply` patches in place
   (writes `index.html.bak`); without it, previews to `scripts/seed_snippet.js`.

Standard library only — **no `pip install`**.

## Locked-in decisions (do not re-litigate)

- **Stores: ASDA only.** Tesco (`illehius~tesco-scraper`) and Sainsbury's
  (`illehius~sainsburys-scraper`) free actors are blocked by anti-bot
  (HTTP 403 / dead proxy). Only `illehius~asda-scraper` gets through. The
  "cheapest across stores" logic is still in place, so dropping in working
  actors later requires no code change.
- **Scope:** real products with occurrences ≥ 3 (~208).
- **Cheapest unit-price wins.**
- **Mismatch policy:** reject → leave blank. Better an unpriced product than a
  wrong-form price. (This is why the unmatched count may *rise* after v2.)
- **No caching** — each run re-scrapes.
- **"Build only, user runs it"** — never try to execute the scrape from here;
  the sandbox egress allowlist blocks `api.apify.com`. The user runs it.

## Apify specifics (verified by curl diagnostics on the user's machine)

- Endpoint: `run-sync-get-dataset-items` (starts actor, waits, returns rows in
  one HTTP call).
- Actor **input**: `{"queries": [term], "maxResultsPerQuery": N}`. NOT
  `searchQuery`/`maxItems` (that returned 400). `maxResultsPerQuery` must be set
  or you get `[]`.
- ASDA **output** fields (mapped in `FIELD`): `name`, `price` (numeric),
  `unitSize` (e.g. "4 PINT", "650g"), `unitPrice`, `unitPriceMeasure`
  (e.g. "per lt", "per 100g", "per each"), `productUrl`.
- Token: `export APIFY_TOKEN=apify_api_...` (real token from
  console.apify.com → Settings → Integrations). It does NOT persist across
  terminal sessions — re-export each time. Past errors were: literal placeholder
  token → 401; wrong terminal dir → `fatal: not a git repository` (need to `cd`
  into the repo first).

## v2 category-aware matching (what `1990aff` added)

The earlier (v1) run priced 189/208 but had systematic mismatches: spices/nuts
matched to liquids (e.g. Cayenne → hot sauce 354ml, Hazelnut → nut milk 1000ml,
Lime → lime juice, Vanilla → 2L drink, Baking Soda → liquid 75ml). The user
flagged that matching ignored the CSV's **Category / Product / variant**
structure. v2 fixes this in `price_pricebook.py`:

- `allowed_units(category, product)` → returns `(allowed_bases, reject_words)`.
  Uses Category + product words to decide which of `{g, ml, each}` a result may
  use and which result-name words disqualify it (wrong form).
  - `Beverages` → `{ml}`.
  - liquid words present (oil/sauce/milk/juice/extract…) → allow all units.
  - `_SOLID_CATS` (Spices & Herbs, Nuts & Seeds, Grains) or solid words → `{g}`.
  - `_PRODUCE_CATS` (Produce, Vegetables) → `{each, g}`, reject drink forms.
  - default → allow all, reject obvious drink forms.
- `UNIT_OVERRIDES` (per-product hard override): `baking soda`, `baking powder`
  → `{g}`.
- `TERM_OVERRIDES` (search-term fixes keyed by `canonicalise(Product)`):
  cacoa→cocoa powder, quinia→quinoa, puree→tomato puree, vanilla→vanilla
  extract, "cayenne pepper"→"ground cayenne pepper", hazelnut→hazelnuts,
  lime→limes, lemon→lemons, clove→cloves, "baking soda"→"bicarbonate of soda".
- **Own-words fix:** `reject_words -= set(canonicalise(product).split())` so a
  product isn't rejected for containing its own name (e.g. "Bicarbonate of
  **Soda**" must not trip the "soda" bad-form word). All test cases passed:
  Cayenne→powder, Hazelnut→nuts, Lime→fresh limes, Baking Soda→bicarb grams;
  legit liquids (soy sauce, milk) still accepted.

## NEXT STEPS (in order)

1. **User pulls and re-runs the full scrape** (on their Mac, in the repo dir):
   ```bash
   cd <repo>            # where pricebook.csv lives; git status must work
   git pull
   export APIFY_TOKEN=apify_api_...        # real token, re-export each session
   python3 scripts/price_pricebook.py      # full run
   ```
2. **User pastes back** the summary line (`Priced X/208 …`) and
   `cat price_report.md`.
3. **Verify** the previously-mismatched items (Vanilla, Cayenne, Hazelnut, Lime,
   Baking Soda) are now correctly priced or cleanly blank — no wrong-form
   prices. Watch for over-rejection: any genuinely liquid pantry item forced to
   grams by a bad CSV Category. Add a `TERM_OVERRIDE` / `UNIT_OVERRIDE` for
   stragglers and have them re-run.
4. **Patch the app** once the fill looks clean:
   ```bash
   python3 scripts/csv_to_seed.py --in pricebook.filled.csv          # preview
   python3 scripts/csv_to_seed.py --in pricebook.filled.csv --apply  # patch
   ```
   Offer to show the `index.html` diff before committing.
5. **Optional:** open a draft PR to land these on `main` if the user wants.

## Useful commands

```bash
python3 scripts/price_pricebook.py --dry-run            # preview, spends nothing
python3 scripts/price_pricebook.py --probe "chicken breast"   # confirm fields
python3 scripts/price_pricebook.py --sample 10          # small real run
python3 scripts/price_pricebook.py --price-per-1000 5   # cost estimate
```
Flags: `--in/--out/--report`, `--min-occ` (3), `--max-items` (5 →
maxResultsPerQuery), `--sample N`, `--token`, `--dry-run`, `--probe TERM`.

## Files

- `scripts/price_pricebook.py` — fill pipeline (v2 category-aware).
- `scripts/csv_to_seed.py` — CSV → app seed (unchanged since v1).
- `scripts/README.md` — novice run guide.
- `pricebook.csv` — committed copy of the user's upload (input).
- `.gitignore` — ignores generated `pricebook.filled.csv`, `price_report.md`,
  `scripts/seed_snippet.js`, `index.html.bak`.

The app is a static PWA (single `index.html`, localStorage price book under
`ds_pricebook`). `canonicalise()` is duplicated in both scripts and MUST mirror
the app's version in `index.html` for keys/aliases to line up.

---

## Future — cost-aware features (salvaged from the retired `HANDOFF.md` roadmap)

The old uppercase `HANDOFF.md` (ingredient-normalisation roadmap) was removed to
end a filesystem case-collision with this file. Its Phase-1 CSV/normalisation
work is done; the only part not captured elsewhere was the downstream
cost-feature vision, preserved here. **Once variants are priced, the existing
engine lights up** — this is the payoff and the next design space:

- **Surface recipe cost**: `computeRecipeCost()` already returns per-recipe /
  per-portion / unpriced counts; show £/portion on recipe cards (a `costTier`
  field already exists) and in the modal.
- **Plan & grocery cost**: `_groceryAggregate()` + the plan cost label already
  exist — verify totals, show per-item £, per-category subtotals, and a
  **whole-plan basket total**; flag "N unpriced".
- **Shop-by-product grocery view**: collapse variants under their **product**
  family within each aisle.
- **Per-100g normalisation**: auto-compute on import for like-for-like
  comparison and value flags.
- **Budget-aware meal planning**: filter/sort the shuffle by cost tier; set a
  weekly budget; warn when a plan exceeds it; "cheaper swap" suggestions using
  same-product alternatives.
- **Price history & receipts**: `applyReceiptToPriceBook()` + entry `updatedAt`
  already exist — track price over time, show trends, let a receipt scan refresh
  prices.
- **Store comparison**: multiple stores per variant → cheapest-basket / per-store
  totals.
- **Cost × nutrition**: cost per gram of protein / per kcal — bridges to the
  stashed macro/Track modules (`legacy/macro-calc.*`, `legacy/track.*`).

## Future — other feature ideas (unscheduled)

- **Recipe variant toggle**: the `recipes` table has no parent/variant
  relationship (no `variant_of`/`parent_id` column) — a duplicated-and-altered
  recipe (e.g. an ingredient swap with recalculated macros) is just another
  standalone row, findable only by name, with no link back to the recipe it
  came from. A `variant_of` column (nullable FK to `recipes.id`) would let the
  app group variants under their base recipe — e.g. show them together in the
  recipe modal/library, or let Shuffle/Tracker filtering treat "show variants"
  as its own toggle instead of relying solely on `import_status`. Raised
  2026-07-30 while duplicating the Glass & Konjac Chicken Japchae recipe into
  an all-konjac version.

- **Multi-select primary cuisine**: the `cuisine` column on `recipes` is a
  single text value (one dropdown, one primary cuisine per recipe). The
  Cravings tab already has a separate multi-select "Cuisine" chip group
  (`CRAVING_TAXONOMY.cuisine` in `index.html`) sharing the same value set
  (asian/vietnamese/thai/chinese/korean/japanese/indian/italian/
  mediterranean/middleeastern/american/comfort) — for now, use that for
  recipes that span more than one cuisine (e.g. a Thai-Korean fusion dish),
  leaving the primary `cuisine` dropdown as the single dominant tag. If this
  turns out to be confusing having two parallel systems, or if a recipe
  genuinely needs multiple *primary* cuisines, the fix is: convert `cuisine`
  to an array column, turn the dropdown into a chip picker (mirroring how
  `mealTypes` already works), and update every place that reads `r.cuisine`
  as a single string (card kicker/`CUISINE_EMOJI`, the "Cuisine" filter chip,
  the AI recipe-parser schema). Raised 2026-08-01 during the Asian-cuisine
  tag-variant expansion (Vietnamese/Thai/Chinese/Korean).

- **AI nutrition estimates skewed low (possibly already resolved — re-check
  before investigating)**: on 2026-08-02 Saffron reported that macro estimates
  came out consistently *low* in both `fetchMacroEstimate` (Add Recipe /
  "Re-estimate") and `trkRunQuickAdd` (Tracker → Quick add with AI). By the end
  of that session she thought it may have resolved itself — plausibly because
  the same session corrected several staples that had been carrying another
  product's figures (Vanilla paste 12.7 → 65 g carbs; Chicken stock 36 →
  270 kcal/100 g as a cube), and re-pointed the bare terms "soy sauce" and
  "protein powder" at her GF/vegan products instead of the wheat/whey generics.
  Those all push estimates *up*, which fits. **Confirm it's actually gone
  before spending time here.**

  If it persists, two ruled-out causes and two live suspects, so nobody
  re-treads the ground:

  - *Ruled out — the `serves` fallback bug.* `index.html` maps recipes in two
    places and they disagree: L1481 `servings: row.serves || 2` has a fallback,
    the Supabase-row mapper (`servings: supabaseRow.serves`, ~L4705) does not,
    so a null `serves` leaves it undefined and the call site defaults to 1,
    making the per-serving divide a no-op. Real bug, still worth fixing, but it
    skews estimates **high**, and only on the recipe path — so it is not this.
  - *Ruled out — truncated JSON.* `trkParseJsonLoose` ends in a strict
    `JSON.parse`, so a cut-off array throws and surfaces as "No items
    recognised". It cannot silently drop items.
  - *Suspect 1 — double division (recipe path only).* The comment above
    `fetchMacroEstimate` records that the model "often returns whole-recipe
    totals despite being asked for per-serving". The prompt was then rewritten
    to demand the TOTAL, with the code dividing by servings itself. If the model
    has since flipped back to returning per-serving, it gets divided twice —
    which would make estimates low by *exactly* the serves count. **Test: open a
    4-serving recipe, re-estimate, check whether it lands ~4x low.** That single
    check confirms or kills this hypothesis.
  - *Suspect 2 — no room to compute.* Measured 2026-08-02: the staples block
    injected into every call is **~7,200 tokens** for Quick Add (all products
    *with* their full `notes`) and **~4,400 tokens** for the recipe estimate
    (no notes). The model then does ~20 unit conversions and a summation with
    `max_tokens` of **1024** and **256** respectively, and no thinking — i.e.
    one-shot mental arithmetic over a long product list. Quick Add has no
    servings divide, so if it is still low, this (plus the prompt's "if quantity
    is vague, assume a sensible serving" line, which Haiku reads conservatively)
    is the likely mechanism.

  Fix if confirmed: raise `max_tokens`, enable thinking, and make the
  total-vs-per-serving contract unambiguous. See the model-change scoping in the
  2026-08-02 log entry — note the `claudeText()` helper (PR #58) is already in
  place, so a model swap no longer breaks response parsing. Raised 2026-08-02.

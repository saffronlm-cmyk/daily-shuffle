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

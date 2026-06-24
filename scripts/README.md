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

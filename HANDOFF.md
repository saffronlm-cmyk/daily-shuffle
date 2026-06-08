# Session Handoff — Recipe Ingredient Normalisation, Consolidation & Price Book

Branch: `claude/recipe-ingredient-prices-RYSob` (all work below is committed here; **not deployed** to the
live app yet).

---

## 1. The app & where data lives
- **Daily Shuffle** PWA — single `index.html` (~250 KB) + `legacy/` modules.
- **Recipes**: Supabase project `jsxcctrskkkxgdxfaduo` ("saffronlilith's Project"), table `recipes`,
  column `ingredient_sections` (JSONB; ingredients are **free-text strings** like `"2 garlic cloves, minced"`).
  Filtered by `import_status='ready'` → **305 recipes / 3,915 ingredient lines** (3,485 real text, **430 null**
  across **36 recipes** — text was lost on import; needs manual re-entry).
- **Price book**: browser `localStorage` key `ds_pricebook`; seeded once (~38 entries). Syncs to the user's
  own Supabase `user_library` row `id='default'` (the `priceBook` field there is currently empty).
- **Key engine functions in `index.html`**: `canonicalise()`/`_STOP_ADJ`, `parseQty()`, `_toBase()`,
  `classifyAisle()`/`_AISLE_RULES` (12 aisles), `lookupPriceBook()` (exact → **alias** → substring),
  `savePriceBook()` (persists + invalidates cached costs + `autoSync`), `_parseCsv()`,
  `importLibrary()` (JSON restore — **ignores priceBook**).
- **The consolidation hook**: every `priceBook[key]` carries an `aliases:[]` array that `lookupPriceBook`
  already checks, but **nothing populates it**. Populating aliases = one logged price covers all variants.

## 2. Decisions locked (via Q&A)
Apply to **both** price book + recipe names · **moderate** grouping · **reviewable CSV first** ·
`A or B` → first option, remainder to note · sugar: **only `white sugar`→Sugar** · flavoured yoghurts
**distinct** · bare defaults **onion→Yellow Onion, flour→Plain Flour, butter(dairy)→Butter,
cabbage→White Cabbage, oil→Vegetable Oil, yog(h)urt→Plain Yoghurt** · **citrus juice/zest/whole → the
fruit** (Lemon/Lime/Orange) · UK spellings. Final review calls: **light olive oil→Olive Oil**;
**light & dark soy sauce distinct**; **Light Sour Cream distinct**.

## 3. Deliverables produced (committed)
**Worksheets / data (repo root):**
- `missing-ingredient-prices.csv` — 615 ingredients with no logged price (Ingredient, Category,
  Pack size, Pack unit, Pack price, per-100g, Store, examples). The price sheet to fill.
- `recipe-ingredient-normalisation.csv` — 3,915 rows, `row_key = recipeId|sectionIdx|lineIdx`,
  pre-parsed qty/unit/ingredient/note + `review` flag (2,760 clean / 725 review / 430 null).
- `ingredient-consolidation.csv` — review worksheet, **93 clusters, 276 rows, 0 review left**.
  Columns: cluster_id, suggested_canonical, variant, occurrences, in_pricebook, reason, decision
  (`merge`/`keep-separate`), rewrite_recipes (`yes`/`no`), notes.
- `ingredient-master.csv` — comprehensive list, **category → product → variant** (1,025 variants /
  ~840 products / 12 categories). For sorting/grouping the whole ingredient set.
- `recipe-ingredient-normalisation.consolidated.csv` — recipe lines reparsed (heaped/cm/"A or B" → note)
  + canonical renames applied (~556 lines). Import-ready.
- `pricebook-aliases.csv` — one row per canonical with `;`-joined variant `Aliases`.

**Offline tooling (repo root, run with `node`):**
- `tools-cluster-ingredients.mjs` — rules engine → regenerates `ingredient-consolidation.csv` +
  `ingredient-master.csv`. (Edit rules here; ports the app's `canonicalise`.)
- `tools-apply-consolidation.mjs` — reads the approved worksheet → regenerates the consolidated recipe
  CSV + `pricebook-aliases.csv`.

**In-app importers (already in `index.html`, on branch only):**
- **"Import ingredient CSV"** (Settings → Recipe Library) → `importRecipeIngredientsCsv()`: rebuilds each
  recipe's lines from a worksheet, updates `RECIPE_FULL_DATA` + overrides + `patchRecipeToLibrary` (cloud).
- **"Import price CSV"** (Settings → Price Book) → `importPriceBookCsv()`: fuzzy column match,
  `canonicalise`→key, `unitPrice = packPrice/packSize`, `savePriceBook`.

## 4. Phase map
- **Phase 0 — Scoping** ✅ (architecture, data, engine functions).
- **Phase 1 — Offline worksheets** ✅ (all CSVs above; clusterer encodes every user rule; 0 review rows).
- **In-app importers** ✅ built & pushed — **but the branch is not deployed**, so they aren't in the live app yet.
- **Phase 2 — Apply (PENDING)**:
  1. Finish reviewing/editing `ingredient-consolidation.csv` (decision / suggested_canonical / rewrite_recipes).
  2. **Small app change (~4 lines)**: extend `importPriceBookCsv` to read an optional `Aliases` column and
     merge into `priceBook[key].aliases` — and allow alias-only rows (no price) to still apply. *(Not done yet.)*
  3. Re-run `tools-apply-consolidation.mjs` against the final worksheet.
  4. Deploy the branch (merge / PR) so the importers are live.
  5. Import `recipe-ingredient-normalisation.consolidated.csv` (renames recipes; patches cloud) and
     `pricebook-aliases.csv` (sets aliases).
  6. Re-enter the **430 null lines** (36 recipes) from original sources.
- **Phase 3 — Pricing (PENDING, the user's main next goal)**:
  - Fill `missing-ingredient-prices.csv` (pack size + price) → import via "Import price CSV".
  - Aliases mean each canonical is priced **once** and covers all its variants → recipe cost engine
    (`computeRecipeCost`) + grocery list show £ automatically.
  - **API / scraper for prices** — see §5.
- **Phase 4 — Cost features (already partly in app; verify after pricing)**: per-recipe cost, plan cost,
  grocery-list totals, "unpriced" badges.

## 5. Price API / scraper (Phase 3 deep-dive)
Goal: auto-fetch UK grocery prices for each **canonical** ingredient instead of hand-entering.

Realities / options:
- **No official public price APIs** from UK supermarkets (Lidl/Tesco/Sainsbury's/Aldi). Practical routes:
  - **Aggregators** (e.g. Trolley.co.uk) — no official API; would be scraping.
  - **Unofficial store endpoints** (Tesco/Sainsbury's product-search JSON) — work but ToS-restricted,
    rate-limited, and change without notice. Fine for personal use; build politely (cache, backoff).
  - **Open Food Facts** — good product/nutrition data, **not reliable UK prices**.
- **Where it can run** (important): this remote sandbox has a **network allowlist** (Supabase was blocked
  earlier), so a scraper here is constrained. Better homes:
  - A **Supabase Edge Function** in the user's project (server-side fetch; store results in a `prices` table).
  - A **small local Node/Python script** the user runs on their machine, outputting the price CSV.
- **Hard part = matching**: canonical ingredient → store search query → pick a representative pack
  (size/price). The consolidation + `aliases` already give a clean canonical vocabulary to drive queries;
  add a per-canonical "search term + preferred pack size" mapping column.
- **Suggested shape**: `prices` table (ingredient_key, store, pack_size, pack_unit, pack_price, url,
  fetched_at) → nightly Edge Function → export to the same `Import price CSV` format (or write `priceBook`
  straight into `user_library`). Keep a manual-override flag so scraped prices don't clobber user edits.

## 6. Backlog / postponed ideas
- **Tighten `lookupPriceBook` substring fallback** (egg↔eggplant, oat↔oat milk) to whole-token matching —
  do *after* aliases are populated so behaviour can be verified. (~lines 2757-2760 in index.html.)
- **430 null recipe lines** — re-enter ingredients for the 36 affected recipes.
- **"Other" category (143)** in `ingredient-master.csv` — extend `_AISLE_RULES` / hand-categorise.
- **Variant-label artifacts** ("Fat Greek Yogurt" from "0% fat") — cosmetic; products are correct.
- **Orange juice** carton vs fruit — currently rolled into `Orange`; split if a recipe means a carton.
- **`per-100g` price column** — auto-compute on import for easy comparison.
- **Greek Yoghurt "dairy-free sub OK" note** — decide where to surface (recipe note vs price-book note).
- **Direct Supabase apply** option for recipe renames (vs CSV import) — faster but edits the shared library;
  keep a backup of `ingredient_sections` first.
- **Idempotency / re-runs**: importers merge, so re-importing updated sheets is safe (good for iterating).

## 7. How to regenerate (commands)
```
cd /home/user/daily-shuffle
node tools-cluster-ingredients.mjs     # -> ingredient-consolidation.csv + ingredient-master.csv
node tools-apply-consolidation.mjs     # -> recipe-...consolidated.csv + pricebook-aliases.csv
```
Recipe source data is pulled from Supabase via MCP (see git history for the exact SQL); the CSVs in the
repo are the cached outputs.

## 8. Open decisions for next session
- Approve final `ingredient-consolidation.csv` edits → trigger Phase 2.
- Greenlight the `importPriceBookCsv` Aliases change + a PR to deploy the importers.
- Pick the pricing route (manual CSV first vs Edge-Function scraper) and target store(s).

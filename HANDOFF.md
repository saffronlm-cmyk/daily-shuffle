# Roadmap & Handoff — Ingredient Normalisation → Price Book → Cost Features

**Status of this doc:** there is no project-wide phasing/roadmap document in this repo, so this file is
the master roadmap **for the ingredient → price → cost feature stream**. (Separate, parallel concern:
`legacy/README.md` tracks stashed modules — Track / Pantry / Wellness / Discover / Macro-calc — to be
re-grafted once the foundations *Shuffle / Recipes / Grocery / Add Recipe* are stable. Not covered here.)

Branch: `claude/recipe-ingredient-prices-RYSob` — committed; **not deployed** to the live app yet.

---

## 1. App & data
- **Daily Shuffle** PWA — single `index.html` (~250 KB) + `legacy/`.
- **Recipes**: Supabase `jsxcctrskkkxgdxfaduo`, table `recipes`, `ingredient_sections` JSONB (free-text).
  `import_status='ready'` → **305 recipes / 3,915 lines** (3,485 real, **430 null** across **36 recipes**).
- **Price book**: `localStorage ds_pricebook`, syncs to Supabase `user_library` row `id='default'`.
  Each entry has an unused `aliases:[]` array `lookupPriceBook()` checks (exact → alias → substring).
- **Engine fns** (`index.html`): `canonicalise()`, `parseQty()`, `_toBase()`, `classifyAisle()`,
  `lookupPriceBook()`, `savePriceBook()`, `computeRecipeCost()`, `_groceryAggregate()`, `_parseCsv()`.
- **In-app importers added this stream** (on branch, *not deployed*): "Import ingredient CSV"
  (`importRecipeIngredientsCsv`) and "Import price CSV" (`importPriceBookCsv`).

## 2. Data model (decided this session)
Three non-destructive tiers:
- **variant = price unit AND recipe-facing name** (Almond Milk, Light Soy Sauce, Greek Yoghurt). One
  price per variant; raw recipe wordings fold in as **aliases**.
- **product = broad family/grouping only** (Milk, Soy sauce, Yoghurt, Oil, Cheese). Not a shared price —
  an organisation label, carried into the app to **group the grocery list by product within each aisle**.
- **category = the 12 aisles.**
Naming lives in the **master**; quantities (qty/unit/note) live in the **recipe worksheet**.

Locked rules: moderate grouping · `A or B`→first+note · only `white sugar`→Sugar · flavoured yoghurts
distinct · bare defaults (onion→Yellow Onion, flour→Plain Flour, butter→Butter, cabbage→White Cabbage,
oil→Vegetable Oil, yog(h)urt→Plain Yoghurt) · citrus juice/zest/whole→fruit · light olive oil→Olive Oil ·
light/dark soy & Light Sour Cream distinct · white pepper distinct · cracked/ground/black→Black Pepper ·
UK spellings · `dairy free milk` intentional · ingredient SPLITS done at recipe-line grain (qty per
occurrence), NAME changes done 1→1 via the master.

## 3. Live files (source of truth)
| file | role |
|---|---|
| `ingredient-master.csv` | **Naming source of truth** (user-curated): `category, product, product change, variant, variant change, occurrences, in_pricebook, Notes` |
| `split-plan.csv` | 28 confirmed compound **splits** + renames (input) |
| `recipe-ingredient-normalisation.csv` | original per-line parse from Supabase (`row_key,…,original_line,…`) (input) |
| `tools-apply-master.mjs` | **Generator** — `node tools-apply-master.mjs` → the two outputs |
| `recipe-ingredient-normalisation.final.csv` | **OUTPUT** — lines with parser qty/unit/note + `ingredient` = master `variant change`; splits baked in (`row_key` suffixes `-2/-3`); 3,153/3,483 matched |
| `pricebook.csv` | **OUTPUT / fill-in sheet** — one row per variant, usage-sorted: `Ingredient, Product, Category, Pack size, Pack unit, Pack price, Store, Aliases, occurrences` (987 variants) |

Superseded generations + their tools were removed (in git history if needed).
Regenerate: `cd /home/user/daily-shuffle && node tools-apply-master.mjs`.

## 4. Phases
- **Phase 0 — Discovery** ✅ (architecture, data, engine fns, the `aliases` hook).
- **Phase 1 — Naming normalisation & consolidation** ✅ *(this session)*. Master curated; recipes
  normalised; 28 splits applied; price book scaffolded at variant grain with product/category/aliases.
- **Phase 1.5 — USER (now)**: fill `pricebook.csv` top-down (first ~100 by usage cover most recipes);
  tidy rough Product labels (e.g. `Maple Syrup → "Syrup"`).
- **Phase 2 — Apply to the app** *(next session, on go)*:
  1. `importPriceBookCsv`: read **Aliases** + **Product** columns; allow alias-only rows (no price yet).
  2. Add a `product` field to price-book entries; **group the grocery list by product within aisle**.
  3. Tighten the greedy `lookupPriceBook` substring fallback (egg↔eggplant) to whole-token (aliases now
     cover the real cases).
  4. **PR to deploy** the branch (importers + grouping go live).
  5. Import `recipe-ingredient-normalisation.final.csv` (renames → cloud) and `pricebook.csv`.
  6. Re-enter the **430 null lines** (36 recipes) from source.
- **Phase 3 — Auto-pricing** *(after manual prices prove the model)*: API/scraper keyed on the clean
  variant vocabulary. No official UK supermarket price APIs → unofficial store endpoints / aggregators
  (scraping, personal-use, polite: cache + backoff). Best home: a **Supabase Edge Function** (server
  fetch → `prices` table) or a **local script** emitting the price CSV. Matching = variant → search term
  → representative pack; per-variant "search term + preferred pack size" column; **manual-override flag**
  so scraped prices never clobber hand edits. Multi-store support feeds Phase 4 comparison.

## 5. Phase 4 — Cost-aware features (what comes AFTER normalisation)
Once variants are priced, the existing engine lights up — this is the payoff and the next design space:
- **Surface recipe cost**: `computeRecipeCost()` already returns per-recipe / per-portion / unpriced
  counts; show £/portion on recipe cards (a `costTier` field already exists) and in the modal.
- **Plan & grocery cost**: `_groceryAggregate()` + the plan cost label already exist — verify totals,
  show per-item £, per-category subtotals, and a **whole-plan basket total**; flag "N unpriced".
- **Shop-by-product grocery view**: collapse variants under their **product** family within each aisle
  (the reason product is carried into the app).
- **Per-100g normalisation**: auto-compute on import for like-for-like comparison and value flags.
- **Budget-aware meal planning**: filter/sort the shuffle by cost tier; set a weekly budget; warn when a
  plan exceeds it; "cheaper swap" suggestions using same-product alternatives.
- **Price history & receipts**: `applyReceiptToPriceBook()` + entry `updatedAt` already exist — track
  price over time, show trends, and let a receipt scan refresh prices (ties into Phase 3).
- **Store comparison**: multiple stores per variant → cheapest-basket / per-store totals.
- **Cost × nutrition**: cost per gram of protein / per kcal — bridges to the stashed macro/Track modules
  (`legacy/macro-calc.*`, `legacy/track.*`).

## 6. Backlog / loose ends
- ~330 recipe lines didn't match the master (parse artifacts / one-offs) — cleanup pass.
- `Garlic Clove` vs `Garlic` still separate variants — set `variant change = Garlic` to merge if wanted.
- Rough Product labels from the master (casing/family) — tidy in `pricebook.csv`.
- 430 null lines re-entry (36 recipes).
- Importer `row_key` suffix ordering (`-2/-3`) needs the importer to sort split rows correctly (Phase 2).
- Decide where the "dairy-free sub OK" style notes surface (recipe note vs price-book note).

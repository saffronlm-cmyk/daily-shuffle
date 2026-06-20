# Session Handoff — Recipe Ingredient Normalisation, Consolidation & Price Book

Branch: `claude/recipe-ingredient-prices-RYSob` (committed; **not deployed** to the live app yet).

---

## 1. The app & where data lives
- **Daily Shuffle** PWA — single `index.html` (~250 KB) + `legacy/` modules.
- **Recipes**: Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes`, column `ingredient_sections`
  (JSONB; free-text strings). `import_status='ready'` → **305 recipes / 3,915 lines** (3,485 real text,
  **430 null** across **36 recipes** — lost on import, need manual re-entry).
- **Price book**: browser `localStorage` `ds_pricebook`; syncs to the user's Supabase `user_library`
  row `id='default'`. Every entry has an unused `aliases:[]` array that `lookupPriceBook()` checks
  (exact → alias → substring) — the hook for one-price-covers-variants.
- **Engine fns** (`index.html`): `canonicalise()`/`_STOP_ADJ`, `parseQty()`, `_toBase()`,
  `classifyAisle()`, `lookupPriceBook()`, `savePriceBook()`, `_parseCsv()`.
- **In-app importers already added** (on branch, *not deployed*): **"Import ingredient CSV"**
  (`importRecipeIngredientsCsv`) and **"Import price CSV"** (`importPriceBookCsv`) in Settings.

## 2. The data model (decided with the user)
Three tiers, non-destructive:
- **variant = the price unit AND the recipe-facing name** (e.g. *Almond Milk, Light Soy Sauce, Greek
  Yoghurt*). One price per variant; the raw recipe wordings fold in as its **aliases**.
- **product = the broad family/grouping only** (e.g. *Milk, Soy sauce, Yoghurt, Oil, Cheese*). NOT a
  shared price — it's an organisation label, carried into the app to **group the grocery list by
  product within each aisle**.
- **category = the 12-aisle bucket.**
Naming lives in the **master**; quantities (qty/unit/note) live in the **recipe worksheet**. Two clean
layers: master = *what it's called*, normalisation = *how much*.

Locked rules: moderate grouping · `A or B` → first + note · sugar only `white sugar`→Sugar · flavoured
yoghurts distinct · bare defaults (onion→Yellow Onion, flour→Plain Flour, butter→Butter,
cabbage→White Cabbage, oil→Vegetable Oil, yog(h)urt→Plain Yoghurt) · citrus juice/zest/whole → the
fruit · light olive oil→Olive Oil · light/dark soy & Light Sour Cream distinct · white pepper distinct ·
cracked/ground/black pepper→Black Pepper · UK spellings · `dairy free milk` intentional.

## 3. Live files (current source of truth)
| file | role |
|---|---|
| `ingredient-master.csv` | **Source of truth for naming.** User-curated: `category, product, product change, variant, variant change, occurrences, in_pricebook, Notes`. |
| `split-plan.csv` | The 28 confirmed ingredient **splits** (one compound line → N) + renames. Input. |
| `recipe-ingredient-normalisation.csv` | Original per-line parse from Supabase (`row_key, …, original_line, …`). Input (source of `original_line`). |
| `tools-apply-master.mjs` | **The generator.** Reads the three above → writes the two outputs below. Re-runnable: `node tools-apply-master.mjs`. |
| `recipe-ingredient-normalisation.final.csv` | **OUTPUT.** Every line: qty/unit/note from the parser + `ingredient` = master `variant change`; splits baked in (`row_key` suffixes `-2/-3`). 3,153/3,483 matched the master. |
| `pricebook.csv` | **OUTPUT — the fill-in sheet.** One row per **variant** (price unit), sorted by usage: `Ingredient, Product, Category, Pack size, Pack unit, Pack price, Store, Aliases, occurrences`. 987 variants; aliases fold ~3,000 raw wordings down. |

Older generations (`ingredient-consolidation.csv`, `missing-ingredient-prices.csv`,
`pricebook-aliases.csv`, `recipe-…consolidated.csv`, `compound-split-candidates.csv`) and their tools
(`tools-cluster-ingredients.mjs`, `tools-apply-consolidation.mjs`) were **removed** — they're superseded
and remain in git history if the baseline/category-derivation logic is ever needed again.

## 4. Phase map
- **Phase 1 — naming & normalisation** ✅ done. Master curated, recipes normalised, splits applied,
  price book scaffolded.
- **NOW — user fills `pricebook.csv`** (top-down; the first ~100 by usage cover most recipes). Tidy any
  rough Product labels (e.g. `Maple Syrup → "Syrup"`) while there.
- **Phase 2 — apply to the app** (on the user's go):
  1. `importPriceBookCsv`: read **Aliases** + **Product** columns; allow alias-only rows (no price).
  2. Add a `product` field to price-book entries; **group the grocery list by product within aisle**.
  3. Tighten the greedy `lookupPriceBook` substring fallback (egg↔eggplant) to whole-token now that
     aliases exist.
  4. **PR to deploy** the branch (importers + grouping go live).
  5. Import `recipe-ingredient-normalisation.final.csv` (renames → cloud) and `pricebook.csv`.
  6. Re-enter the **430 null lines** (36 recipes).
- **Phase 3 — auto-pricing**: API/scraper keyed on the clean variant vocabulary. No official UK
  supermarket price APIs → realistic routes are unofficial store endpoints / aggregators (scraping,
  personal-use, polite). Best home: a **Supabase Edge Function** (server-side fetch → `prices` table)
  or a **local script** emitting the price CSV. Matching = variant → search term → representative pack;
  keep a manual-override flag so scraped prices don't clobber edits.

## 5. Backlog
- ~330 recipe lines didn't match the master (parse artifacts / one-offs) — quick cleanup pass.
- `Garlic Clove` vs `Garlic` still separate variants — set `variant change = Garlic` to merge if wanted.
- Rough Product labels from the master (casing/family) — tidy in `pricebook.csv`.
- 430 null lines re-entry.
- Per-100g price auto-compute on import.

## 6. To regenerate after editing inputs
```
cd /home/user/daily-shuffle
node tools-apply-master.mjs   # ingredient-master.csv + split-plan.csv + recipe-...csv
                              #   -> recipe-ingredient-normalisation.final.csv + pricebook.csv
```

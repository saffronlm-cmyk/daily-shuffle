# Ingredient Quantity Normalisation — Proposal for Review

**Status:** Approved (§6 signed off 2026-07-01) — **no recipe data has been touched yet.** This
document is step 2 of the 3-step nutrition-estimation plan (see `logs/daily-shuffle_log.md`, the
2026-07-01 entries). Step 1 (USDA staple expansion → `staple_products` = 167 rows) is complete.
Step 3 (bulk nutrition re-population) is deliberately **not** started and must not run until the
quantities below are normalised. The ruleset is now ready to apply — the §6 decisions are locked
in (see the **Resolved decisions** box below).

> **Resolved decisions (2026-07-01 sign-off):**
> 1. **Source of truth:** new non-destructive `ingredient_grams` jsonb column (§2). ✅
> 2. **Cup basis:** **UK cup = 250 ml** (not the US 240 ml originally recommended) — §3.3 updated.
> 3. **Bare mains with no amount:** assign a default portion + `estimated` flag (§3.6.3). ✅
> 4. **Garnish / "to serve":** small **5 g** default (§3.6.2). ✅
> 5. **The 8 recipes with no `serves`:** **skip them** — do not normalise; add a
>    `serves_missing` review flag so they surface for a manual `serves` fill before any later pass.

The point of this step: the bulk nutrition pass's accuracy ceiling is capped by *unknown
quantities*, no matter how good the per-ingredient macros are. A perfect gram-value for "avocado"
is useless against a line that just says `½ avocado` or `salt, to taste`. This step converts every
ingredient line into a **gram weight for the whole recipe**, with a per-line provenance flag, so
step 3 only has to do macro maths — never quantity guesswork.

---

## 1. The data as it actually is (measured, not assumed)

Live counts from Supabase project `jsxcctrskkkxgdxfaduo`, `recipes` where `import_status <> 'deleted'`
(327 recipes; 319 have `serves` set, 8 do not).

**`ingredient_sections` item shapes** (branch on `jsonb_typeof(item)`):

| Shape | Count | Notes |
|-------|------:|-------|
| `string` (legacy) | 4049 | e.g. `"1½ tbsp light soy sauce"`, `"Salt"` |
| `object` (structured) | 56 | `{qty, unit, name, note, group}`; only recipes added since the 2026-06-29 parser overhaul |
| `null` | 53 | placeholder/blank lines (mostly recovered-but-empty section rows) — carry no ingredient |

**Unit distribution** across all real lines (first-match precedence — metric weight checked before
volume, so `1 cup (60g)` counts as metric):

| Bucket | Count | Handling |
|--------|------:|----------|
| `tbsp` | 831 | volume → g via density class |
| `tsp` | 734 | volume → g via density class |
| leading number, no unit | 601 | count → g via per-piece table (`2 chicken breasts`, `½ avocado`) |
| already metric (g / ml / l) | 599 | **pass through** — no conversion |
| no number, no unit | 549 | bare seasonings, garnish, or bare mains — the hard tail |
| `cup` | 435 | volume → g via density class |
| vague measure (pinch/dash/handful/scoop/slice/sprig/bunch) | 204 | fixed defaults |
| `clove` | 88 | count → g (5 g/clove) |
| imperial (oz/lb) | 32 | convert to metric, then treat as metric |
| `to taste` | 32 | nominal / flagged |

So ~**35%** of lines are already metric or trivially convertible (metric + imperial), ~**49%** need a
deterministic volume/count/vague conversion, and ~**16%** (`no number, no unit`) need judgement.

**Existing parse we can reuse:** `recipe-ingredient-normalisation.final.csv` (repo root, from the
2026-06-25 stream) already holds a per-line `qty,unit,ingredient,note` split keyed by
`recipe_id|section_ord|item_ord`. It parsed *stated* quantities but never converted to grams or
filled blanks. It predates recipes added since 2026-06-25, so it's an **accelerant, not the source
of truth** — the live `ingredient_sections` remains authoritative and anything missing from the CSV
is re-parsed fresh.

---

## 2. Source-of-truth: where normalised grams live  ← **key decision, needs sign-off**

**Recommendation: add a new non-destructive column `ingredient_grams` (jsonb) to `recipes`.** Do
**not** mutate `ingredient_sections` in place.

Proposed shape — a flat array, one entry per real ingredient line, indexed back to
`ingredient_sections` by `sec` (section ordinal) + `item` (item ordinal):

```json
[
  {"sec":0,"item":0,"name":"chicken breast","grams":340,"qty_source":"converted","detail":"2 × 170 g"},
  {"sec":0,"item":1,"name":"olive oil","grams":14,"qty_source":"converted","detail":"1 tbsp × 14 g/tbsp (oil)"},
  {"sec":0,"item":2,"name":"salt","grams":1,"qty_source":"to_taste","detail":"to taste → nominal 1 g"},
  {"sec":1,"item":0,"name":"lettuce of choice","grams":null,"qty_source":"unresolved","detail":"no amount, generic item"}
]
```

Why a new column, not in-place edits to `ingredient_sections`:

- **Non-destructive & reversible.** Original recipe text (verbatim, human-authored) is preserved for
  display and editing; rolling back is `alter table ... drop column ingredient_grams`. Mirrors the
  `flags={usda_seed}` reversibility principle from step 1.
- **Zero app-code risk.** `index.html` reads `ingredient_sections` for display and the grocery list.
  Converting 4049 strings into objects would touch every render/aggregate path and risks a
  regression for a purely-internal nutrition need. The new column is invisible to the running app.
- **Self-describing audit trail.** `qty_source` + `detail` make every gram value explain itself —
  exactly the reviewability convention the pricebook/staples work established (reviewable CSV before
  live write).
- **Clean input for step 3.** The bulk pass reads `name`+`grams` per line, sums, divides by `serves`.
  Nothing else needed.

**Alternative considered (rejected for now):** embed `grams`/`qty_source` *into* each structured
item and migrate all strings to the object shape. Unifies the two shapes but forces a mutation of
live display data with app-render risk, for no nutrition benefit the parallel column doesn't already
give. If a future parser pass migrates strings → objects anyway, `ingredient_grams` can be folded in
then. *(The prior session log floated "apply across `ingredient_sections`"; this proposal recommends
the parallel column instead — flagged here so the change of approach is explicit and gets a yes/no.)*

---

## 3. Normalisation ruleset

Applied per line in this **precedence order** (first rule that matches wins):

### 3.0 Parse
- Normalise unicode fractions (`½ ¼ ¾ ⅓ ⅔ ⅛`) and ASCII fractions (`1/2`) to decimals; `1½` → 1.5.
- **Ranges** (`3–4 tbsp`, `1/2 - 1 tbsp`) → take the **midpoint** (3.5, 0.75).
- **Dual-unit lines** where a gram/ml is already given in parentheses or after a slash
  (`1 cup (60g)`, `3 tbsp / 65ml`, `75g / 2.5oz`) → **use the stated metric value, ignore the vague
  one.** This is the single highest-confidence signal and ~599 lines already have it.
- Strip prep/serve suffixes after a comma (`, diced`, `, to serve`) into `detail`; they don't affect
  weight.
- `heaped` / `rounded` multiplier ×1.5; `level` ×1.0; `scant` ×0.85 on the following spoon measure.
- `each:` lines (`½ tsp each: salt, pepper, garlic powder`) → apply the qty to **every** listed item
  (split into N lines internally, N × the per-unit gram).

### 3.1 Metric pass-through (`g`, `kg`, `ml`, `l`)
Use as-is. `kg`→×1000, `l`→×1000 ml. Liquids in ml converted to grams via the density in §3.3
(default 1.0 g/ml). `qty_source = "stated"`.

### 3.2 Imperial → metric
`oz → 28.35 g`, `lb → 453.6 g`, `fl oz → 30 ml`. Then treat as metric. `qty_source = "converted"`.

### 3.3 Volume → grams (density-class table)
Base volumes: **tsp = 5 ml, tbsp = 15 ml, cup = 250 ml** (UK cup — per the 2026-07-01 sign-off).
Grams = ml × density. (tsp/tbsp are the same in UK and US; only the cup differs — the cup columns
below are 250 ml × density.) Density is
**ingredient-class-aware** because a tbsp of oil (≈14 g), honey (≈21 g) and cocoa (≈6 g) are wildly
different — a flat "1 tbsp = 15 g" would be wrong for a large share of lines.

| Class | Example ingredients | g/ml | tsp | tbsp | cup |
|-------|--------------------|-----:|----:|-----:|----:|
| Water-like liquid | water, milk, stock, juice, vinegar, wine, most thin sauces | 1.00 | 5 | 15 | 250 |
| Soy/fish/thin savoury sauce | soy, fish, Worcestershire, tamari | 1.10 | 5.5 | 16 | 275 |
| Oil / melted fat | olive/veg/coconut/sesame oil, melted butter | 0.91 | 4.5 | 14 | 227 |
| Syrup / honey | maple, honey, golden syrup, molasses, agave | 1.40 | 7 | 21 | 350 |
| Granulated sugar | white/caster/brown sugar | 0.85 | 4 | 12.5 | 213 |
| Thick paste / nut butter | peanut/almond butter, tahini, miso, tomato paste, curry paste | 1.05 | 5 | 16 | 263 |
| Thick dairy | yoghurt, Greek yoghurt, sour cream, mayo, crème fraîche | 1.02 | 5 | 15 | 255 |
| Flour / starch | plain/SR/oat flour, cornflour | 0.53 | 2.6 | 8 | 133 |
| Cocoa / cacao powder | cocoa, cacao | 0.41 | 2 | 6 | 103 |
| Fine salt | table/sea salt | 1.20 | 6 | 18 | — |
| Ground spice | cumin, paprika, cinnamon, etc. | 0.50 | 2.5 | 6 | — |
| Grated/shredded cheese | cheddar, parmesan, mozzarella | — | — | 7 | 100 |
| Seeds | chia, sesame, flax | — | — | 10 | 160 |
| Rolled oats (dry) | oats | — | — | 6 | 90 |
| Rice (dry) | white/brown/jasmine/basmati | — | — | — | 185 |
| Leafy greens (packed) | spinach, watercress, rocket, herbs | — | — | — | 30 |
| Berries | blueberries, raspberries | — | — | — | 140 |
| Chopped veg | onion, pepper, tomato | — | — | — | 150 |
| **Fallback (unknown solid)** | — | 0.60 | 3 | 9 | 156 |
| **Fallback (unknown liquid)** | — | 1.00 | 5 | 15 | 250 |

`qty_source = "converted"`. The class is chosen by matching the ingredient name against a keyword
map (reusing `staple_products` aliases where they help); unmatched → the fallback row + a
`review_match`-style note in `detail`.

### 3.4 Count → grams (per-piece, edible-portion, typical UK sizes)
For `clove`, `slice`, and bare-number-no-unit count items. Grams = count × per-piece weight.

| Item | g/piece | | Item | g/piece |
|------|--------:|---|------|--------:|
| egg (medium, no shell) | 50 | | garlic clove | 5 |
| avocado (medium, flesh) | 150 | | onion medium / small / large | 150 / 100 / 200 |
| banana (peeled) | 118 | | chicken breast | 170 |
| chicken thigh (boneless) | 90 | | salmon/fish fillet | 130 |
| carrot (medium) | 60 | | (bell/green) pepper | 120 |
| tomato (medium) | 120 | | potato (medium) / new potato | 170 / 25 |
| lemon (juice) / lime (juice) | 45 / 30 | | spring onion | 15 |
| fresh chilli | 15 | | slice of bread / sourdough | 40 / 50 |
| tortilla / wrap | 45 | | rice cake | 9 |
| stock cube | 10 | | bay leaf | 0.2 (≈0) |
| cucumber (whole) | 300 | | courgette (medium) | 200 |
| **fallback (unknown count item)** | 100 | | | |

`qty_source = "converted"` where the item is in the table; `"estimated"` where the fallback 100 g is
used (low confidence — see §3.6).

### 3.5 Vague measures (fixed defaults)

| Term | Default | Notes |
|------|--------:|-------|
| pinch | 0.3 g | seasoning |
| dash | 0.5 g / 0.6 ml | |
| drizzle | 5 g | ≈1 tsp oil |
| splash | 15 ml | ≈1 tbsp |
| knob (butter) | 15 g | |
| handful | 30 g | leaves / nuts / berries / grated cheese — context default |
| scoop (protein powder) | 30 g | |
| sprig (herb) | 2 g | |
| bunch (herbs) / bunch (spring onions) | 30 g / 75 g | |

`qty_source = "defaulted"`.

### 3.6 Unquantified & "to taste" policy (the `no number, no unit` tail, ~549 lines)
Three sub-cases, each with a distinct `qty_source` so step 3 and the user can see confidence:

1. **Seasonings / "to taste"** (salt, pepper, bare spices, `salt and pepper, to taste`): assign a
   nominal small default — **salt 1 g, pepper 0.5 g, ground spice 1 g**. `qty_source = "to_taste"`.
   Nutritionally these are ~0 kcal, so precision barely matters; the point is they must never *block*
   a recipe estimate.
2. **Garnish / "to serve" / "for garnish" / side items** (`Fresh basil leaves, to serve`,
   `Side salad`, `sesame seeds` as topping): small default **5 g** (leafy/seed garnish).
   `qty_source = "garnish"`. Contributes minimally; low stakes.
3. **Bare mains with no amount** (`Chicken breasts`, `chickpeas`, `low-carb tortillas`,
   `chocolate protein powder` with no number): these *do* swing calories. Assign a **single default
   portion** — 1 piece from §3.4 for count items, or **one typical serving in grams** for
   bulk/measured items (e.g. chickpeas → 200 g, protein powder → 30 g, tortilla → 1 × 45 g) — and
   mark `qty_source = "estimated"` (lowest confidence). Every recipe containing an `estimated` or
   `unresolved` line also gets a **recipe-level `review_flags` entry `quantities_estimated`** so
   step 3 down-weights it and the user can spot-fix.
4. **Genuinely unresolvable** (`lettuce of choice`, `Chicken jus (collected from roasting tray)`):
   `grams = null`, `qty_source = "unresolved"`, recipe flagged `quantities_estimated`. Step 3 treats
   these as zero-contribution but surfaces the flag.

### 3.7 Per-line provenance vocabulary (summary)
Stored as `qty_source` on each `ingredient_grams` entry, ordered high→low confidence:

`stated` · `converted` · `defaulted` · `to_taste` · `garnish` · `estimated` · `unresolved`

Recipe-level `review_flags` reuse the existing informal vocabulary; add **`quantities_estimated`**
when any line is `estimated`/`unresolved`.

---

## 4. Worked examples

| Original line | → grams | qty_source | detail |
|---------------|--------:|-----------|--------|
| `40g peanut butter` | 40 | stated | — |
| `185ml (¾ cup) Alpro soya milk` | 185 | stated | dual-unit; used stated ml |
| `1 pound ground chicken` | 454 | converted | 1 lb × 453.6 |
| `1½ tbsp light soy sauce` | 24 | converted | 1.5 tbsp × 16 g/tbsp (sauce) |
| `1/2 cup (150g) maple syrup` | 150 | stated | dual-unit; used stated g |
| `1 cup pumpkin puree` | 255 | converted | 1 cup (250 ml) × ~1.02 (thick) |
| `2 chicken breasts` | 340 | converted | 2 × 170 g |
| `½ avocado` | 75 | converted | 0.5 × 150 g |
| `1 garlic clove` | 5 | converted | 1 × 5 g |
| `3–4 tbsp pickle juice` | 53 | converted | midpoint 3.5 tbsp × 15 |
| `Pinch salt` | 0.3 | defaulted | pinch |
| `salt and pepper, to taste` | 1.5 | to_taste | salt 1 + pepper 0.5 |
| `Fresh basil leaves, to serve` | 5 | garnish | leafy garnish default |
| `Chicken breasts` | 170 | estimated | bare main → 1 breast; recipe flagged |
| `lettuce of choice` | null | unresolved | no amount, generic; recipe flagged |

---

## 5. How it will be applied (future session — not now)

1. Read every non-deleted recipe's `ingredient_sections` via Supabase MCP (this channel is not
   sandbox-blocked, unlike USDA/Apify). Branch on `jsonb_typeof`. **Skip the 8 recipes with no
   `serves`** (§6 decision 5): don't normalise them; instead set `review_flags += serves_missing`
   so they surface for a manual `serves` fill before any later pass.
2. For each real line, run §3 to produce an `ingredient_grams` entry. The **deterministic** rules
   (metric, imperial, clove, vague, ranges/fractions) run mechanically; the **judgement** calls
   (density class, count-table match, bare-main portioning) are done by Claude-Code reasoning
   per-line — same rationale as step 3 being a reasoning pass, not a dumb script.
3. Write results to the new `ingredient_grams` column (added via `apply_migration`) in batches,
   and set `review_flags += quantities_estimated` where applicable.
4. **Reviewable-first, per project convention:** emit the full per-line result as a CSV for
   Saffron to spot-check *before* the live write — mirrors pricebook/staples. She catches
   wrong-class or wrong-portion calls the same way she caught wrong-form USDA matches.
5. Only after quantities are approved does **step 3** (bulk nutrition) run.

---

## 6. Sign-off decisions (resolved 2026-07-01)

All five were answered; the ruleset above already reflects them. Recorded here for the apply-session:

1. **Source of truth:** ✅ new non-destructive `ingredient_grams` jsonb column (§2) — *not* an
   in-place `ingredient_sections` edit.
2. **Cup basis:** **UK cup = 250 ml** (overrode the original US 240 ml recommendation). §3.3 cup
   columns and the §4 example are recomputed at 250 ml.
3. **Bare-main portioning (§3.6.3):** ✅ assign a default portion + `estimated` flag (keeps calorie
   totals realistic, low confidence visible) — not leave `null`.
4. **Garnish / "to serve" (§3.6.2):** ✅ small **5 g** default (kept visible without moving totals).
5. **8 recipes with no `serves`:** **skip them** (do *not* normalise) and set `serves_missing` on
   `review_flags` so they surface for a manual `serves` fill first — see §5 step 1.

The ruleset is now ready to apply in a future session; step 3 (bulk nutrition) still runs only
after these quantities are applied and the pre-write review CSV is spot-checked.

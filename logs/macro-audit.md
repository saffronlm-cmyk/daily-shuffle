# Macro corrections & library audit log

Running record of recipe macro recalculations (per serving). Macros recomputed from
ingredient lists using standard USDA-equivalent values; calories rounded to nearest whole,
macros to nearest 0.5 g. See `scratchpad/macro-corrections-review.md`-style breakdowns for
per-ingredient math on the manually-corrected batch.

Format: `kcal / protein_g / carbs_g / fat_g / fibre_g / sugar_g`.

---

## Batch A — manual corrections from Saffron's supplied ingredient lists (2026-07-16) — WRITTEN

10 recipes, ingredient lists provided in chat, confirmed per-recipe, written to Supabase.

| Recipe | serves | Before | After | Notes |
|---|---|---|---|---|
| XL Gluten Free Rice Paper Dumplings | 4 | 228/20/18/7/1.5/2 | **256/21/15.5/12.5/1.5/2** | fat up (chicken + sesame oil) |
| Mango Yogurt Bites | 7 | 80/–/–/–/–/– | **70/2/8.5/3.5/0.5/8** | mini white choc bar = 25 g; ingredient_sections was empty (nulls) |
| Chocolate Date Cake | 9 | 198/4.5/32/5/2.5/18 | **253/5.5/51/5/4.5/32** | 2 eggs; 15 medjool dates ≈ 360 g |
| Green Goddess Salad | 3 | 188/4.5/22/10/6/12 | **388/11/37.5/24.5/11.5/18** | 60 ml olive oil badly undercounted before |
| Carrot Cake Baked Oats | 2→**4** | 312/14/48/8.5/5.5/18 | **407/18/54.5/14.5/7/18** | serves changed 2→4; nuts 30 g |
| Boiled Egg Chocolate Mousse | 4 | 138/16/16/6/2.5/12 | **290/18/29.5/15/7/19** | 8 whole eggs = 42 g fat, was undercounted |
| Vietnamese Lettuce Wraps w/ Peanut Sauce | 3 | 248/16/28/8.5/3.5/8 | **460/36.5/51/14.5/6.5/15.5** | prawns/noodles/peanut; pickle brine excluded |
| Vietnamese Chicken & Noodle Bowls | 4 | 498/38/48/12/5/8 | **592/39/75/14.5/4/10** | 270 g dry noodles drives carbs |
| Vegan Tahini Brownies | 9 | 265/4.5/30/15/3/18 | **292/6/36.5/16/4.5/22.5** | closest to old estimate |
| Vegan Protein Waffles | null→**2** | 198/9.5/22/8.5/2/4 | **463/29/46/18/3/9.5** | serves set null→2 |

Quantity assumptions & overrides that shaped these are documented in the review sheet
(leafy-produce `=Xg` annotations were water-density and overstated; corrected to realistic
weights).

---

## Read-only library audit (no writes)

Goal: sweep the whole `recipes` library (import_status='ready'), recompute macros where
ingredient quantities are explicit enough to audit, and flag which stored values are
materially off. **No DB writes** — this is a worklist, not an application.

- **Auditable now** = ingredient_sections populated with parseable quantities (weights,
  volumes, or standard-countable units) AND serves present.
- **Deferred** = missing/vague quantities, empty ingredient lists, or null serves — these
  need quantity normalisation (workstream step 2) or a human decision first.
- Processed 10 at a time; each batch recorded below.

### Batch B (2026-07-16) — recipes 1–10 alphabetically (read-only, no writes)

Verdicts: ✅OK (within ~15%) · ⚠OFF (recommend correction) · ◐PARTIAL (a qty missing) · ⛔DEFERRED.

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| 30 Minute Bang Bang Chicken Bowls | 4 | 388/34/12/23/0.5/8 | protein ≈45 (rice base unquantified) | ◐ protein low; needs rice qty |
| 4 Ingredient Date Balls | 12 | 68/1.5/14/0.5/1.2/10 | ~77/1.9/15.5/1/1.75/9 | ✅ minor |
| 4 Ingredient Rice Cake Chocolate Bars | 4 | 165/4.3/20/8.8/1.7/9 | **~266/5.5/30/15/2/18.5** | ⚠ OFF (~+60%) |
| Air Fryer Cinnamon Roll Oats | 1 | 398/20/46/16/5/8 | **~616/17/73/28/7/32** | ⚠ OFF (cookie butter est.) |
| Air Fryer Spring Rolls | 4 | 451/25/34/25/3.2/4.5 | ~534/26/35.5/30.5/… | ✅ within ~18% (pork fat) |
| Apple Almond Yogurt Bowl | 1 | 418/16/48/18/5.5/34 | — | ⛔ ingredient list empty (nulls) |
| Asian Chicken Salad w/ Cucumber & Seaweed | 2 | 461/50.1/null/null/null/null | **~212/25/4.5/10.5/2.5/1** | ⚠ OFF (~2× + null macros) |
| Baked Middle Eastern Chicken Tray | 4 | 318/36/5/16/0.8/2.5 | **~377/58/7/16/1/2.5** | ⚠ OFF (protein low) |
| Banh Cuon - Vietnamese Rice Paper Rolls | 1 | 570/30/70/20/null/null | ~583/26/58/25/…/… | ✅ close; fibre/sugar null |
| Basic Oat Flour Pancakes | 2 | 68/3.5/8/2/0.8/1.5 | **~153/9/18/5/2.5/1.5** | ⚠ OFF (wrong serving basis?) |

- Auditable this batch: 9/10 (Apple Almond Yogurt Bowl deferred — empty list).
- Recommend-correction: 5 (Rice Cake Bars, Cinnamon Roll Oats, Asian Chicken Salad,
  Middle Eastern Tray, Oat Flour Pancakes). Bang Bang partial (needs rice qty).
- Recurring data gaps surfaced: several recipes have `null` carbs/fat/fibre/sugar even
  where calories/protein exist (Asian Chicken Salad, Banh Cuon).

### Batch C (2026-07-16) — next 10 alphabetically ("BBQ…" → "Buffalo…") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| BBQ Chicken Stuffed Sweet Potatoes | 4 | 378/32/46/6/6/18 | ~320/30/37/5/5.5/7.5 | ✅ close (sugar high in stored) |
| Blended Overnight Oats | 1 | 398/32/36/12/6.5/6 | **~475/36/48/14/9.5/8** | ⚠ OFF low; topping unquantified |
| Blended Raspberry Protein Chia Pudding | 3 | 268/25/24/7.5/9/10 | — | ⛔ ingredient list empty (nulls) |
| Blueberry Cheesecake Yogurt Bowl | 1 | 318/24/42/5/1.5/28 | ~314/24/37/7.5/1.5/21 | ✅ good match |
| Blueberry, Lemon & Coconut Overnight Oats | 1 | 332/17/42/8/8.5/14 | **~437/22/55/15/13/12** | ⚠ OFF low (chia+coconut) |
| Bone Broth Smothered Chicken | 4 | 368/38/6/21/0.5/1 | ~649/44/9/47/1/2 (no rice) | ◐ rice qty missing; fat undercount (skin-on) |
| Bounty Bar Overnight Oats | 1 | 388/6/42/21/7/18 | — | ⛔ ingredient list empty (nulls) |
| Brothy Miso Ginger Chicken and Rice | 3 | 485/38/42/17/2.5/8 | ~509/46/24.5/23/1.5/13 (no rice) | ◐ rice qty missing; protein higher |
| Brownie Batter Overnight Oats | 4 | 198/13/26/6/7.5/8 | — | ⛔ ingredient list empty (nulls) |
| Buffalo Chicken Wrap | 2 | 618/48/38/28/3/8 | ~880/59/55/44.5/…/… (all slaw) | ◐ "1 bag" slaw + portion ambiguous |

- Fully auditable: 4/10 (2 OK, 2 OFF-low). Partial (unquantified base): 3. Deferred (empty): 3.
- Patterns: overnight-oats entries often have unpopulated ingredient lists; "cooked white
  rice for serving" (no qty) recurs on chicken-and-rice mains; skin-on vs skinless thigh is
  a big fat swing.

**Running totals through Batch C:** ~30 of 310 ready recipes covered (10 written + 20 audited).


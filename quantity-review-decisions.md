# Quantity review — Saffron's decisions (v2 sheet)

Companion to `quantity-review-decisions.v2.csv`. Nutrition workstream **step 2**
(see `quantity-normalisation-plan.md` for the locked ruleset, CLAUDE.md for the
3-step context). Received 2026-08-07, **not yet applied to the database**.

## The files

| File | What it is |
|---|---|
| `quantity-review-decisions.v2.raw.csv` | Saffron's upload, byte-for-byte. Do not edit. |
| `quantity-review-decisions.v2.csv` | Working copy: same values, joined to live recipe IDs. |

The working copy differs from the raw upload in three mechanical ways and **no
value was changed**:

1. Dropped the 80 all-blank filler rows and the unnamed index column (spreadsheet
   export artefacts — the raw file interleaves one empty row per data row).
2. Added `recipe_id`, `sec`, `item` — the live `recipes` row and the
   `ingredient_sections[sec].ingredients[item]` position each decision belongs to.
3. Added `implied_per_serve` = `corrected_grams / serves`, derived for review only.

Columns were reordered for readability; every value cell is verbatim.

## The join is clean

All **80** reviewed lines match exactly one live ingredient line on
`(recipe_name, section, ingredient_line)`, and every `serves` on the sheet agrees
with the live `serves`. No ambiguity, no orphans.

One name needed disambiguating: **Carrot Cake Baked Oats** has three rows in
`recipes` (serves 4, 1 and 6 — genuinely different recipes, not duplicates). Only
the `serves 1` one (`e220f797`) carries a `To Top / Sultanas` line, so the
reviewed row belongs to it.

## The grams convention is right

Saffron scaled corrected grams by the recipe's `serves`. That matches the plan:
§ "…into a **gram weight for the whole recipe**", and step 3 "sums, divides by
`serves`". So `corrected_grams` is a whole-recipe total throughout — keep it that way.

Her scaling is also **correcting a defect in the script**, not just filling gaps.
`normalise_quantities.py`'s `BARE_SERVING` table returns "one typical serving"
(rice 180, yoghurt 150, avocado 150 …) into a column that is defined as a
whole-recipe weight. For any recipe with `serves > 1` that default is short by a
factor of `serves`. See "The unreviewed remainder" below for how far that reaches.

Scaling is consistent across the sheet: rice/noodles/quinoa mostly land on
**125 g per serve**, yoghurt on 20–60 g, avocado on 45 g (¼ each).

## Open decisions (these block the apply)

### 1. "Exclude from nutritional calculations" has nowhere to go

Three rows carry that note *and* a gram value:

| Recipe | Line | corrected_grams |
|---|---|---|
| Chipotle Chicken & Rice Skillet | rice of choice | 400 |
| Creamy Thai Coconut Chicken Meatballs | rice | 400 |
| Double Roast Chicken with Chicken Fat Rice | Toasted rice, ground | 800 |

`ingredient_grams` as specced has no per-line exclude flag, so as things stand the
grams would be written and step 3 would count them. Needs a decision: add an
`exclude_from_nutrition` flag per line, or drop the grams, or accept the macros.

### 2. 24 of 80 rows have no `corrected_grams`

Blank is ambiguous — "computed default is fine" and "not done yet" look identical.
Ten of the blanks carry a note that reads as *exclude the line* ("irrelevant",
"N/A", "not enough to actually count", "optional, not included in nutritional
estimations or grocery list"); the other fourteen are silent. Also
`Copycat Nando's / lettuce of choice` has the literal string `N/A` in the grams
column rather than a number.

### 3. Two of the recipes have no `serves`

`Cat Magic Macro Protein Brownie` (2 rows) and `Grilled Hot Honey Chicken with
Fresh Peach Salsa` (2 rows) are on the 4-recipe `serves_missing` list. The script's
plan-§6 guard skips those recipes entirely and leaves `ingredient_grams` **null**,
so these four decisions will be silently discarded unless `serves` is filled first.

### 4. Three rows are recipe edits, not gram values

These need a write to `ingredient_sections`, which is otherwise read-only:

- **Carrot Cake Baked Oats** (`e220f797`) — "take them out of the recipe" for the
  `To Top` sultanas (grams entered as 0).
- **Fluffy Vegan Protein Pancakes** (`a4507301`) — `[Main] Vanilla` should read
  `vanilla protein powder`.
- **Creamy Mango and Coconut Cod Curry** (`5c54547f`) — `Soy sauce & fish sauce`
  is one line holding two ingredients; should be split into two lines, 1 tbsp each.

## Worth a second look before applying

Three values sit outside Saffron's own per-serve pattern. They may be deliberate:

| Recipe | Line | Entered | Per serve | Her usual |
|---|---|---|---|---|
| Mediterranean Chicken & Rice Skillet | thick yogurt | 40 g / serves 4 | 10 g | 20–60 g |
| Middle Eastern Chicken & Rice Bowl | rice of choice | 250 g / serves 4 | 62.5 g | 125 g |
| Firecracker Beef Bowls | Rice, soba or vermicelli | 180 g / serves 4 | 45 g | 125 g |

The Firecracker value is also exactly the script's computed default, which is what
an un-scaled row looks like.

Four rows are given in **millilitres** (`Oat milk` 45, `Milk to thin` 15,
`Extra milk` 60, `Avocado oil for coating` 15). Milk and water are ~1:1 so those
are fine as grams; the avocado oil is 15 ml ≈ 13.8 g.

## The sheet cannot be regenerated from this repo

The committed `scripts/normalise_quantities.py` reproduces **64 of 80** rows
exactly. The other 16 differ because the generator that made this sheet knows
whole-vegetable weights that the committed script does not:

| Line | Sheet | Committed script |
|---|---|---|
| `1 whole butternut squash` | 800 | 100 (`unknown unit, fallback`) |
| `1 head cauliflower, cut into small florets` | 600 | 100 |
| `½ cabbage, thinly sliced` | 450 | 50 |
| `¼ red cabbage` | 225 | 25 |
| `1 head of broccoli, cut into florets` | 350 | 100 |

The sheet's `why_flagged` and `how` columns are likewise not emitted by the
committed script. So whatever produced this v2 sheet is local-only. Either fold
those whole-vegetable weights into `normalise_quantities.py`, or treat this CSV as
the source of truth for these 80 lines and let the script handle only the rest.

## The unreviewed remainder

Measured against live data on 2026-08-07 (343 recipes, 4,355 ingredient lines):

- **3,956** real lines; **3,182** carry a leading quantity and normalise cleanly.
- **774** have no leading quantity. Most are seasonings/garnishes/"handful" — those
  take `to_taste`/`garnish`/`VAGUE` defaults, which are per-recipe already and are
  not affected by the scaling problem.
- **241** are bare bulk staples (the class this sheet is drawn from). **172** of
  those sit in recipes with `serves > 1`, across **80** recipes — so roughly **90
  more lines** carry the same per-serving defect and have never been surfaced for
  review. They need the same treatment as the 80 here.

Two live counts that have moved since the docs were written:

- **343** recipes (CLAUDE.md and the plan both say 327/332), 4 with null `serves`.
- **29** fully hollow recipes / **399** null lines — down from the 52 / 681 on
  `null-lines-reentry.v2.csv`. 23 have been re-entered since that worklist was cut.
  No recipe is partially hollow; it is all-or-nothing, as before.

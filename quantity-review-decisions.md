# Quantity review — Saffron's decisions (v2 sheet)

Companion to `quantity-review-decisions.v2.csv`. Nutrition workstream **step 2**
(see `quantity-normalisation-plan.md` for the locked ruleset, CLAUDE.md for the
3-step context). Received 2026-08-07, **not yet applied to the database**.

## The files

| File | What it is |
|---|---|
| `quantity-review-decisions.v2.raw.csv` | Saffron's upload, byte-for-byte. Do not edit. |
| `quantity-review-decisions.v2.csv` | Working copy: same values, joined to live recipe IDs. |
| `quantity-review-worklist.v3.csv` | The next 88 lines to rule on. Empty `corrected_grams` — this one is for filling in. |

The working copy differs from the raw upload in three mechanical ways and **no
value was changed**:

1. Dropped the 80 all-blank filler rows and the unnamed index column (spreadsheet
   export artefacts — the raw file interleaves one empty row per data row).
2. Added `recipe_id`, `sec`, `item` — the live `recipes` row and the
   `ingredient_sections[sec].ingredients[item]` position each decision belongs to.
3. Added `implied_per_serve` = `corrected_grams / serves`, derived for review only.

Columns were reordered for readability.

**Three `corrected_grams` values were later changed on Saffron's instruction**
(2026-08-07, see "Outliers" below) — those rows carry a `corrected 2026-08-07
(was N)` note. Every other value cell is verbatim, and the raw upload is
untouched, so the originals are always recoverable from `.raw.csv`.

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

## Decisions taken (2026-08-07)

### 1. "Exclude from nutritional calculations" → a per-line flag

Three rows carry that note *and* a gram value:

| Recipe | Line | corrected_grams |
|---|---|---|
| Chipotle Chicken & Rice Skillet | rice of choice | 400 |
| Creamy Thai Coconut Chicken Meatballs | rice | 400 |
| Double Roast Chicken with Chicken Fat Rice | Toasted rice, ground | 800 |

**Resolved:** each line in `ingredient_grams` may carry
`exclude_from_nutrition: true`. The grams are still written, so cost and the
grocery list see the rice; step 3 must skip those lines when summing macros.
`load_decisions()` sets the flag from the note text, from a literal `N/A`, or
from a `corrected_grams` of 0.

### 2. Blank `corrected_grams` — 24 of 80 rows

**Resolved:** a blank with an exclude note means *leave the line out*; a silent
blank is still to do.

Correcting a miscount in the first version of this doc: ten blanks carry *a note*,
but only **six** of those notes actually say to leave the line out — Fluffy Vegan
Protein Pancakes (filling of choice), Cat Magic Macro Protein Brownie (×2,
sweetener drops), Firecracker Beef Bowls (diced cucumber), Miso Peanut Ramen Bowl
(sliced cucumber) and Turkey Taco Scramble (pickled onions). The other four notes
give quantity information instead of an exclusion — BBQ Chicken Stuffed Sweet
Potatoes ("1 avocado split between the 4 serves"), Chili Honey Chicken Bowl, Creamy
Mango and Coconut Cod Curry, and Double Roast Chicken ("1/2 cup?") — so those stay
on the to-do pile with the fourteen silent ones.

That makes it **6 excluded, 18 still to decide**, plus `Copycat Nando's / lettuce
of choice`, which has the literal string `N/A` in the grams column and is read as
an exclusion.

### 3. The unreviewed remainder → a v3 worklist

**Resolved:** fix the script, then re-review. Both halves are done —
`BARE_SERVING` now scales by `serves`, the missing whole-vegetable weights are in,
and `quantity-review-worklist.v3.csv` holds the **88 undecided lines across 58
recipes** in the same shape as the v2 sheet. Fill in `corrected_grams` /
`exclude_from_nutrition` / `note` and it feeds back through `--decisions`.

## Still open

### 4. Two of the recipes have no `serves`

`Cat Magic Macro Protein Brownie` (2 rows) and `Grilled Hot Honey Chicken with
Fresh Peach Salsa` (2 rows) are on the 4-recipe `serves_missing` list. The script's
plan-§6 guard skips those recipes entirely and leaves `ingredient_grams` **null**,
so these four decisions will be silently discarded unless `serves` is filled first.

### 5. Three rows are recipe edits, not gram values

These need a write to `ingredient_sections`, which is otherwise read-only:

- **Carrot Cake Baked Oats** (`e220f797`) — "take them out of the recipe" for the
  `To Top` sultanas (grams entered as 0).
- **Fluffy Vegan Protein Pancakes** (`a4507301`) — `[Main] Vanilla` should read
  `vanilla protein powder`.
- **Creamy Mango and Coconut Cod Curry** (`5c54547f`) — `Soy sauce & fish sauce`
  is one line holding two ingredients; should be split into two lines, 1 tbsp each.

## Outliers — found and corrected

Three values sat outside Saffron's own per-serve pattern. She confirmed all three
were wrong and gave the replacements on 2026-08-07:

| Recipe | Line | Was | Now | Per serve |
|---|---|---|---|---|
| Mediterranean Chicken & Rice Skillet | thick yogurt | 40 g | **160 g** | 10 g → 40 g |
| Middle Eastern Chicken & Rice Bowl | rice of choice | 250 g | **500 g** | 62.5 g → 125 g |
| Firecracker Beef Bowls | Rice, soba or vermicelli | 180 g | **500 g** | 45 g → 125 g |

All three now land exactly on her conventions elsewhere in the sheet — 125 g of
rice per serve, 40 g of yoghurt per serve. The Firecracker value was also exactly
the script's old computed default, which is what an un-scaled row looks like; that
was the tell.

These are edits to `quantity-review-decisions.v2.csv` only. The worklist is
unaffected — all three rows were already decided, so they were never on it.

Four rows are given in **millilitres** (`Oat milk` 45, `Milk to thin` 15,
`Extra milk` 60, `Avocado oil for coating` 15). Milk and water are ~1:1 so those
are fine as grams; the avocado oil is 15 ml ≈ 13.8 g.

## Closing the gap with the script (done)

The committed script originally reproduced only **64 of 80** rows; it now
reproduces **79 of 80**. What changed in `scripts/normalise_quantities.py`:

- **Whole vegetables added to `COUNT_G`** — butternut squash 800 g, cauliflower
  600, cabbage 900, broccoli 350, pumpkin 900 and friends. Previously these fell
  through to the 100 g/piece fallback and came out ~8× light. Cabbage at 900 g
  reproduces Saffron's 450 / 225 / 315 / 157.5 entries exactly through the existing
  small/large modifiers, which is a good sign the number is the one she used.
- **A `CONTAINER_G` table** for punnet / pint / bag — `1 pint cherry tomatoes` was
  being read as *one cherry tomato* (17 g) rather than 300 g.
- **`N serving(s) of X`** now resolves through `BARE_SERVING` instead of the 100 g
  fallback. The count is explicit, so it does not also scale by `serves`.
- **Size words are read from before the first comma only.** `1 head cauliflower,
  cut into small florets` was taking a 0.7× "small" modifier off the prep clause —
  a whole cauliflower cut small, not a small cauliflower.
- **`BARE_SERVING` scales by `serves`** — the defect described above.

The one row that still differs is `1 large head romaine`: the script says 420 g
(300 × 1.4 for "large"), the sheet said 300. The script's answer looks more
correct and Saffron left the cell blank, so it is left alone.

Two flags were added to the script:

```bash
# merge reviewed decisions back in; reviewed lines get qty_source='reviewed'
python3 scripts/normalise_quantities.py recipes_dump.json review.csv updates.json \
    --decisions=quantity-review-decisions.v2.csv

# emit only the lines still needing a human ruling (this is how the v3 sheet is cut)
python3 scripts/normalise_quantities.py recipes_dump.json worklist.csv updates.json \
    --decisions=quantity-review-decisions.v2.csv --review-only
```

## The unreviewed remainder

Measured against live data on 2026-08-07 (343 recipes, 4,355 ingredient lines):

- **3,956** real lines; **3,182** carry a leading quantity and normalise cleanly.
- **774** have no leading quantity. Most are seasonings/garnishes/"handful" — those
  take `to_taste`/`garnish`/`VAGUE` defaults, which are per-recipe already and are
  not affected by the scaling problem.
- **241** are bare bulk staples (the class this sheet is drawn from). **172** of
  those sit in recipes with `serves > 1`.

Running the fixed script over those and subtracting the 80 already decided leaves
**88 lines across 58 recipes** — `quantity-review-worklist.v3.csv`. Its
`why_flagged` column sorts the work:

| Count | Flag |
|---|---|
| 37 | estimated default |
| 16 | plural name priced as 1 piece — likely a portion |
| 15 | medium (100–299 g) |
| 12 | large (≥300 g) main/base |
| 7 | very small (≤15 g) — check it is not a portion |
| 1 | unresolved (no value) |

The 16 "plural name priced as 1 piece" rows are worth doing first: bare
`strawberries` resolves to 12 g (one strawberry) because `COUNT_G` is consulted
before `BARE_SERVING`. Left alone that is a real under-count on toppings. It was
not changed in code because the fix is a guess about intent, which is what the
review sheet exists to settle.

Two live counts that have moved since the docs were written:

- **343** recipes (CLAUDE.md and the plan both say 327/332), 4 with null `serves`.
- **29** fully hollow recipes / **399** null lines — down from the 52 / 681 on
  `null-lines-reentry.v2.csv`. 23 have been re-entered since that worklist was cut.
  No recipe is partially hollow; it is all-or-nothing, as before.

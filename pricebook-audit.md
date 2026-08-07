# Price-book audit — 2026-08-06

Audit of `pricebook.csv` (987 variant rows, 6,995 ingredient uses across the recipe
library), run after merging the 20 verified Lidl prices in from
`pricebook.variants.csv`.

**Headline: the duplication is real but already handled. The actual defect is the
opposite one — the pipeline collapses genuinely different products into a single
shared price.** Read §3 before running the scrape; it changes what the scrape should
query.

---

## 1. Shape of the book

| | rows | uses | share of usage |
|---|---:|---:|---:|
| occurrences 0 | 39 | 0 | 0% |
| occurrences 1 | 240 | 240 | 3% |
| occurrences 2 | 343 | 686 | 10% |
| occurrences 3–9 | 216 | 1,118 | 16% |
| occurrences 10–49 | 117 | 2,318 | 33% |
| occurrences 50+ | 32 | 2,633 | 38% |

The top 100 rows cover 62% of all usage; the top 200 cover 76%. The 622 rows at
occurrences ≤ 2 account for 13% between them. **Effort spent below occurrence 3 is
close to wasted** — which is exactly why `--min-occ 3` is the right default.

431 Product families, mean 2.3 variants each.

## 2. Duplicates and junk (the thing that looked like the problem)

**Same item, multiple rows: 42 clusters, 46 redundant rows** (987 → 941 if collapsed).
Mostly plurals and prep words:

- `Garlic` (72) + `Freshly Garlic` (2)
- `Carrot` (54) + `Carrots` (1) — *and these sit in different Product families*
- `Banana` (10) + `Bananas` (8) — *different families*
- `Raspberry` (15) + `Raspberries` (2)
- `Tuna` (13) + `Tinned Tuna` (2) — *different families*
- `Firm Tofu` (8) + `Extra Firm Tofu` (2) + `Extra-firm Tofu` (1)
- `Juice Of 1 Lime` (7) + `Juice Of 1 Large Lime` (6)

**Rows that are not a purchasable product at all: 100 (10% of the book)** — parse
artefacts where quantity text was never stripped:

| count | pattern | examples |
|---:|---|---|
| 43 | leading quantity | `½ Tbsp Fish Sauce`, `0% Fat Greek Yogurt` |
| 22 | leading punctuation | `- 1 Tbsp Maple Syrup`, `/ 65ml Vegetable Oil`, `+ 1 Tbsp Raw Honey` |
| 17 | leading unit word | `Sheets Rice Paper`, `Stalk Lemongrass`, `Cups Bean Sprouts` |
| 16 | embedded quantity | `Pound Ground Chicken`, `Large Handful Fresh Coriander` |
| 2 | bare descriptor | `Fresh`, `Large` |

211 rows have **no Product family at all**, and they are overwhelmingly these
artefacts (281 uses total, i.e. ~1.3 uses each).

### 2a. Where the duplicates actually are: produce and fruit

Saffron's read, 2026-08-06, and the data agrees: **variants that differ by type are
usually genuinely separate products** — the milk, cheese and yoghurt families are the
clearest cases, and those must be priced separately, not merged (see §3). **The real
same-item duplication is concentrated in veg and fruit, and it is largely rows that
still carry quantity text.**

Of 214 Produce/Vegetables rows plus 47 fruit rows filed under other categories, **37
still carry quantity or measure text**. Clustering those to their base item:

| base item | fragment rows | uses | clean base row |
|---|---:|---:|---|
| Garlic | 2 | 111 | `Garlic` (72) |
| Lime | 16 | 102 | `Lime` (18) |
| Lemon | 11 | 67 | `Lemon` (24) |
| Onion | 5 | 5 | **none** |
| Ginger | 4 | 4 | `Ginger` (75) |
| Parsley | 4 | 4 | `Parsley` (19) |
| Orange | 4 | 4 | **none** |
| Kale / Celery / Edamame | 3 | 5 | all exist |

**49 rows / 302 uses fold into 10 base items.** Citrus dominates: `Lime Juice` (57),
`Lime Wedge` (8), `Juice Of 1 Lime` (7), `Juice Of 1 Large Lime` (6), `Lime Zest` (6),
`Zest Of 1 Lime` (4), `Juice Of 2 Limes` (3) … all of which are *a lime*. In three
cases the fragments outweigh the clean row — `Garlic Clove` has 110 uses against
`Garlic`'s 72, `Lime Juice` 57 against `Lime`'s 18.

**Trap: folding these needs a conversion factor, not just a rename.** A clove is not a
bulb (~⅒), a stalk is not a head of celery, the juice of one lime is one lime but a
wedge is ~⅙. Renaming `Garlic Clove` → `Garlic` without a factor prices every clove at
bulb price — roughly **10× too high** on the single most-used ingredient in the
library. Same class of problem as `quantity-normalisation-plan.md` handles for recipe
lines; the factors belong with the fold, in the same pass.

`Onion` and `Orange` have no clean base row at all — those need creating, not merging.

**Why the rest is mostly a non-issue:** only **3** of the 100 artefact rows have
occurrences ≥ 3 (`Clove` 8, `Fresh` 5, `Sheets Rice Paper` 3). `price_pricebook.py`
already groups by Product, drops junk via its own measurement-fragment and
not-a-grocery filters, and applies `--min-occ`. Run today it queries **208 products**
— exactly the number `handoff.md` quotes, unchanged despite the book growing. The
long tail costs nothing.

The one live cost of the duplicates is **alias splitting**: when `Carrot`/`Carrots` or
`Tuna`/`Tinned Tuna` sit in different families, the aliases attach to the wrong entry
and `lookupPriceBook()` misses.

## 3. The real defect — one price per Product family

`csv_to_seed.py:build_entries()` keys the price book by `canonicalise(Product)` and
uses `setdefault`, so **the first priced row in a family sets the price for every
variant in it**; the rest become aliases pointing at that price.
`price_pricebook.py` has the same shape upstream — it issues one Apify query per
Product, so it searches `"Oil"`, not `"sesame oil"`.

This contradicts the data model locked in the 2026-06 normalisation session:

> variant = price unit + recipe name; product = family/grouping only.
> Product is organisation, **not** a shared price.

(Established from Saffron's own master edits — almond/soya/dairy milk all sit under
Product `Milk` but are priced separately.) `csv_to_seed.py` is "unchanged since v1"
and predates that correction, so it still implements the model backwards.

**Exposure: 83 of the 204 in-scope families carry variants with real distinguishing
words — 4,355 uses, 62% of all ingredient usage.** (Upper bound: a few flagged
families, e.g. `garlic`/`clove` or `vanilla extract`/`pure`, are genuinely one
product.) The clearly wrong ones — note that Milk, Cheese and Yoghurt are here
**because their variants are legitimately different products**, which is exactly why a
shared family price is wrong for them:

| uses | variants | family | one price would cover |
|---:|---:|---|---|
| 359 | 12 | Oil | Olive (113), Sesame (72), Coconut (62), Vegetable (40), Avocado (18) |
| 316 | 11 | Onion | brown, red, spring, green, fried, chives |
| 297 | 8 | Salt | fine, sea, rock, kosher, flakey |
| 158 | 15 | Sugar | white (13), brown (20), coconut (33), caster, monkfruit sweetener |
| 141 | 13 | Yoghurt | Greek (72), plain (27), coconut (10), soya (4) |
| 127 | 17 | Flour | oat (34), plain (26), almond (22), coconut, chickpea, GF |
| 117 | 18 | Chocolate | dark, chips, chunks, dairy-free |
| 95 | 11 | Milk | dairy (39), almond (14), oat (6), soya (8) |
| 94 | 7 | Vinegar | rice, balsamic, apple cider, malt, white |
| 90 | 11 | Protein Powder | vanilla (28), chocolate (20), vegan, casein |
| 85 | 6 | Nut butter | peanut, cashew, hazelnut |
| 81 | 9 | Rice | jasmine, brown, sushi, sticky, microwave pouch |
| 50 | 13 | Cheese | cheddar, feta, cotija, cottage, cream, vegan |

Sesame oil runs roughly 4× olive oil per litre; almond milk is not dairy milk;
vanilla protein powder is not sugar. Collapsing these produces confidently wrong
per-portion costs — the exact failure mode the v2 category-aware matcher was built to
avoid, one layer up.

### Demonstration, using the book as it stands today

`csv_to_seed.py` run against the current 21 priced rows would emit these:

```
yoghurt   500g £0.99   141 uses / 13 variants  <- Soya Yoghurt's price applied to Greek Yoghurt (72 uses)
cheese    350g £1.95    50 uses / 13 variants  <- Vegan Cheese's price applied to Feta
lime        1each £0.48  91 uses /  6 variants  <- a whole lime's price applied to Lime Juice (57 uses)
mayonnaise  1each £2.49  34 uses /  5 variants  <- Light Mayonnaise applied to Mayonnaise
pasta     500g £1.99    22 uses /  9 variants  <- Spaghetti applied to Pasta
```

Not urgent — `csv_to_seed.py` has never been run (the app is still on
`ds_pb_seeded_v2`, the 41-row hand-entered Lidl seed from 2026-04-06) and won't be
until after a scrape fills most families. But **do not run it against a
partially-filled book.**

## 4. Secondary finding — `canonicalise()` splits singular/plural families

`Potato` and `Potatoes` are two separate entries. `canonicalise()` maps
`potatoes → potatoe` (the `([^aeiou])es\b → \1e` rule fires before the plural `s`
rule), which never equals `potato`. Same mechanism behind the `Carrot`/`Carrots` and
`Banana`/`Bananas` family splits in §2.

Not fixed here deliberately: `canonicalise()` is duplicated in five places
(`index.html`, `price_pricebook.py`, `csv_to_seed.py`, `usda_staples.py`, and the
frozen snapshot in `tools-apply-master.mjs`), and changing it re-keys the live
`ds_pricebook` in localStorage. It needs its own change with the sync done properly.

## 5. Unit hygiene

`_toBase()` (`index.html:3348`) has no `each` ↔ `g` bridge — only cups → g via
density. **An `each` price entry cannot price a gram-quantity ingredient line**; it
silently counts as unpriced. Still recorded as `1 each` and therefore dead for any
weight-based recipe line:

- `Sriracha` £1.99, `Light Mayonnaise` £2.49 — bottled condiments, used in tbsp. Need
  ml pack sizes.
- `Sweet Potato` £1.18, `Butternut Squash` £1.45, `Potato` £0.48 — kept verbatim
  during the merge because their prices differ from the 2026-04 seed, so they are a
  separate observation, not a lossy transcription. Need a confirmed pack size.

## 6. Recommended order of work

1. **Decide the price-unit question in §3** — this gates the scrape, because it
   determines whether `price_pricebook.py` queries 208 Product families or ~365
   variant rows. Scraping at the family level and then discovering it's wrong means
   burning the Apify quota twice, and quota exhaustion has already bitten once
   (hence `--resume`, PR #14).
2. **Fold the 49 produce/fruit fragment rows into their 10 base items** (§2a),
   recording a conversion factor for each (clove → bulb, wedge → fruit, stalk → head).
   Create base rows for Onion and Orange. This is where the genuine same-item
   duplication lives; do **not** extend it to the milk/cheese/yoghurt families, whose
   variants are separate products.
3. **Reassign the families split by the plural bug** — `Carrot`/`Carrots`,
   `Banana`/`Bananas`, `Tuna`/`Tinned Tuna` (§2) — small, improves alias coverage, no
   code change.
4. **Confirm pack sizes for the 5 unit-dead rows** (§5) — 5 minutes with a receipt.
5. **Then scrape**, then `csv_to_seed.py --apply`.

Deferred: the 100 artefact rows (§2) — harmless at `--min-occ 3`, worth a cleanup
pass only if the book is ever used below that threshold. The `canonicalise()` plural
bug (§4) — own change, five files to keep in sync.

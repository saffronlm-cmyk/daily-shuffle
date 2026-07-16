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

### Batch D (2026-07-16) — next 20 alphabetically ("Burger…" → "Chicken Shawarma…") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Burger Bowl | 1 | 440/50/30/10/–/– | — | ◐ only 2/16 ingredients have qty |
| Butternut Peanut Butter Protein Mug Cake | 1 | 248/22/22/8.5/4.5/8 | ~247/21/26/7/4/6 | ✅ great match |
| Butternut Protein Brownie (butternut/egg-white) | 5 | 412/52/38/6/–/– | **~110/15.5/12.5/1.5/3/1.5** | ⚠ stored wildly high (impossible protein) |
| Butternut Protein Brownie (pumpkin/egg-white) | 5 | 189/25/16/3/–/– | **~98/15/9.5/1.5/2.8/2.5** | ⚠ stored ~2× |
| Butternut Squash Mac and Cheese | 4 | 348/12/52/11/5.5/10 | **~542/21/79/17/7/10** | ⚠ stored low (squash size a swing) |
| Café Style Jacket Potatoes (Chicken/Bacon/Corn) | 4 | 601/66/61/12/–/– | — | ◐ ingredient list incomplete (no potato/corn listed) |
| California Rolls in a Bowl | 2 | 505/14/80/15/11/18 | — | ⛔ ingredient list empty (nulls) |
| Caramel Rice Cake Strawberry Treat | 1 | 348/14/37/12/3.8/16 | — | ◐ PB/choc/yoghurt no qty |
| Caramelised Onion Rice with Tikka Cod | 2 | 488/45/52/8/9/12 | **~578/48.5/83/4.5/15/15** | ⚠ carbs low (rice+chickpea+peas) |
| Carrot Cake Baked Oats (serves 4) | 4 | 407/18/54.5/14.5/7/18 | (Batch A) | ✅ already corrected |
| Carrot Cake Baked Oats (serves 1) | 1 | 268/8.5/46/5/5.5/14 | — | ⛔ ingredient list empty (nulls) |
| Carrot Cake Loaf | 5 | 178/14.5/16/6.5/2.8/7 | **~100/7/12.5/2.5/2/3.5** | ⚠ stored ~2× (protein impossible) |
| Carrot Cake Meal Prep Baked Oats | 5 | 318/16/46/7/5/20 | ~386/22/53/10/6.5/13 | ⚠ protein/cal low |
| Carrot Cake Overnight Oats | 1 | 298/10/48/7/6/14 | ~328/12/49/9.5/7.5/11 | ✅ close (toppings unquantified) |
| Cauliflower Cheese Gnocchi Bake | 3 | 360/19/null/null/null/null | ~401/18/56/11/7/… | ✅ close; carbs/fat/fibre/sugar null |
| Char Siu Chicken | 2 | 689/42/79/22/–/– | ~686/42.5/78/21/…/… | ✅ great match; fibre/sugar null |
| Chicken & Egg Breakfast Casserole | 8 | 228/20/12/11/2/4 | ~315/21.5/15/18.5/2.5/4.5 | ⚠ fat/cal low (avo oil+eggs+cheese) |
| Chicken and Potato Traybake | 4 | 448/38/26/22/4/3 | ~589/34/25/37/…/… | ⚠ fat low (skin-on legs+thighs+marg) |
| Chicken Pad Thai | 4 | 555/50/47/18/3.5/10 | ~549/54/44.5/15/…/… | ✅ great match |
| Chicken Shawarma Crispy Rice Salad | 4 | 488/30/34/26/3.5/6 | **~657/32.5/43/40/…/…** | ⚠ fat/cal low (tahini + multiple ¼-cup oils) |

- Fully auditable: 14/20 (6 ✅ OK, 8 ⚠ OFF). Partial: 3. Deferred (empty): 2. Already-done: 1.
- Standouts: protein-powder bakes (both Butternut Brownies, Carrot Cake Loaf) carry
  **impossibly high** stored protein/calories — likely per-recipe totals miscounted as
  per-serving. Oil/tahini-heavy dishes (Shawarma Salad, Breakfast Casserole, Traybake)
  are consistently **under**-counted on fat.
- Recurring: `null` carbs/fat/fibre/sugar on several (Cauliflower Gnocchi, Char Siu,
  Burger Bowl, Café Jacket Potatoes, both Butternut Brownies).

**Running totals through Batch D:** ~50 of 310 ready recipes covered (10 written + ~39 audited).

### Batch E (2026-07-16) — next 20 alphabetically ("Chicken Shawarma Sheet Pan…" → "Chocolate Date PB Squares…") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Chicken Shawarma Sheet Pan Dinner | 4 | 398/36/10/22/2/4 | ~372/44/12/14/…/… | ✅ close (tray "Olive oil" qty unstated → fat uncertain) |
| Chicken Spring Roll Bowl | 2 | 623/47/69/18/4.5/6 | ~613/47/64/18/…/… | ✅ great match |
| Chicken Tikka Masala | 4 | 448/32/10/30/2/6 | **~646/36/17/47/…/…** | ⚠ fat/cal low (oil+80g butter+cream) |
| Chile Lime Chipotle Chicken | 4 | 338/38/4/18/0.5/1.5 | ~392/57/2.5/15/…/… | ⚠ protein low (1134g thigh ÷4) |
| Chili Crunch Ground Chicken Bowls | 4 | 398/28/44/10/2/10 | **~498/24/56/20/…/…** | ⚠ fat/carbs low |
| Chili Honey Chicken Bowl | 2 | 488/38/42/18/5/28 | ~601/46/43/27/5.5/33 (no rice) | ◐ rice qty missing; fat/protein look low |
| Chilli Lime Shrimp and Veggie Bowl | 2 | 228/36/5/8/1/1 | — | ◐ ingredient list has no veggies (title mismatch); marinade oil uncertain |
| Chilli Oil | 50 | 88/0.2/0.5/10/0.2/0.1 | ~85/0.1/0.4/9.4/…/… | ✅ great match |
| Chipotle Chicken & Rice Skillet | 4 | 498/38/32/28/2/3 | ~374/22/4/28/…/… (no rice) | ◐ rice qty missing (in title); protein gap |
| Chipotle Chicken Chop Bowl | 1 | 352/36/42/3/–/– | ~350/32/42/3/…/… | ✅ great match; fibre/sugar null |
| Choc, PB and Raspberry Overnight Oats | 1 | 388/18/44/14/10/12 | **~496/26/54/20/17/11** | ⚠ low (chia+PB+protein) |
| Chocolate Baked Oats | 1 | 388/28/42/8/6/8 | ~414/33/51/9/6.4/14 | ✅ close (protein scoop swing) |
| Chocolate Banana Rice Paper Pie | 5 | 172/2.8/33.2/3.9/–/– | ~166/3.8/30.6/3.7/…/… | ✅ great match; fibre/sugar null |
| Chocolate Blueberry Baked Oatmeal | 1 | 248/8/42/5/6/10 | ~288/10/45/8/7.6/10 | ✅ close (toppings unquantified) |
| Chocolate Chia Mousse | 3 | 263/12/null/null/null/null | ~211/12/17/11.6/5.5/6 | ✅ protein matches; null macros to fill; cal swings on yoghurt type |
| Chocolate Chia Overnight Oats | 1 | 502/38/42/18/5.5/15 | **~689/46/71/26/11/25** | ⚠ low (choc shell+oats+protein) |
| Chocolate Chip Protein Pancakes | 3 | 398/28/36/12/3/6 | ~368/24/38/12.7/2.3/5 | ✅ close |
| Chocolate Covered Pumpkin Bites | 12 | 148/5.5/12/9.5/1.5/7 | ~127/3.8/13/6.85/1.4/9.7 | ✅ close (choc-chip cup a swing) |
| Chocolate Date Cake | 9 | 253/5.5/51/5/4.5/32 | (Batch A) | ✅ already corrected |
| Chocolate Date Peanut Butter Squares | 12 | 128/2.5/18/6.5/1.5/13 | ~165/2.6/28.5/6.25/2.9/23 | ⚠ carbs/sugar low (15-date weight swing) |

- Fully auditable: 16/20 (10 ✅ OK/close, 6 ⚠ OFF). Partial: 3. Already-done: 1.
- Patterns holding: **chicken curries/skillets under-counted on fat** (Tikka Masala worst —
  oil+butter+cream); **overnight-oats/chia recipes under-counted** (chia+PB+protein weight);
  "rice/cauli rice of choice" (no qty) keeps appearing on bowls/skillets, including two where
  it's literally in the title ("& Rice Skillet"). Data-quality one-offs: Chilli Lime Shrimp
  "Veggie" Bowl lists no vegetables.

**Running totals through Batch E:** ~70 of 310 ready recipes covered (10 written + ~58 audited).

### Batch F (2026-07-16) — next 20 alphabetically ("Chocolate Hazelnut…" → "Cottage Cheese Pancakes") (read-only)

Dessert/baked-goods-heavy stretch. Nut-butter / oil / maple / date / protein-powder weights
are calorie-dense and were consistently under-counted → unusually high OFF rate this batch.

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Chocolate Hazelnut Cookie Dough Balls | 15 | 128/3.5/8/9.5/1.5/5 | ~177/5/14/12/…/… | ⚠ low (cashew butter+maple; choc chips unquantified) |
| Chocolate Peanut Butter Protein Cookie Dough | 4 | 228/14/14/14/3/5 | ~257/21/10/15.5/…/… | ⚠ protein low |
| Chocolate Protein Chia Seed Pudding | 6 | 96/9.5/7.8/3.3/3.2/9.5 | ~116/11/9.7/4.4/4/2.75 | ✅ close (toppings excluded) |
| Chocolate Protein Yogurt Bowl | 1 | 468/42/32/18/5/10 | ~521/49/34.5/22/5/17 | ✅ close |
| Chocolate Raspberry Baked Protein Oats | 6 | 168/15/17/5.5/6.2/7 | ~210/12.7/26/6.5/4.7/12.5 | ⚠ carbs/sugar low (dates) |
| Chocolate Rice Cake Strawberry Treat | 1 | 352/14/38/12/3.8/17 | ~316/12.5/33.5/16/4/13 | ✅ close (fully gram-spec'd) |
| Chocolate Strawberry Baked Oats | 1 | 405/29/48/9/6.5/10 | ~487/38/59/13.5/9/14 | ⚠ low |
| Chocolate Sweet Potato Mug Cake | 1 | 298/9.5/38/12/3.5/22 | ~270/11/28/13.4/3/13 | ✅ close |
| Chocolate Tahini Brownies (≠ Vegan Tahini) | 9 | 178/5.5/12/13/2.5/8.5 | **~273/7/24.5/18.8/4.4/14.8** | ⚠ low (1 cup tahini + ½ cup maple) |
| Chocolate Zucchini Bread | 8 | 268/7/16/21/3.5/10 | **~395/10/34/26.6/5/24** | ⚠ low (almond flour+choc+coconut sugar) |
| Chopped Jalapeño Cheddar Chicken Salad | 3 | 185/24/8/6/1.5/6 | ~253/32/11/8.7/1.7/5.7 | ⚠ protein low |
| Cinnamon Buckwheat Smoothie | 1 | 398/14/58/11/6.5/22 | ~498/26/68/16.5/9/23 | ⚠ protein/cal low |
| Cinnamon Roll Baked Oats | 5 | 688/14/82/36/7/42 | ~515/15/60/25/6/25 | ⚠ stored HIGH (rare over-estimate) |
| Cinnamon Roll Date Cake | 9 | 248/3.5/42/8/1.5/28 | **~417/3/80.5/10/2.5/60.7** | ⚠ carbs/sugar big undercount (dates+3 sugars+glaze) |
| Coconut Prawn Curry | 4 | 228/28/8/10/1.5/4 | **~453/53/13/21/2/5.5** | ⚠ big undercount (1kg prawns + coconut milk) |
| Coffee Protein Ice Cream Affogato | 1 | 175/20/null/null/null/null | ~321/50/13/7.4/…/… | ⚠ protein low (1 cup yog + 1.25 scoops) + nulls |
| Cookie Dough Caramel Bars | 12 | 188/3.5/20/11/2.5/12 | ~224/3.5/26.6/13/2.5/16.8 | ⚠ carbs/cal a bit high (choc chips unquantified) |
| Copycat Nando's Peri Peri Chicken Burgers | 4 | 518/40/38/22/2/6 | ~772/43/38/47.5/…/… | ⚠ fat high (½ cup mayo+oils; some marinade discarded) |
| Cosmic Brownie Overnight Oats | 1 | 488/28/48/20/9/16 | ~695/35/72/34/…/… | ⚠ low (chia+PB+choc; opt protein extra) |
| Cottage Cheese Pancakes | 3 | 218/16/18/8/1.5/8 | ~328/24/28/12.8/1.7/9.3 | ⚠ low (eggs+cottage cheese+oats) |

- Fully auditable: 20/20. ✅ close: 4. ⚠ off: 16 (mostly under-counts; Cinnamon Roll Baked
  Oats is the one over-estimate).
- Takeaway: the **dessert/baked-goods segment is systematically under-estimated** — the AI
  passes seem to have missed or under-weighted nut butters, oils, maple/dates. When you decide
  what to fix, this alphabetic band (and the oats/smoothie/mug-cake families generally) is the
  highest-yield place to start.

**Running totals through Batch F:** ~90 of 310 ready recipes covered (10 written + ~78 audited).

### Batch G (2026-07-16) — next 20 alphabetically ("Creamy Cucumber…" → "Double Choc Fudge Cookie") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Creamy Cucumber Avocado Broccoli Salad | 4 | 375/9/25/29/8.5/5 | ~344/7/19/28/7.5/3 | ✅ close |
| Creamy Mango and Coconut Cod Curry | 2 | 380/34/null/null/null/null | ~397/34/…/…/…/… (light coconut) | ✅ protein matches; cal swings on coconut type; null macros |
| Creamy Peanut Miso Ramen | 4 | 528/18/44/34/5.5/8 | ~998/23/100/52.5/…/… | ⚠ likely low (400g dry noodles + PB+tahini+coconut; noodle/coconut assumptions swing) |
| Creamy Thai Coconut Chicken Meatballs | 4 | 271/28/null/null/null/null | ~338/29.5/…/… (no rice) | ◐ rice to serve unquantified; protein matches; null macros |
| Crispy Bang Bang Chicken | 1 | 427/42/44/9/–/– | ~539/41/56/15/…/… | ⚠ cal/carbs/fat low (cornflour+egg+sauces; frying oil extra) |
| Crispy Chicken Dumplings | 2 | 459/29/50/15/1.5/2 | ~482/27/55/15/…/… | ✅ close |
| Crispy Chicken Rice Paper Dumplings | 2 | 358/26/24/18/2/8 | ~450/25/37/19.7/…/… | ⚠ carbs/cal low |
| Crispy Chilli Beef Protein Bowls | 4 | 484/31/35/20/null/null | ~421/27/25/21.5 (no rice) | ◐ rice unquantified; close once rice added |
| Crispy Gluten Free Shrimp Dumplings | 7 | 128/9/14/3/0.8/2 | — | ◐ wrapper flour has no qty |
| Crispy Quinoa Edamame Salad | 2 | 413/17/46/20/14/9 | ~377/13/33/21/10/4.5 | ✅ close |
| Crispy Rice and Chicken Salad | 2 | 635/51/44/29/–/– | ~627/36/52/28.5/…/… | ⚠ cal matches but stored protein over-stated (300g chicken+2 eggs ≈ 31/serving) |
| Crispy Rice Paper Spring Rolls Without Frying | 4 | 198/7/32/3.5/2.5/3 | ~412/10/81/3/…/… | ⚠ carbs undercount (24 rice-paper sheets) |
| Crispy Rice Salad with Miso Tofu | 2 | 488/35/42/22/6.5/8 | ~916/38/78/50.5/…/… | ⚠ fat/carbs low (sesame oil+avo+50g sesame seeds) |
| Crispy Rice Tuna Salad | 2 | 418/26/44/16/3/4 | ~494/19/57.5/19/…/… | ⚠ carbs/cal high; mayo/yogurt qty missing |
| Crispy Rosemary Chicken w/ Apple Beetroot Slaw | 2 | 412/38/null/null/null/null | ~742/62/82/15.6/…/… | ⚠ high (100g panko+flour+feta; breading adherence uncertain) + nulls |
| Crispy Tempeh Rice and Cucumber Salad | 2 | 488/20/48/24/4/8 | ~852/30.5/67.5/52.5/…/… | ⚠ low (sesame oil+peanuts+plant mayo) |
| Dak Gomtang (Korean Chicken Soup) | 3 | 410/32/44/9/1/5 | ~406/23/35/17/…/… | ✅ cal matches; protein/fat swing on skin-on leg yield |
| Date Me Greek Yogurt Bowl | 1 | 248/18/38/3/2.5/30 | ~271/21/43/2.4/3.2/32 | ✅ close |
| Date Tahini Bites w/ Sunflower Sesame Crust | 12 | 128/2.5/18/6/1.8/14 | **~278/6.5/30/16.8/4.2/20.8** | ⚠ big undercount (2 cups seeds + tahini) |
| Double Choc Fudge Cookie | 1 | 356/41.8/null/null/null/null | ~365/41/40/7.4/…/… | ✅ cal/protein match; null macros to fill |
| Fully auditable: 17/20 (7 ✅, 10 ⚠). Partial: 3 (rice/wrapper qty). ||||

- Recurring: seed/nut/oil-dense salads under-counted (Miso Tofu, Tempeh, Date Tahini Bites);
  "rice to serve" unquantified again (Thai Meatballs, Chilli Beef). One likely **over**-stated
  protein (Crispy Rice & Chicken Salad — cal matches but protein ~+60%).
- `null` macros to fill: Mango Cod Curry, Thai Meatballs, Chilli Beef, Rice&Chicken Salad,
  Rosemary Chicken, Dak Gomtang(part), Double Choc Cookie.

**Running totals through Batch G:** ~110 of 310 ready recipes covered (10 written + ~98 audited).

### Batch H (2026-07-16) — next 30 alphabetically ("Double Roast Chicken…" → "Harissa Chicken…") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Double Roast Chicken with Chicken Fat Rice | 8 | null×6 | ~600–650/…/… (rough) | ◐ stored all null; "2 whole chickens" size approx |
| Easy Chicken Traybake | 4 | 448/38/22/22/4/3 | ~589/34/25/37/…/… | ⚠ fat undercount (dup of "Chicken and Potato Traybake") |
| Easy Chipotle Chicken & Corn Salsa | 6 | 338/38/8/17/1/3 | ~425/48/18/15.5/…/… | ⚠ protein/cal low (1.36kg thigh) |
| Easy Curry Noodles with Crispy Beef | 3 | 528/22/42/31/3.5/5 | ~614/15/52/34.7/…/… | ✅ borderline (noodle/coconut swing) |
| Easy Poke Salad Bowl | 1 | 558/37/67/16/6/5 | ~617/38.7/63/20/…/… | ✅ close |
| Easy Tuna Salad Mix | 3 | 148/26/6/4/1.5/3 | ~224/32/13/5/…/… | ⚠ protein/cal low (425g can ÷3; mayo unquantified) |
| Egg White Protein Oats | 1 | 285/30.5/28/5.5/3.8/14 | ~305/22.6/39/6.6/7/13.3 | ✅ close (stored protein looks high vs ingredients) |
| Fiery Chilli Prawn Linguine | 3 | 337/24/42/9/3/8 | ~578/35.6/91/4.4/…/… | ⚠ carbs undercount (300g dry pasta) |
| Fluffy Breakfast Carrot Cake Loaf | 10 | 250/5/null/null/null/null | ~330/6.3/33/20/…/… | ⚠ fat/cal low (150ml olive oil) + nulls |
| Fluffy Greek Yogurt Pancakes | 3 | 495/39/56/10/–/– | ~193/13.6/26/3.5/…/… | ⚠ stored WAY over-stated (protein impossible) |
| Fluffy Vegan Protein Pancakes | 2 | 288/18/38/5/2.5/5 | ~339/14.3/56.5/4.2/…/… | ⚠ carbs/cal high (100g flour) |
| Frozen Berry Breakfast Crumble | 6 | 265/8/null/null/null/null | ~279/9.2/42/9.3/5.8/15 | ✅ close + nulls to fill |
| Frozen Strawberry Raspberry PB Bites | 8 | 88/1.5/8/5.5/1.5/5 | — | ◐ "peanut butter" & "1 bag choc" unquantified |
| Garlic Cucumber Salad | 2 | 38/1.5/6/1.5/1/3 | ~64/1.3/7.4/3.15/1/2.5 | ⚠ minor (chili-crisp oil; tiny absolute) |
| Garlic Miso Somen Noodles | 2 | 378/18/52/12/4/6 | ~608/21.5/86.5/16.8/…/… | ⚠ carbs undercount (200g dry somen) |
| GF Easy Pan Dumplings (No Wrappers) | 4 | null×6 | — | ◐ coating flour no qty; stored null |
| GF Easy Pan Dumplings (Pan-Fried) | 4 | null×6 | — | ◐ shaping starch no qty; stored null |
| Giant Rice Cake Snickers Wagon Wheel | 1 | 488/14/44/30/4/22 | ~630/16/61/40.6/…/… | ⚠ undercount (PB+peanuts+choc) |
| Glass & Konjac Chicken Japchae | 4 | 470/37/66/7/14/12.5 | ~473/38.8/65.8/6.8/14/13 | ✅ great match |
| Glowing Skin Soup | 4 | 148/2.5/22/6.5/4/12 | ~242/2.75/14.8/17/…/… | ⚠ fat undercount (olive oil+coconut cream) |
| Gluten Free Cinnamon Buns | 6 | 488/8/78/16/3/36 | ~1188/…/193/… | ⚠ big undercount OR serves >6 (800g flour) |
| Gochujang Prawn Noodle Soup | 2 | 338/20/48/8/3.5/5 | ~418/25.5/51.5/9.5/…/… | ✅ borderline (udon nest weight swing) |
| Golden Coconut Chicken Curry | 4 | 488/34/22/32/6/6 | ~624/30/12.5/48.7 (no rice) | ⚠ fat undercount (coconut cream+oil); rice missing |
| Greek Chicken Gyros Protein Filling | 2 | 200/25/12/5/2/6 | ~202/28/13.6/3.5/…/… | ✅ great match |
| Greek Yogurt Raspberry Blueberry Bake | 1 | 278/18/34/6/2.5/26 | ~322/25/42.7/5.8/…/… | ✅ close (berries unquantified) |
| Green Goddess Chicken Prep Mix | 2 | 280/24/null/null/null/null | ~287/35.5/14/9.5/…/… | ◐ cal matches; protein low; null macros |
| Green Goddess Pasta Salad | 3 | 398/22/44/14/6/4 | ~795/43.7/82/32.7/…/… | ⚠ big undercount (1 box pasta + feta + oil) |
| Green Goddess Salad | 3 | 388/11/37.5/24.5/11.5/18 | (Batch A) | ✅ already corrected |
| Halloween Chocolate Almond Butter Balls | 12 | 118/3.5/8/8.5/1.5/5 | ~175/7.1/11.7/12.7/…/… | ⚠ undercount (almond butter+almonds) |
| Harissa Chicken with Roasted Veg and Feta | 1 | 555/53/null/null/null/null | ~755/65/61/23/…/… | ◐ feta qty; protein ~matches; null macros |

- Fully auditable: 23/30 (8 ✅, 15 ⚠). Partial: 6. Already-done: 1.
- Notables: **Fluffy Greek Yogurt Pancakes** is over-stated (stored 495 vs ~193 — protein
  impossible). **GF Cinnamon Buns** likely serves more than 6 (800g flour). Six recipes have
  `null` calories/macros needing values regardless (Double Roast Chicken, both GF Pan
  Dumplings, Carrot Loaf, Green Goddess Prep, Harissa Chicken). Coconut-milk "light or full"
  and dry-noodle weights remain the biggest single swing factors.

**Running totals through Batch H:** ~140 of 310 ready recipes covered (10 written + ~128 audited).

### Batch I (2026-07-16) — next 30 alphabetically ("Healthy Grass Fed…" → "Matcha Date Butter Balls") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Healthy Grass Fed Gelatin Chocolate Mousse | 4 | 118/12/10/3.5/1.5/7 | ~75/8.3/9.7/1.4/…/7 | ✅ borderline (yoghurt-fat swing) |
| Healthy Lemon Bars | 9 | 178/4.5/12/14/1.5/8 | ~260/7.4/18.9/17.9/3.3/11.4 | ⚠ low (almond flour+coconut oil+maple) |
| Healthy Orange & Cashew Chicken | 2 | 600/50/null/null/null/null | ~595/45/46/19.5/…/… | ✅ cal/protein match + nulls |
| High Fibre Sticky Toffee Oats | 1 | 420/23/null/null/null/null | ~948/24/141/37/…/… | ⚠ low (base alone >stored; toppings est.) |
| High Protein Asian Crispy Rice Salad | 4 | 382/12/60/12/4/3 | ~336/8.2/54.6/9.3/…/… | ✅ close |
| High Protein Brownie Bowl | 2 | 130/11/21/1/–/– | ~139/7.8/24.3/1.8/…/… | ✅ close |
| High Protein Carrot Cake Overnight Oats | 1 | 448/36/44/11/7.5/14 | ~607/51/59/19/13/… | ⚠ low (chia+protein+milk) |
| High Protein Chicken Enchilada Bake | 4 | 328/42/18/12/4/6 | ~350/34/11.6/16.8/…/… | ✅ close (cheese swing) |
| High Protein Chickpea Flour Pancakes | 2 | 318/28/32/5/4.5/8 | ~432/42/41/8.75/…/… | ⚠ low (2-3 scoops protein + chickpea flour) |
| High Protein Chocolate Lava Pudding | 1 | 464/53.4/null/null/null/null | ~494/54/38/19.5/…/… | ✅ cal/protein match + nulls |
| High Protein Chocolate Loaf | 10 | 118/9/12/3.5/2/3 | ~138/10.1/17.4/4.1/…/… | ✅ close (choc chips unquantified) |
| High Protein Pumpkin Spice Muffins | 12 | 88/5.5/12/2/1.5/4 | ~114/7.1/16.7/2.3/…/… | ⚠ mild low (2 cups oats) |
| High Protein Salmon Potato Salad | 2 | null×6 | ~869/42/70/36/…/… | ◐ stored all null; would fill ~869/42/70/36 |
| High Protein Salmon Potato Salad (DUP) | 2 | null×6 | (identical) | ◐ exact duplicate row of the above |
| High Protein Tiramisu Overnight Oats | 1 | 438/45/46/7/–/– | ~474/45/53/11/…/… | ✅ close + nulls |
| High Protein Tuna Salad | 6 | 157/20/8/5/–/– | ~180/23.5/9.7/4.8/…/… | ✅ close + nulls |
| Homemade Carrot Cake | 10 | 97/8.4/9/3/–/– | ~117/9.2/9.9/3.6/…/… | ✅ close + nulls |
| Honey Glazed Salmon Bowls with Peach Salsa | 4 | 298/24/16/16/3/10 | ~439/28.7/23/24/…/… | ⚠ fat/cal low (salmon+avocado+oil) |
| Honey Mustard Chicken Power Bowl | 4 | 488/34/44/18/9/10 | ~684/35.8/58/33.5/…/… | ⚠ fat/carbs low (¼-cup oil dressing+2 avo+quinoa) |
| Honey Sesame Salmon Bowl | 2 | 488/36/44/18/2/8 | ~371/24.5/10/22.5 (no rice) | ◐ rice + mayo qty missing |
| Instant Noodle Jars | 1 | 348/16/48/8/5/4 | ~458 (tofu unquantified) | ◐ tofu has no qty |
| Lemon and Blueberry Baked Oats | 4 | 248/16/36/4/4.5/12 | ~383/25.5/51.7/8.1/…/… | ⚠ low (200g oats+80g protein) |
| Lemon and Coconut Cake | 10 | 153/12.8/13.9/6.1/–/– | ~155/13.3/11.5/6/…/… | ✅ great match + nulls |
| Loaf Pan Lemon & Yoghurt Chicken | 5 | 298/32/5/16/0.8/2.5 | ~293/44/4/9/…/… | ⚠ cal matches but protein low (1.1kg thigh); fat swings on skin |
| Mango Yogurt Bites | 7 | 70/2/8.5/3.5/0.5/8 | (Batch A) | ✅ already corrected |
| Maple Cinnamon Pumpkin Overnight Oats | 1 | 368/16/44/14/6.5/16 | ~599/27/63/27.5/10/16 | ⚠ low (pecans+chia+collagen) |
| Maple Sriracha Tofu Protein Bowl | 3 | 428/18/46/18/8/10 | ~698/40/69/32/…/… | ⚠ big undercount (450g tofu+avo+oils; protein 18→~40) |
| Marinated Chicken Thighs w/ Mint Jalapeño Sauce | 2 | 448/38/6/30/1/2 | ~623/30/7.5/52/…/… | ⚠ fat high (3 tbsp marinade oil partly discarded) |
| Marinated Fish Tacos | null | 410/null/null/null/null | — | ◐ serves is null — can't divide; needs serving count |
| Matcha Date Butter Balls | 12 | 98/0.5/12/6/0.8/11 | ~136/0.5/18/7.8/…/15.8 | ⚠ carbs/cal high (12 dates) |

- Fully auditable: 24/30 (11 ✅, 13 ⚠). Partial: 5. Already-done: 1.
- **Data-integrity finds:** (a) "High Protein Salmon Potato Salad" exists **twice, identical**,
  both with null macros — a de-dupe candidate; (b) "Marinated Fish Tacos" has **`serves = null`**
  (like Vegan Protein Waffles did) so it can't be divided until a count is set.
- Same themes: tofu/salmon/oil/nut-butter mains under-counted; the well-specified protein-bake
  family (Choc Loaf, Lemon & Coconut Cake, Homemade Carrot Cake, Tuna Salad) matches closely.

**Running totals through Batch I:** ~170 of 310 ready recipes covered (10 written + ~158 audited).

### Batch J (2026-07-16) — next 30 alphabetically ("Mayak Korean…" → "Peanutty Chicken Salad") (read-only)

Noodle / Pad-Thai / peanut-sauce heavy stretch → dry-noodle weights + peanut butter + oils
drive a very high under-count rate.

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Mayak Korean Marinated Eggs | 4 | 108/10/5/6/0.5/3 | ~85–138 (marinade absorption) | ✅ borderline (most marinade discarded) |
| Meal Prep Spicy Tuna Quesadilla | 2 | 345/28/null/null/null/null | ~343/27.5/39/7.7/…/… | ✅ cal/protein match + nulls |
| Mediterranean Chicken & Rice Skillet | 4 | 480/40/null/null/null/null | ~345/21.7/5/24 (no rice) | ◐ rice unquantified; protein looks high in stored |
| Microwave Chocolate Protein Oats | 1 | 248/21.5/22/8.5/5.5/6 | ~380/34.5/37/13/…/… | ⚠ low (20g cocoa+protein+choc) |
| Middle Eastern Chicken & Rice Bowl | 4 | 428/38/8/26/1.5/3 | ~422/47/5/22 (no rice) | ⚠ protein low (907g thigh); rice not in stored either |
| Miến Gà - Vietnamese Glass Noodle Chicken Soup | 4 | 445/34/38/16/2.2/4 | ~ (fat renders out) | ✅ borderline (skin fat skimmed + garlic-oil drizzle discarded) |
| Miso Peanut Ramen Bowl | 4 | 498/18/44/30/4/8 | ~628/24/51/36.6/…/… | ⚠ low (coconut+tofu+PB+noodles) |
| Miso Soy Chicken with Coconut Lime Rice | 4 | 578/38/52/22/1.5/8 | ~776/38/62.5/35.3/…/… | ⚠ fat/cal low (coconut milk rice + oil) |
| Muffin Top Pumpkin Protein Cookies | 10 | 148/7/12/8.5/2/6.5 | ~148/6.1/13.1/8.6/…/… | ✅ great match |
| Nandos Chicken Pasta Salad | 1 | 418/49/42/7/–/– | ~493/49/46/12/…/… | ✅ close (protein exact; fat higher) |
| No Bake Coconut Cookies | 20 | 168/3/22/8.5/2/14 | ~242/4.6/27.6/13.8/…/… | ⚠ low (coconut oil+PB+choc) |
| Oat Flour Pancakes | 12 | 97/8.2/10.5/2.8/1.2/5.5 | ~53/2.65/7.6/1.3/…/… | ⚠ stored over-stated (protein impossible; serves likely ~6) |
| One Pan Vegan Sushi Bake | 3 | 464/16/65/16/7/3 | ~633/23.3/64.3/25.7/…/… | ⚠ fat/cal low (mayo+avo+tofu+edamame) |
| Pad Kra Pao - Thai Basil Chicken | 2 | 597/44/63/19/1.8/4.5 | ~581/41/48.5/21/…/… | ✅ close |
| Pad See Ew - Thai Stir Fried Noodles | 2 | 488/28/58/16/3/5 | ~713/27/93/26.5/…/… | ⚠ carbs/fat low (200g dry noodles+3 tbsp oil) |
| Pad See Ew with Beef | 2 | 388/44/42/14/3.5/5 | ~864/41.5/92/33/…/… | ⚠ big undercount (200g dry noodles) |
| Pad Thai Inspired Saucy Chicken Noodles | 5 | 525/28/62/18/3.5/14 | ~729/33/83/24.8/…/… | ⚠ carbs/fat low (397g noodles+coconut sugar) |
| Pad Thai with Chicken and Prawns | 4 | 528/30/62/18/4/14 | ~650/40/75/23.75/…/… | ⚠ low |
| Pad Thai with Prawns | 2 | 418/28/48/14/5/10 | ~511/27.5/65/11.5/…/… | ⚠ carbs low (120g noodles) |
| Peach and Nectarine Overnight Oats | 1 | 318/10/54/6/7.5/16 | ~400/12/58/11/…/… | ⚠ base alone > stored (fat) |
| Peaches and Cream Chia Pudding | 2 | 195/5.5/32/6/7/20 | ~244/8.75/29.5/11.5/…/… | ⚠ fat low (4 tbsp chia) |
| Peanut Butter and Jam Breakfast Oat Bars | 4 | 248/6.5/42/5.5/7/16 | ~374/11.1/62/9.75/…/… | ⚠ low (200g oats+PB+banana) |
| Peanut Butter Banana French Toast | 1 | 488/18/58/18/5/24 | ~611/22/66/23/…/… | ◐ PB & banana amounts unstated |
| Peanut Butter Chicken Coconut Noodles | 2 | 485/44/52/18/3/4 | ~913/42/89/35/…/… | ⚠ big undercount (200g noodles+coconut cream+PB) |
| Peanut Butter Chicken Katsu Noodles | 3 | 495/56/60/11/4/8 | — | ◐ rice + chicken amounts unquantified |
| Peanut Butter Cup Overnight Oats | 1 | 448/28/38/18/4/8 | ~518/35/49/18.5/…/… | ✅ close (fat matches; PB-cup size varies) |
| Peanut Butter Protein Balls | 16 | 148/6.5/14/8/1.8/6 | ~171/6.6/18.4/8.6/…/… | ✅ close |
| Peanut Noodle Stir Fry | 3 | 398/18/44/18/7/8 | ~665/45/41/35.3/…/… | ⚠ big undercount (½ cup PB+450g tofu) |
| Peanut Tofu Salad Jars | 4 | 278/18/28/8/5.5/6 | ~351/28.8/22.5/13.75/…/… | ⚠ protein/fat low (454g tofu; quinoa unquantified) |
| Peanutty Chicken Salad | 1 | 544/62/22/23/6.5/6 | ~534/61/22/21/…/… | ✅ great match |
| Fully auditable: 27/30 (9 ✅, 18 ⚠). Partial: 3. ||||

- Very high under-count rate driven by **dry-noodle weights** (200–400g dry noodles per recipe)
  + **peanut butter / coconut** in the Pad Thai / peanut-noodle family. Third over-statement
  found: **Oat Flour Pancakes** (serves 12 — protein/cal impossible; likely serves ~6).
- Clean matches on the gram-specified ones (Muffin Top Cookies, Peanutty Chicken Salad,
  Pad Kra Pao, Meal Prep Tuna Quesadilla).

**Running totals through Batch J:** ~200 of 310 ready recipes covered (10 written + ~188 audited).

### Batch K (2026-07-16) — next 30 alphabetically ("Pho Gà…" → "Raspberry Chocolate Chip Baked Oatmeal") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Pho Gà - Vietnamese Chicken Pho | 4 | 501/20/87/8/3.5/5 | (soup, fat rendered) | ⚠ protein low (1.5kg thigh); carbs/noodles match |
| Phò Inspired Chicken Broth and Rice | 2 | 352/30/46/5/3/12 | ~468/25/63.5/4/…/… | ⚠ carbs/cal high (rice+hoisin+honey) |
| Pickled Red Onions | 8 | 12/0.2/2.5/0/0.3/1.5 | ~5.5 + absorbed brine | ✅ plausible (brine discarded) |
| Pistachio Tiramisu Oats | 1 | 318/25/28/11/2.5/14 | ~283/22/28/8.6/…/… | ✅ close |
| Prawn Fried Rice | 2 | 428/30/56/10/2/1 | ~551/32.5/55/19/…/… | ⚠ fat low (4 eggs + oil) |
| Protein Berry Parfait | 1 | 265/30/null/null/null/null | ~230/35/18/2.1/…/… | ✅ cal/protein close + nulls |
| Protein Brownie (Pumpkin) | 3 | 198/23.5/18/5.5/4.2/6 | ~236/25/28/5.3/…/… | ✅ close |
| Protein Brownie (Sweet Potato) | 3 | 173/13.9/16.8/5.1/3.5/7.5 | ~156/11/23.3/3.7/…/… | ✅ close |
| Protein Brownie Bake | 2 | 318/22/24/14/4.5/9 | ~237/16/27/9/…/… | ⚠ stored higher than recompute |
| Protein Oatmeal Breakfast Cookies | 8 | 158/8.5/16/6.5/2/8 | ~162/9.5/18.3/6.25/…/… | ✅ close |
| Protein Packed Roasted Squash Pasta | 4 | 348/14/52/9/6/6 | ~597/18.2/89/17/…/… | ⚠ low (300g pasta+squash+2×oil) |
| Protein Pancakes | 15 | 312/24/28/11/5/8 | ~52/3/6.9/1.5/…/… | ⚠ stored MASSIVELY over-stated (serves likely ~2-3) |
| Protein Pancakes (Simple) | 2 | 331/37/25/10/–/– | ~334/27.9/35/8.5/…/… | ✅ cal match (protein/carbs swing on scoops) |
| Protein Power BLT | 1 | 500/43/null/null/null/null | ~503/52/45/9.2/…/… | ✅ cal match + nulls |
| Protein Pumpkin Chocolate Chip Muffins | 12 | 118/4.5/18/4/1.5/8 | ~143/3.8/23.3/4/…/… | ✅ close (brown-sugar-sub swing) |
| Pumpkin Bread | 10 | 238/3.5/34/10/1.5/20 | ~257/3.9/43.3/8.5/…/37 | ⚠ carbs/sugar low (maple+glaze) |
| Pumpkin Brookies | 12 | 348/5/28/26/3/18 | ~532/5.5/53.3/35.9/…/… | ⚠ low (2×⅔-cup olive oil batches) |
| Pumpkin Candy Apple Salad | 1 | 498/7.5/62/24/7/38 | ~913/16/104/52/…/… | ⚠ low (2 apples+almond butter+granola; portion-heavy) |
| Pumpkin Chocolate Chip Cookies | 2 | 168/5.5/18/10/3/10 | ~163/4.5/16.6/10.25/…/… | ✅ great match |
| Pumpkin Cream Cheese Muffins | 6 | 298/7/22/21/3.5/12 | ~496/10.8/41/32.7/…/… | ⚠ low (cream cheese+almond flour+oil) |
| Pumpkin Donuts | 8 | 88/1.5/16/1.5/1.8/6 | ~97/1.7/20.7/0.9/…/… | ✅ close |
| Pumpkin Pecan Pancakes | null | 148/4/18/7.5/2.5/3.5 | — | ◐ serves is null — can't divide |
| Pumpkin Protein Muffins | 9 | 162/12/18/5.5/3.8/6.5 | ~139/8.5/15.2/4.9/…/… | ✅ close |
| Pumpkin Protein Mug Cake | 1 | 318/28/18/12/2.5/6 | ~283/30/13/6.9/…/… | ✅ close |
| Pumpkin Season Baked Oats | 1 | 288/12/44/7/4.5/14 | ~348/14.5/49.5/9.8/…/… | ✅ close (toppings unquantified) |
| Pumpkin Spice Olive Oil Cake | 10 | 388/6/32/28/3/22 | ~673/11.7/48/50/…/… | ⚠ big undercount (3.5c almond flour+oils+maple) |
| Quick Chicken Laksa | 2 | 488/30/42/22/2.5/4 | ~1092/42/55/72/…/… | ⚠ big undercount (instant noodles+oil+coconut+chicken) |
| Quick Chinese Vegetable Noodle Soup | null | 108/null/null/null/null | — | ◐ serves null; ingredient list has no noodles despite title |
| Raspberry Cheesecake Protein Bowl | 1 | 225/21/null/null/null/null | ~303/32/18.5/12/…/… | ⚠ protein/cal high (cream cheese+yog+protein) + nulls |
| Raspberry Chocolate Chip Baked Oatmeal | 1 | 468/14/58/20/8/14 | ~750/24/92/34/…/… | ⚠ low (¾c oats+sunbutter+chia) |

- Fully auditable: 28/30 (14 ✅, 14 ⚠). Partial: 2 (both serves null).
- **4th over-statement:** Protein Pancakes (serves 15 — protein/cal ~6× too high; likely serves 2-3).
- **Data-integrity:** Pumpkin Pecan Pancakes & Quick Chinese Veg Noodle Soup both have
  `serves = null`; the latter also has **no noodles listed** despite being a "noodle soup".
- The well-specified protein-brownie/cookie family (both Protein Brownies, Oatmeal Cookies,
  Pumpkin Choc Chip Cookies, Donuts) matches closely; the olive-oil-heavy cakes/brookies and
  coconut-noodle laksa are the big under-counts.

**Running totals through Batch K:** ~230 of 310 ready recipes covered (10 written + ~218 audited).

### Batch L (2026-07-16) — next 30 alphabetically ("Raspberry Coconut…" → "Spicy Chilli Rice Paper Wontons") (read-only)

| Recipe | serves | Stored | Recompute (per serving) | Verdict |
|---|---|---|---|---|
| Raspberry Coconut Chocolate Bars | 10 | 128/1.5/14/8/2.5/10 | ~190/2.1/21/13.1/…/… | ⚠ low (choc chips+coconut) |
| Rice Cakes w/ Nut Butter, Strawberries & Choc | 1 | 239/4.6/20.2/15.9/1.5/6.5 | ~252/6.1/28.3/13.8/…/… | ✅ close |
| Rice Paper Kimchi Jeon with Tuna | 2 | 349/26/49/5/–/– | ~349/25/47.5/6/…/… | ✅ great match + nulls |
| Rice Paper Pad See Ew with Shrimp | 1 | 542/51/68/7/–/– | ~546/57/62/7/…/… | ✅ great match + nulls |
| Roast Chicken and Charred Corn Rice Salad | 2 | 488/38/62/18/6/8 | ~568/38/55/17/…/… | ✅ close |
| Roast Chicken Breast | 4 | 185/35/1/4.5/0/0.5 | ~203/36.75/0.5/5.3/…/… | ✅ great match (brine discarded) |
| Roast Chicken Crispy Rice Salad w/ Tahini Miso | 6 | 705/51/58/28/3/8 | ~664/46.3/46.3/27/…/… | ✅ close |
| Roast Chicken Rice Salad | 2 | 398/32/42/12/6/6 | ~568/38/55/17/…/… | ⚠ near-dup of Charred Corn Rice Salad; under-counted + inconsistent stored |
| Roasted Butternut Squash and Carrot Soup | 4 | 188/3/28/8/5/12 | ~307/3.75/31.3/19.25/…/… | ⚠ fat low (coconut milk+2-3 tbsp oil) |
| Roasted Cod on Sweet Potato | 2 | 347/49.1/null/null/null/null | ~571/41.6/64.7/14.75/…/… | ⚠ cal low (600g sweet potato) + nulls |
| Salmon Crispy Rice Paper Bites | 3 | 198/22/14/7/1.5/4 | ~275/17/22.7/10.7/…/… | ⚠ low (salmon+rice paper+honey) |
| Salmon Poke Bowl Meal Prep | 2 | 573/47/null/null/null/null | ~400/14/32.5/18.5/…/… | ⚠ stored protein over-stated (1 tin salmon ≈ 33g total) |
| Saucy Shredded Chicken Tacos | 6 | 278/30/10/12/0.5/5 | ~310/37.5/13.3/10/…/… | ✅ close (tortillas to-serve excluded) |
| Seared Miso Tuna Crispy Rice Bowl | 2 | 528/43/50/17/–/– | ~611/38/48/28.5/…/… | ⚠ fat high (multiple sesame oil + seeds) |
| Shrimp Avocado and Greens with Lemony Tahini | 4 | 234/20/8/14/4.5/2 | ~260/23.25/7.25/16/…/… | ✅ close |
| Simple Honey Date Cake | 9 | 228/3.5/38/7/1.5/25 | ~255/3/45.7/7.8/1.5/30.2 | ✅ close |
| Simple Salmon Bowl | 1 | 488/36/42/20/2/4 | ~561/28/40/28/…/… | ⚠ fat high (salmon+mayo) |
| Singapore Chicken Noodles | 4 | 388/24/38/16/2.5/4 | ~359/15.5/26/20.25/…/… | ✅ borderline (cal close; protein/carb swing) |
| Single Serve Baked French Toast | 1 | 388/18/48/12/3.5/18 | ~417/19/52/11.6/…/… | ✅ close |
| Single Serve Double Chocolate Butter Cake | 2 | 278/2.5/34/15/2/22 | ~357/2.8/42/21/…/… | ⚠ low (butter+oil+brown sugar) |
| Single Serve Sticky Date Pudding | 1 | 235/12/35/5/–/– | ~335/12/55/5/…/… | ⚠ carbs/cal high (date+flour+maple) |
| Single Serve Vegan Chocolate Mug Cake | 1 | 248/4.5/28/12/3/14 | ~272/4/28/10.5/…/… | ✅ close |
| Skillet Chicken Thighs with Mushroom Gravy | 4 | 318/32/8/18/1.5/2 | ~418/42.75/8.75/21.75/…/… | ⚠ protein low (780g thighs+4 tbsp oil) |
| Smashed Broccoli Salad w/ Greek Yogurt Dressing | 4 | 325/12/21/25/7.5/4 | ~371/9.25/19/29.25/…/… | ✅ close |
| Smoky Caramelised Red Pepper Orzo | 2 | 353/12/null/null/null/null | ~359 base (no optional prawns/feta) | ✅ base matches + nulls |
| Smoky Chicken Tacos with Roasted Corn Salsa | 4 | 348/33/16/18/4/4 | ~372/36.75/18/16.25/…/… | ✅ close |
| Snickers Overnight Oats | 1 | 412/12/52/18/7.5/14 | ~534/15.4/66/25/…/… | ⚠ low (30g choc+peanuts+PB) |
| Speedy Pad Thai Noodle Salad | 1 | 420/32/null/null/null/null | ~560/38/69/11/…/… | ⚠ cal/carbs low + nulls |
| Spicy Asian Noodles with Spinach & Chilli Crisp | 2 | 348/10/46/16/4/4 | ~522/9/65/23/…/… | ⚠ low (tahini+chilli crisp+sesame oil) |
| Spicy Chilli Rice Paper Wontons with Shrimp | 1 | 516/34/68/11/–/– | ~478/37/58/8/…/… | ✅ close + nulls |

- Fully auditable: 30/30 (16 ✅, 14 ⚠). No blockers this batch.
- **Duplicate:** "Roast Chicken Rice Salad" ≈ "Roast Chicken and Charred Corn Rice Salad"
  (same ingredients) but stored 398 vs 488 — inconsistent; de-dupe candidate.
- **Over-statement:** Salmon Poke Bowl Meal Prep (protein 47 vs ~14 — 1 tin salmon can't yield that).
- Rice-paper dishes (Kimchi Jeon, Pad See Ew, Pad See Ew Shrimp) match beautifully — they're
  gram-specified. Salmon/oil bowls and dessert bars remain under-counted.

**Running totals through Batch L:** ~260 of 310 ready recipes covered (10 written + ~248 audited).


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


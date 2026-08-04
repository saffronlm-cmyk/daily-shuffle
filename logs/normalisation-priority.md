# Quantity-normalisation priority list

Derived from the library macro audit (`logs/macro-audit.md`). These are the recipes whose
stored macros are materially off **because of unweighted / volume quantities** (cups of oil,
nut butter, tahini, "1 tin coconut milk", dry noodle/pasta/rice weights, dates, almond flour)
— i.e. the ones quantity-normalisation → recompute will fix. Over-statements, serving-count
bugs, duplicates, and empty-ingredient-list recipes are tracked separately in the audit's
SWEEP COMPLETE summary, not here.

Global assumptions (confirmed by Saffron, 2026-07-16): **coconut milk = light**,
**quinoa = cooked**, **instant noodle pack = 85 g**. Coconut *cream* stays full-fat.

Format: `stored kcal → recompute kcal` (per serving).

## Tier 1 — DONE (written to Supabase, 2026-07-16, Batch A2)

- [x] Quick Chicken Laksa — 488 → 897
- [x] Crispy Rice Salad with Miso Tofu — 488 → 916
- [x] Peanut Butter Chicken Coconut Noodles — 485 → 913
- [x] Ultimate Christmas Pasta Salad — 548 → 933
- [x] Pad See Ew with Beef — 388 → 864
- [x] Crispy Tempeh Rice and Cucumber Salad — 488 → 852
- [x] Thai Glass Noodle Salad with Prawns — 448 → 834
- [x] Green Goddess Pasta Salad — 398 → 795
- [x] Sweet Potato and Kale with Tahini Dressing — 488 → 488 (macros shifted; cooked quinoa)
- [x] Pumpkin Spice Olive Oil Cake — 388 → 673
- [x] Spicy Tom Kha Soup with Tofu — 288 → 415
- [x] Coconut Prawn Curry — 228 → 375
- [x] Steamed Rice Paper Dumplings with Shrimp — 198 → 444
- [x] Date Tahini Bites with Sunflower Sesame Crust — 128 → 278
- [x] Sweet and Salty Date Caramel Oat Cookie Slice — 148 → 276

## Tier 2 — tranche 1 DONE (written to Supabase, 2026-07-16, Batch A3)

Precise before → after in `macro-audit.md` Batch A3.

- [x] Cosmic Brownie Overnight Oats — 488 → 696
- [x] Golden Coconut Chicken Curry — 488 → 624 (no rice, full cream)
- [x] Miso Soy Chicken with Coconut Lime Rice — 578 → 776 (full-fat coconut)
- [x] Garlic Miso Somen Noodles — 378 → 608
- [x] Pad See Ew — 488 → 713
- [x] Pad Thai Inspired Saucy Chicken Noodles — 525 → 725
- [x] Sweet Potato Olive Oil Cake — 268 → 451
- [x] Fiery Chilli Prawn Linguine — 337 → 578
- [x] Chocolate Zucchini Bread — 268 → 394
- [x] Peanut Noodle Stir Fry — 398 → 668
- [x] Maple Sriracha Tofu Protein Bowl — 428 → 698
- [x] Chicken Tikka Masala — 448 → 652
- [x] Cinnamon Roll Date Cake — 248 → 417
- [x] Toffee Pecan Apple Crumble — 318 → 526

## Tier 2 — tranche 2 DONE (written to Supabase, 2026-07-16, Batch A4) — all optional toppings included

Precise before → after in `macro-audit.md` Batch A4. **Tier 2 fully cleared.**

- [x] Raspberry Chocolate Chip Baked Oatmeal — 468 → 776
- [x] Sticky Toffee Date Oats — 445 → 778
- [x] Chocolate Chia Overnight Oats — 502 → 692
- [x] Snickers Overnight Oats — 412 → 535
- [x] Sweet Potato Chocolate Chip Cookies — 138 → 211
- [x] Tahini Oat Chocolate Chip Bars — 198 → 315
- [x] Sweet Potato Chocolate Cake — 148 → 237
- [x] No Bake Coconut Cookies — 168 → 242
- [x] Halloween Chocolate Almond Butter Balls — 118 → 175 (+optional protein)
- [x] Chocolate Tahini Brownies — 178 → 272
- [x] Sticky Toffee Chia Pudding — 378 → 708 (+caramel topping)
- [x] Maple Cinnamon Pumpkin Overnight Oats — 368 → 596
- [x] Blended Overnight Oats — 398 → 617 (+topping)
- [x] Blueberry, Lemon & Coconut Overnight Oats — 332 → 437

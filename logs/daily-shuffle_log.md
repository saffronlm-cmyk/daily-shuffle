# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

# Applied three `pricebook.csv` naming normalisations; worklist now joins 93/94; PR #75 merged
**Date:** 2026-08-24
**Project:** Daily Shuffle — price book (ingredient normalisation)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. PR #75 merged to `main`.

---

## Project Context
Third and final entry of 2026-08-24, closing the thread of the two below. The middle
entry merged Saffron's hand-priced worklist and **flagged three rows whose names no
longer joined** to `pricebook.csv`. She said "fix 1-3 then merge to main" — so this
entry applies them. Read the entry below for the worklist conventions; not repeated here.

## Session Goal
Apply the three flagged normalisations to `pricebook.csv`, then merge PR #75.

## State Before This Session
Branch at `20a3e45`, PR #75 open as a draft. `pricebook.csv` 987 rows, untouched since
the 2026-08-06 audit. Three known naming defects flagged but not fixed.

## What Was Done

### 1. `Gras-fed` → `Grass-fed Collagen` (`pricebook.csv:296`)
Typo fixed in **both** `Ingredient` and `Product` (the row was its own family), and
**`gras-fed collagen` added to `Aliases`**. The alias is the important half: the 4
recipe lines that produced this row still say "gras-fed", and `lookupPriceBook()`
checks aliases before falling back to token containment, so the rename doesn't orphan
them. Renaming without the alias would have silently un-priced 4 recipe lines.

### 2. `Argentine Red Shrimp` → `Prawn` family (`:254`)
The smallest of the three, and it needed no rename at all. Looking at the family, this
row was **the only shrimp variant not already filed under Product `Prawn`** — `Shrimp`,
`Wild Shrimp`, `And Deveined Shrimp`, `Jumbo Wild Caught Pink Shrimp` and
`Prawn Shrimp` were all there already. So this was a one-cell fix bringing the holdout
into line, not the ingredient merge her note implied. `Ingredient` left verbatim, which
is both the data model (variant = recipe name, Product = grouping) and what keeps its
own join intact. Family is now 9 rows / 32 occurrences.

### 3. `Crispy Fried Shallot` → `Crispy Fried Onions` (`:209`), and `Fried Shallot` regrouped (`:292`)
Renamed with `crispy fried shallot` retained as an alias, same reasoning as §1.

The judgement call was **which family** it belongs to. `Fried Shallot` sat under
Product `Onion` — and putting a packaged crispy-onion topping in the same family as
raw onions is precisely `pricebook-audit.md` §3's defect: one price per family, so the
topping would inherit brown-onion pricing (£12/kg vs ~£1/kg — an order of magnitude).
So `Crispy Fried Onions` became **its own family**, and `Fried Shallot` moved out of
`Onion` into it. That resolves the disagreement between the two rows in the direction
that doesn't create a pricing error.

Left alone: `Shallot` (16 occ) and `Banana Shallot` (10 occ) stay under `Onion` — those
are genuine fresh shallots, correctly grouped.

### 4. Kept the two files joined
Renaming in `pricebook.csv` alone would have broken the *other* side of the join, so
`pricebook-manual-batch.csv`'s `Crispy Fried Shallot` row was renamed to match, with
the rename recorded in its `Notes`. Her `Grass-fed Collagen` row needed no change — it
already carried the corrected spelling, which is what surfaced the mismatch originally.

### 5. Verified the joins programmatically
Wrote `scratchpad/verify_join.mjs` — parses both files properly, prints the four edited
rows, confirms the old strings are gone from `Ingredient`/`Product` but *present* as
aliases, lists both affected families, and cross-checks **every** worklist Product
against `pricebook.csv`'s Ingredient set. Result: **93 of 94 join** (up from 91). The
single orphan is the M&S hoops SKU, left deliberately.

Also confirmed: 987 rows before and after, all 9 fields, and both renames keep their
alphabetical position within their occurrence block (`Grass-fed` still sorts between
`Glutinous Rice Flour` and `Green Bean`), so **no reordering** — the git diff is
exactly 4 changed lines.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| pricebook.csv | 4 rows edited (2 renames + aliases, 2 Product regroupings). 987 rows unchanged | Modified | /home/user/daily-shuffle/ |
| pricebook-manual-batch.csv | `Crispy Fried Shallot` → `Crispy Fried Onions` + rename note | Modified | /home/user/daily-shuffle/ |
| CLAUDE.md | Recorded the three normalisations, the keep-old-name-as-alias convention, and 93/94 joining | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |
| verify_join.mjs | Cross-file join validator | Created (scratchpad, NOT committed) | scratchpad/ |

**No app code touched** — no cache bump; JS parse check and smoke test don't apply.

## Decisions & Reasoning
- **Every rename keeps the old string as an alias.** New convention, now in CLAUDE.md.
  `Ingredient` values are generated from recipe text, so a bare rename disconnects the
  row from the recipes that created it. The alias path in `lookupPriceBook()` is the
  mechanism that makes renames safe.
- **`Crispy Fried Onions` as its own family, not under `Onion`** — audit §3 reasoning
  above. Chose the option that can't produce a 10× pricing error.
- **Did NOT rewrite recipe text in the `recipes` table**, which her original note asked
  for ("all recipe mentions should be normalised"). The aliases make it unnecessary for
  pricing, `ingredient_sections` is raw truth that the app treats as read-only outside
  the editor, and the 2026-08-05 hollow-recipe damage came from a code path writing it.
  A cosmetic rename is not worth touching that. Flagged rather than done.
- **Did not add a `pricebook.csv` row for the hoops SKU** — not part of 1-3, 0 recipe
  occurrences, and it would sit below the audit's `--min-occ 3`.
- **Squash-merged** #75, matching the last several merges on `main`.

## Current State (end of session)
`main` includes: the hand-priced worklist (88 of 95 rows priced), the hoops row, the
three normalisations, and the CLAUDE.md rewrite. `pricebook.csv` 987 rows with 2 new
aliases and 2 regrouped Products. Nothing runs automatically — `csv_to_seed.py` still
must not run against a partially-filled book (`pricebook-audit.md` §3).

## Next Steps
1. Confirm the four `ASSUMPTION:` rows in the worklist — `Milk Choice` (matched to
   Coconut Milk), `Chicken` (thigh fillets), `Chipotle Powder` (chilli flakes),
   `Green Cabbage` (Savoy). Still open from the previous entry.
2. Consolidate the three salt-and-pepper rows into one (`Salt And Pepper`,
   `Salt Pepper`, `Pinche Salt Pepper` — 10+ occurrences on the Pinche row alone).
   Note `pricebook.csv:895` also has `Pinche Flaky Sea Salt And Black Pepper` (1 occ).
3. Price `White Pepper` (the only genuinely unpriced worklist row).
4. Still the gate on the whole workstream: `pricebook-audit.md` §3 — 208 families vs
   ~365 variants — which blocks the Apify scrape.

## Open Questions / Blockers
- The four `ASSUMPTION:` matches (Next Step 1).
- Whether the `NOTE` row's pluralising instruction should now be applied file-wide or
  waits for the "final naming pass" it mentions. Not acted on.
- Whether the hoops SKU should get a `pricebook.csv` row. Asked twice, not answered;
  harmless either way.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`. Branch `claude/alpro-greek-yoghurt-staples-liiqhy`
→ PR **#75**, squash-merged to `main`. No Supabase writes. No cache bump. No
credentials touched.

## Notes & Gotchas
- **`Argentine Red Shrimp` keeps its name.** Her note said "normalise to Prawns"; the
  fix was a Product regrouping, because the `Ingredient` column is verbatim recipe text
  and renaming it would break its join for no benefit. If she meant the recipe *text*
  should say "prawns", that is Next-Steps work in the `recipes` table, not done here.
- **`Fried Shallot` no longer sits under `Onion`.** If anything relied on the onion
  family covering it, that changed today.
- The audit's §2/§6 normalisation pass is now **partially applied** — three rows of it.
  The produce-fold work (§2a, 49 rows into 10 base items, needs conversion factors) and
  the plural-bug family splits (§4) are still untouched. Don't read this as "§2 done".

# Saffron's hand-priced worklist merged in (87 of 93 rows priced) — supersedes the per-pack-unit convention I invented hours earlier
**Date:** 2026-08-24
**Project:** Daily Shuffle — price book (hand-pricing worklist)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. Rides in the still-open PR #75. Three follow-ups are hers to decide.

---

## Project Context
Direct continuation of the entry below (same date, same PR branch). That entry added
one row to `pricebook-manual-batch.csv` and **guessed at the `Price per measurement`
convention because every row in the file was empty**. Saffron then supplied the
hand-priced file, which answers that question — differently from my guess.

## Session Goal
She uploaded a filled-in `pricebook-manual-batch.csv` and asked two things: does it
correlate with what's in the repo, and add the M&S hoops row to it.

## State Before This Session
Branch `claude/alpro-greek-yoghurt-staples-liiqhy` at `3b42a68`, PR #75 open as a
draft (never merged). Repo file: 94 data rows, exactly one priced — mine, in
per-pack-unit format. `main` at `ad26046`.

## What Was Done

### 1. Correlation check — it matches
Parsed both files with a real RFC4180 parser rather than eyeballing (script:
`scratchpad/compare.mjs`). Result: **identical headers, and 92 of the 93 product rows
match by name AND in the same order.** Full set of differences:

| Difference | Side | What it is |
|---|---|---|
| `NOTE` | uploaded only | A **pseudo-row**, not a product — `Product = NOTE`, Notes holds a file-wide instruction to pluralise names to match supermarket labelling on a final pass |
| `Gras-fed Collagen` → `Grass-fed Collagen` | renamed | Deliberate spelling fix, documented in her Notes |
| `M&S Only 5 Ingredients Multigrain Hoops` | repo only | My row from the previous entry — her copy predates it |

So: her file is the repo file plus prices, one rename, one note row. No reordering, no
dropped products, no field-count damage (all 95 rows exactly 6 fields).

### 2. Her conventions overrule mine — mine was wrong
The previous entry recorded, at length, a decision to use **per pack unit**
(`0.00833` = £/g) with bare numbers. Her 87 priced rows use:
- `Pack qty` with the unit inline — `340g`, `725ml`, `x2`, `loose`, `each`
- `Measurement convention` = **`per kg` / `per litre` / `per item`** (69/12/5 rows)
- `£` symbols on prices, unit suffixes on the measurement — `£3.06/kg`,
  `£7.57/litre`, `65p each`

i.e. **shelf-label figures, kept human-readable**, which in hindsight is obviously
right for a file whose whole purpose is standing at a shelf with a phone. My
reasoning (match the app's `packPrice / packSize`) optimised for a consumer that
doesn't exist yet over the human actually filling the file in. Reformatted the hoops
row to her convention: `300g | per kg | £2.50 | £8.33/kg`. **Same underlying price,
same shelf label** — only the presentation changed.

### 3. Took her file verbatim
Copied her 95 lines byte-for-byte and appended only the hoops row; verified with
`diff` that `head -n -1` of the result is **identical** to her upload. Deliberately
did *not* normalise her `£`/`p` mixing (`65p each` vs `£1.25 each`), tidy her
`ASSUMPTION:` prose, or reorder anything — CLAUDE.md forbids cleaning up these
reviewed CSVs, and her formatting is self-consistent.

### 4. Rewrote the CLAUDE.md bullet
The previous commit had documented my per-pack-unit convention as fact. Replaced it
with hers, plus the two things a future reader would otherwise trip on: the `NOTE`
pseudo-row, and her `Notes` vocabulary (`ASSUMPTION:` = confirm this match,
`FLAGGED FOR CONSOLIDATION` = merge these rows). Also recorded that anything importing
this file **must divide per-kg by 1000** to reach the app's per-g `unitPrice` — the
conversion my format would have avoided, now stated where an importer will read it.

### 5. Checked the join keys of the rows she changed
`grep`ped `pricebook.csv` for each:
- `Gras-fed Collagen` **exists at `pricebook.csv:296`** (4 occurrences) with the
  typo. Her rename to `Grass-fed Collagen` therefore **breaks that join** until
  `pricebook.csv` is fixed too. Left her spelling — it's correct English and a
  deliberate decision — and flagged it rather than "fixing" either file unasked.
- `Argentine Red Shrimp` exists (`:254`, 4 occ) and `Prawn` exists separately
  (`:114`, 14 occ) — so her "normalise to Prawns" note is a real merge, not a rename.
- `Crispy Fried Shallot` exists (`:209`, 6 occ); her note says Sainsbury's has no such
  product and it should become `Crispy Fried Onions`. `Fried Shallot` (`:292`) already
  maps to Product `Onion`, so the two rows disagree with each other today.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| pricebook-manual-batch.csv | Replaced with her hand-priced version + the hoops row reformatted to her convention. 94 → 95 data rows, 1 priced → 88 priced | Modified | /home/user/daily-shuffle/ |
| CLAUDE.md | Worklist bullet rewritten: her conventions, the `NOTE` pseudo-row, her Notes vocabulary, the ÷1000 warning, the two broken join keys | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |
| compare.mjs, merge.mjs, check_csv.mjs | RFC4180 comparison / merge / validation scripts | Created (scratchpad, NOT committed) | scratchpad/ |

**No app code touched** — no cache bump, JS parse check and smoke test don't apply.

## Decisions & Reasoning
- **Adopted her conventions wholesale, did not argue for mine.** 87 rows of real data
  beat one row of my inference, and her format is the one that works at a shelf.
- **Did not touch `pricebook.csv`** despite two now-broken join keys. It's audited,
  and the collagen typo fix + the shrimp/shallot merges are ingredient-normalisation
  decisions with occurrence counts attached — her call, not a side effect of a CSV
  merge.
- **Kept her `NOTE` pseudo-row** rather than moving it to a comment or a doc. It is
  how she left it, it's inside the file where the work happens, and CLAUDE.md's
  no-cleanup rule covers exactly this. Documented it instead so no script trips on it.
- **Kept the hoops row's join warning in `Notes`** — still true, still the only place
  a reader of that row will see it.

## Current State (end of session)
`pricebook-manual-batch.csv`: 95 data rows — 88 priced, 6 deliberately blank
(`White Pepper` genuinely unpriced; `Salt And Pepper` / `Salt Pepper` /
`Pinche Salt Pepper` / `Argentine Red Shrimp` / `Grass-fed Collagen` awaiting her
consolidation or price), plus the `NOTE` row. Nothing consumes the file automatically
— `csv_to_seed.py` must still not run against a partially-filled book
(`pricebook-audit.md` §3). Pushed to PR #75, still a draft.

## Next Steps
1. Confirm or correct the four `ASSUMPTION:` rows — `Milk Choice` (matched to Coconut
   Milk), `Chicken` (matched to thigh fillets), `Chipotle Powder` (matched to chilli
   flakes), `Green Cabbage` (matched to Savoy).
2. Do the consolidations her notes flag: the three salt-and-pepper rows → one;
   `Argentine Red Shrimp` → `Prawns`; `Crispy Fried Shallot` → `Crispy Fried Onions`.
   These touch `pricebook.csv` and recipe ingredient text, so they're a real pass, not
   a CSV edit.
3. Fix `pricebook.csv:296` `Gras-fed` → `Grass-fed` so that row joins again.
4. Price `White Pepper`, and decide whether the hoops SKU gets a `pricebook.csv` row.
5. Still the gate on the whole workstream: `pricebook-audit.md` §3 (208 families vs
   ~365 variants), which blocks the Apify scrape.

## Open Questions / Blockers
- The four `ASSUMPTION:` matches (Next Step 1) — hers to confirm.
- Whether the pluralising instruction in the `NOTE` row applies to the whole file now
  or at the "final naming pass" she mentions. Not acted on.
- The hoops SKU still joins to nothing; unchanged from the previous entry.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/alpro-greek-yoghurt-staples-liiqhy`
(off `main` @ `ad26046`), PR **#75** — open, draft, this commit extends it rather than
opening a new one. No Supabase writes. No cache bump. No credentials touched.

## Notes & Gotchas
- **`Product = NOTE` on row 2 is not a product.** Any script reading this file as
  products must skip it.
- **Her figures are per-kg/litre shelf labels; the app's `unitPrice` is per g/ml.**
  An importer that doesn't ÷1000 will price everything 1000× too high.
- **`£` and `p` are mixed** in her values (`£3.06/kg`, `65p each`, `77p each`). Any
  parser needs both.
- **`Pack qty` is not always numeric** — `loose`, `each`, `x2`, `x2 pack`,
  `4x145g (580g)`, `400g/400ml`, `340g (150g drained)`. Don't assume `parseFloat`.
- Two rows are priced with an empty `Pack qty` (`Almond Butter`, `Chinese Five Spice`)
  — her note says the pack size wasn't visible in the screenshot.
- The previous entry (below, same date) states the per-pack-unit convention as a
  decision. **It is superseded by this one** — kept as written, since prior entries
  aren't edited.

# First priced row in `pricebook-manual-batch.csv` — sets the per-pack-unit precedent; M&S Multigrain Hoops has no `pricebook.csv` join
**Date:** 2026-08-24
**Project:** Daily Shuffle — price book (hand-pricing worklist)
**Status:** Complete. Two things need Saffron's eye — see Open Questions.
**Mode:** Rolling Log + GitHub Push

---

## Project Context
`pricebook-manual-batch.csv` was created 2026-08-06 as the subset of `pricebook.csv`
products that can be hand-priced *now*, without waiting on the two open blockers in
`pricebook-audit.md` (§3 price-unit decision, §2a produce-fold conversion factors).
Until this session **every one of its rows was empty** — Product column filled in,
all five value columns blank. See `pricebook-audit.md` for why the scrape is still
gated; nothing in this session unblocks it.

Earlier the same day, a separate task in this session added the Alpro Greek Style
yoghurt to `staple_products` (PR #71, merged `5469d36`) — unrelated except that it
raised the same "there is no price column on `staple_products`" point that made
Saffron reach for this file.

## Session Goal
Add M&S Only 5 Ingredients Multigrain Hoops to `pricebook-manual-batch.csv` from a
screenshot of the M&S shelf listing (300 g, £2.50, £8.33/kg).

## State Before This Session
`main` at `ad26046` (#74 — "Send to Tracker"). Note main moved four PRs (#71→#74)
during this session from parallel work; the branch was restarted off `ad26046` per
the merged-PR rule rather than stacked on the #71 branch.
`pricebook-manual-batch.csv`: 93 data rows, **all value columns empty**.

## What Was Done

### 1. Added the row (the only filled row in the file)
```
M&S Only 5 Ingredients Multigrain Hoops,300,g,2.50,0.00833,"…"
```
Appended at the end rather than inserted — the file is ordered by descending
occurrence count and CLAUDE.md forbids reordering these CSVs.

### 2. Had to invent the "Price per measurement" convention
**No row was filled in, so there was no precedent to copy — this row sets it.**
The column could reasonably mean per-kg (what the shelf label quotes, £8.33) or per
pack-unit (£0.00833/g). Chose **per pack unit**, because:
- `pricebook.csv`'s own columns are `Pack size (qty)` / `Pack unit (g / ml / each)` /
  `Pack price (£)`, and this file's whole purpose is joining back into it;
- the app computes `unitPrice = packPrice / packSize` (`index.html`, `seedPriceBook()`
  and `importPriceBookCsv()`), i.e. per pack unit — a per-kg column would need a
  ×1000 that nothing downstream applies;
- `pricebook-audit.md` §5 is already a list of rows broken by unit mismatch. Adding a
  third unit basis to the same data invites exactly that.
The shelf figure (£8.33/kg) is preserved verbatim in `Notes`, so nothing is lost if
Saffron prefers per-kg — it is a one-column rewrite across a file with one filled row.

### 3. Found the row does not join
`Product` is documented as **the verbatim `Ingredient` string from `pricebook.csv`,
and the join key**. Grepped `pricebook.csv` for `hoop|multigrain|cereal|m&s|marks`:
the only hit is `Granola,Cereal,Pantry / Dry Goods,…,2`. **This SKU has no
`Ingredient` row**, so as written the row joins to nothing. Added it anyway — Saffron
asked for it by name and the price observation is worth capturing — with the
mismatch recorded in `Notes` rather than silently left to be discovered later.

### 4. Fixed a false number in CLAUDE.md
CLAUDE.md said the worklist held "the 99 `pricebook.csv` products"; the file has held
**93** for as long as git knows. Replaced the hard number with an instruction to count,
and documented the per-pack-unit convention and the non-joining row.

### 5. Validated
Wrote a throwaway RFC4180 parser (`scratchpad/check_csv.mjs`) rather than eyeballing,
because the new `Notes` value is the file's first quoted field containing commas — a
naive `split(',')` reader would now see 9 fields on that row. Result: 94 data rows,
**every row exactly 6 fields**, no duplicate Product values, and `2.50/300 = 0.00833`
reproducing the label's £8.33/kg exactly. `node scripts/claude_md_drift.mjs` clean.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| pricebook-manual-batch.csv | +1 row, the file's first priced row (93 → 94 data rows) | Modified | /home/user/daily-shuffle/ |
| CLAUDE.md | Worklist bullet: dropped the false "99", documented the per-pack-unit convention + the non-joining row | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |
| check_csv.mjs | Throwaway CSV field-count validator | Created (scratchpad, NOT committed) | scratchpad/ |

**No app code touched** — `index.html`/`sw.js` untouched, so **no cache bump**, and the
JS parse check / smoke test do not apply (data + docs only).

## Decisions & Reasoning
- **Per pack unit, not per kg** for `Price per measurement` — reasoning in §2 above.
  Rejected per-kg despite it being what the shelf label shows, because three unit
  bases in one dataset is how `pricebook-audit.md` §5 got its list of dead rows.
- **Appended, did not insert** — file is occurrence-ordered and CLAUDE.md forbids
  reordering these reviewed CSVs.
- **Added the row despite the broken join, rather than stopping to ask** — she named
  the product explicitly and supplied a complete price observation. Recording it with
  the mismatch flagged in `Notes` loses nothing; refusing to write it would have lost
  the observation. The fix (an `Ingredient` row, or a rename to an existing one) is
  hers to choose.
- **Did NOT add a matching row to `pricebook.csv`** — it is an audited file whose rows
  derive from recipe ingredient usage, this SKU has 0 occurrences, and inserting a
  0-occurrence branded row would fall below the `--min-occ 3` threshold the audit
  recommends anyway. Not worth perturbing that file unasked.
- **Kept the `&` unescaped** in `M&S` — plain CSV, no HTML/XML in the path; the app's
  `importPriceBookCsv()` reads it as text.

## Current State (end of session)
`pricebook-manual-batch.csv` has 94 data rows, exactly one of them priced. The other
93 remain the untouched worklist. Nothing consumes this file automatically yet — it is
a hand-pricing worklist, so the row is inert until someone runs `csv_to_seed.py`
(which the audit says must not run against a partially-filled book) or imports via
Settings → price book CSV import.

## Next Steps
1. Decide per-pack-unit vs per-kg for `Price per measurement` (Open Question 1). One
   row is filled, so switching costs nothing right now and gets expensive later.
2. Decide how the hoops row should join: add an `Ingredient` row to `pricebook.csv`,
   or drop it if no recipe will ever use it.
3. Unrelated but still the gating decision on this whole workstream:
   `pricebook-audit.md` §3 price-unit question (208 families vs ~365 variants), which
   blocks the Apify scrape.

## Open Questions / Blockers
1. **Is `Price per measurement` per pack unit or per kg?** Set to per pack unit here
   with the reasoning above. Needs a yes/no; unblocks the remaining 93 rows.
2. **Should the hoops row exist in `pricebook.csv` too?** Currently joins to nothing.
   Not blocking anything today.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/alpro-greek-yoghurt-staples-liiqhy`
restarted from `main` @ `ad26046` (the branch's previous PR #71 was already merged, so
per CLAUDE.md's merged-PR rule it was recreated from main, not extended). No cache
version bumped. No Supabase writes this session. No credentials touched.

## Notes & Gotchas
- **This row is the file's first quoted field containing commas.** Any reader doing
  `line.split(',')` will now mis-parse it into 9 fields. If a script is ever written
  against this file, use a real CSV parser.
- **CLAUDE.md's row counts keep going stale** — "99" here while the file held 93, and
  "~167" for `staple_products` while the table held 178 (see the 2026-08-13 entry).
  Third instance of the same failure. Count, don't trust the doc.
- The per-pack-unit choice was made by *this session*, not signed off by Saffron. It
  is not in the same class as the locked `pricebook-audit.md` decisions — treat it as
  provisional until she confirms.

# "Send to Tracker" — Plan → Tracker Sync Built and Shipped
**Date:** 2026-08-23
**Project:** Daily Shuffle — Shuffle ↔ Tracker integration (`index.html`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. PR #74 merged (`ad26046`).

---

## Project Context
Third and final piece of the 2026-08-23 session. The two entries below cover the earlier
halves — the `parseQty` glued-unit fix (#72) and the grocery batch-scaling fix (#73).
This one is a **new feature**, not a bug fix, and is independent of both.

Nutrition workstream still untouched — step 2 (quantity normalisation) remains not
applied, unchanged all session.

## Session Goal
Saffron asked for "a button or something" to push the Shuffle plan's meals through to
the matching Tracker slots, so a planned week wouldn't have to be re-entered by hand.
Scope it, take the design decisions, build it, ship it.

## State Before This Session
`main` at `0b2536e` (#73). `sw.js` at `daily-shuffle-v46`. No link of any kind between
the Shuffle plan and the Tracker — every planned meal had to be re-added manually.

## What Was Done

### 1. Reconnaissance — the groundwork was mostly already there
Four findings that made this much smaller than expected:
- **`food_log` already has `planned` (boolean) and `status` columns**, and
  `trkMakeEntry()` already writes both — but **nothing in the app reads either**. The
  schema anticipated this feature and was never wired up.
- **`trkAddRecipe()`** (`index.html:6431`) already builds a valid recipe entry with
  macros and a `recipe_snapshot`. The sync is essentially that in a loop.
- **The plan already persists what's needed** — `savePlan()` stores each day's
  `dateISO` and slots (`_PLAN_DAY_SLOTS`).
- **Recipe macros are stored PER SERVING.** Confirmed in `fetchMacroEstimate` (which
  divides by servings before saving), not from the doc. So one planned slot = one entry
  of one serving, **no scaling maths at all**.

### 2. Two decisions put to Saffron (they changed the work materially)
Asked rather than guessed; both answered:
- **Ring maths → "count immediately as eaten."** I recommended the planned/confirm
  model (it would have used the dormant `planned`/`status` columns and given honest
  totals on days she deviates), but she chose immediate counting. **Consequence she was
  told and accepted: syncing a week ahead shows every future day as fully eaten.**
- **Button placement → Shuffle tab, by the plan** (push model), next to the lock bar.

### 3. Built `syncPlanToTracker()`
Placed in the tracker section after `trkAddRecipe` (it uses tracker internals; the
`<script>` blocks share global scope so the Shuffle-tab button can call it).

- Slot map `PLAN_SLOT_TO_MEAL`: breakfast/lunch/dinner straight across, **`snack` and
  `snack2` both → `snack`** (the tracker has one snack slot).
- Skips empty slots and **SHAKE (`id: 0`)** — it carries no macros.
- Macros from the Supabase row via `trkFetchRecipes()`; **falls back to
  `RECIPE_FULL_DATA[id].nutrition`** for local-only recipes (that fetch only returns
  cloud rows). Neither available → still logged, with the count surfaced in the toast.
- **`trkMakeEntry()` changed**: `date_key: o.date_key || trkDay`. That one-line change is
  what lets the sync write future dates without navigating the tracker to each one.
- New helper **`_trkPatchDayCache(dateKey, mutate)`** — read-modify-write on
  `ds_trk_day_<key>` that **preserves each day's `meta`** (exercise, notes, tdee).
  Necessary because `trkCacheDay()` only ever writes the day currently on screen.

### 4. Idempotency (the part most worth understanding)
Every entry is tagged **`entry_type:'plan_sync'`**. A sync first DELETEs only those rows
for the affected `date_key`s, then rewrites. So repeat syncs never duplicate and
hand-logged entries are never touched.

**If the cloud delete fails the sync aborts** rather than writing entries that would
duplicate once the device reconnects (`trkLoadDay` replaces `trkEntries` from cloud). If
there's **no cloud configured at all** it proceeds locally — nothing to duplicate there.
That asymmetry is deliberate.

### 5. Verified at runtime, not by reading
Sandbox can't reach Supabase, so **stubbed `window.fetch` and `window.confirm`** in the
page and drove a real 2-day, 3-slot plan through `_groceryAggregate`'s sibling path:

| Check | Result |
|---|---|
| Entries created | 6, correct dates |
| Macros from cloud row | 400 / 600 kcal ✓ |
| Local-only fallback | 333 kcal from `RECIPE_FULL_DATA` ✓ |
| Pre-existing hand-logged entry | survived ✓ |
| Day meta (exercise/notes/tdee) | preserved ✓ |
| Second sync | 4 and 3 — unchanged, no duplication ✓ |
| Delete scope | `?entry_type=eq.plan_sync&date_key=in.("2026-08-25","2026-08-26")` ✓ |

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `index.html` | `syncPlanToTracker()`, `_trkPatchDayCache()`, `PLAN_SLOT_TO_MEAL`, `date_key` override in `trkMakeEntry()`, button in the lock bar | Modified | `/home/user/daily-shuffle/` |
| `sw.js` | `CACHE` bumped `v46` → `v47` | Modified | `/home/user/daily-shuffle/` |
| `CLAUDE.md` | New "Plan → Tracker sync" bullet in Data & sync | Modified | `/home/user/daily-shuffle/` |
| `logs/daily-shuffle_log.md` | This entry | Modified | `/home/user/daily-shuffle/logs/` |

No database writes this session. Supabase MCP used **read-only** (schema + serves
distribution only).

## Decisions & Reasoning
- **Count as eaten immediately** — Saffron's call over my recommendation (see §2).
  Reversible later: the `planned`/`status` columns are already written on every entry,
  so a confirm-to-count model is a contained change, and `syncPlanToTracker` is where
  those fields would be set.
- **Tag + delete-by-tag for idempotency**, not upsert-by-id. IDs are random per call, so
  upsert wouldn't dedupe; and delete-by-tag is the only approach that provably cannot
  touch hand-logged rows.
- **Abort on failed cloud delete, proceed when there's no cloud at all.** Duplication is
  only possible when a cloud copy exists — so refusing offline entirely would be too
  strict, and proceeding after a *failed* delete would be too loose.
- **Fallback `servings || 1`, `date_key || trkDay`** — every new default reproduces the
  prior behaviour exactly, so nothing existing changes.
- **`snack2` → `snack`** rather than `dessert`. Both plan snack slots are snacks;
  `dessert` is a separate tracker concept she uses deliberately.
- **Left the AI-plan leftover-span bug alone** (see the #73 entry §1) — different
  mechanism, would muddy this diff.

## Current State (end of session)
Working and shipped. `main` at **`ad26046`**. ship-check clean: 3/3 parse, smoke 5/5,
cache `v47`, drift clean. All three of today's PRs (#72, #73, #74) merged.

## Next Steps
1. **Use it once for real**: Shuffle → generate/open a plan → "Send to Tracker" →
   check the Tracker's slots on those dates. Hard-refresh if `v46` is still cached.
2. **Expect future days to read as fully eaten** if a week is synced ahead. That's the
   chosen behaviour, not a bug. If it grates, switch to the confirm-to-count model —
   the columns are already there.
3. **Optional — fix the AI Plan leftover span** (carried over from the #73 entry). The
   clamp in `buildPlanFromAIDays` is the more robust of the two options; it doesn't
   depend on the model obeying the prompt.
4. Nutrition step 2 remains the open workstream, unchanged all session.

## Open Questions / Blockers
None blocking. Carried-over deferrals: the AI-plan leftover span; the two
Tracker-target caveats (not cloud-synced, calorie field `|| default`) from the #72 entry.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/manual-macro-targets-y9czdf`
  (restarted from `origin/main` before each of today's three PRs), PR **#74** merged.
- `sw.js` `CACHE` now **`daily-shuffle-v47`**. Read the live value from `sw.js`.
- Supabase project `jsxcctrskkkxgdxfaduo`; tables `food_log`, `recipes` — read-only here.
- No credentials beyond the already-public inlined anon key.

## Notes & Gotchas
- **`entry_type:'plan_sync'` is load-bearing.** The idempotent delete is keyed on it.
  Never reuse that string for another feature, and never rename it without updating the
  delete. Documented in CLAUDE.md for the same reason.
- **`trkCacheDay()` only writes `trkDay`.** Anything touching another day's cache must go
  through `_trkPatchDayCache` or it will silently wipe that day's `meta`.
- **Recipe macros are per serving** (`fetchMacroEstimate` divides before saving). If that
  ever changes, this sync starts logging whole batches per slot.
- **`trkFetchRecipes()` memoises into `_trkRecipeCache`** and only returns cloud rows —
  hence the `RECIPE_FULL_DATA` fallback. A recipe added locally this session won't be in
  it until a reload.
- **`trkNum()` coerces null → 0**, so an entry with unknown macros contributes nothing to
  the rings rather than breaking the sum. That's why unmatched recipes are still logged.
- **Runtime test pattern (reusable, and faster than driving the UI):** `addInitScript`
  seeds `ds_recipe_cache` + `ds_recipe_cache_full`; then inside `page.evaluate` stub
  `window.fetch` and `window.confirm` and call app internals directly. Used for both
  today's grocery fix and this feature. Scratchpad only — not committed.
- The branch name `claude/manual-macro-targets-y9czdf` describes none of today's three
  changes; it came from the opening macro-targets question. Don't read meaning into it.

---

# Grocery List Was Multiplying Batch Recipes by Days Instead of Batches
**Date:** 2026-08-23
**Project:** Daily Shuffle — meal plan → grocery list (`index.html`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. PR #73 merged.

---

## Project Context
Second piece of work in the same session as the entry immediately below
("parseQty Was Dropping Quantities…", 2026-08-23). **The two bugs are unrelated in
cause but landed on the same screen**, which is very likely why the grocery list looked
wrong in more than one way at once: `parseQty` was *losing* quantities, and
`_groceryAggregate` was *over-counting* the ones that survived. Read both entries
together before touching grocery-list maths.

Nutrition workstream untouched again — step 2 still not applied.

## Session Goal
Saffron asked whether recipe serving sizes are factored into the leftover quantities on
the calendar, then reported the real symptom: a **4-day plan whose breakfast and dinner
each serve 4 had multiplied quantities in the grocery list**. Diagnose and fix.

## State Before This Session
`main` at `4225e50` (#72, the parseQty fix, merged earlier this session).
`sw.js` at `daily-shuffle-v45`.

## What Was Done

### 1. Answered the servings/leftover question — two paths, only one correct
There is **no Calendar tab**. The Calendar is a *section inside the Shuffle tab*
(`tab-plan`), rendered by `renderPlanOutput()` (`index.html:4278`). Worth knowing
before hunting for a tab that doesn't exist.

- **Shuffle button — servings drives leftovers correctly.** `buildBatchSchedule()`
  (`index.html:3916`) does `const n = Math.min(pick.servings || 1, rem)` — a recipe
  occupies exactly `servings` consecutive days. `dinnerBatchDay`/`dinnerBatchTotal` are
  measured off that span.
- **AI Plan button — servings is never consulted.** `buildPlanFromAIDays()`
  (`index.html:4149`) *measures* the span from whatever IDs the model repeated. The
  model is never told servings: `formatR()` (`index.html:4051`) sends only
  `id: name [kcal, protein] ★`, and the system prompt hardcodes *"group the SAME dinner
  ID across 2–4 consecutive days"* (`index.html:4089`).
  Against the live library that misfires both ways — of 54 dinner recipes, **5 serve 1**
  (would be labelled "Leftover day 2/3" with no food left) and anything serving 5+ gets
  truncated to 4. Only the 23 serves-2 and 7 serves-3 dinners fit the hardcoded range.

**Not fixed** — see Next Steps. Flagged in PR #73's "Not included" section too.

### 2. Found the actual reported bug — grocery scaling
`_groceryAggregate()` (`index.html:4441`) had:

```js
const portionScale = (idCounts[idStr] || 1); // recipe used N times in plan
```

`idCounts` is the number of **plan slots** a recipe fills = **portions eaten**. But the
recipe as written already yields `servings` portions, so what you shop for is
**batches** = `ceil(portions / servings)`. Scaling by portions multiplied a 4-serve
dinner over 4 days by 4.

Note the app's own planner contradicts this: `buildBatchSchedule` deliberately spreads
one cook across `servings` days and the calendar labels them "Leftover day 2/4". The
grocery list was the only component treating those days as separate cooks.

### 3. Reproduced at runtime before changing anything
Wrote a throwaway Playwright script (same fixture-seeding trick as
`scripts/smoke_test.mjs` — `ds_recipe_cache` + `ds_recipe_cache_full` in
`addInitScript`), built a 4-day plan by hand, called the real `_groceryAggregate`:

| Recipe line | Correct | Showed (before fix) |
|---|---|---|
| 400 g oats (serves 4) | 400 g | **1600 g** |
| 800 g chicken thighs (serves 4) | 800 g | **3200 g** |

### 4. Fixed and verified
```js
const serves = Math.max(1, (r && r.servings) || 1);
const portionScale = Math.ceil((idCounts[idStr] || 1) / serves);
```
Re-ran the harness across 8 servings/days combinations (100 g per recipe, so grams
should equal batches × 100): serves 1/3 days→300, 2/4→200, 3/4→200, 4/2→100, 4/4→100,
6/4→100, 4/6→200, 4/9→300. **All correct.**

### 5. Noticed a corroborating inconsistency
`agg[].priceCost` uses the same `portionScale`, so the **per-aisle subtotals** were
inflated by the same factor. The **plan cost summary** in `renderGroceryList` sums
`cost.perPortion` across plan slots (4 days × total/4 = one batch) and was **already
correct**. So the two figures on that screen disagreed before this change and agree
after it — independent evidence that `portionScale` was the wrong term rather than the
cost summary. Did not touch the cost summary.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `index.html` | `_groceryAggregate()` — `portionScale` now batches, not portions | Modified | `/home/user/daily-shuffle/` |
| `sw.js` | `CACHE` bumped `daily-shuffle-v45` → `v46` | Modified | `/home/user/daily-shuffle/` |
| `logs/daily-shuffle_log.md` | This entry | Modified | `/home/user/daily-shuffle/logs/` |

No database writes; Supabase MCP used read-only (serves distribution only).

## Decisions & Reasoning
- **Fixed `portionScale`, not the cost summary.** Both couldn't be right. The planner's
  own batch model (`buildBatchSchedule` spreading one cook over `servings` days) and the
  already-correct plan cost summary both point at portionScale as the outlier.
- **`ceil(portions / servings)`, not `floor` or exact division.** You can't cook 0.5 of a
  batch — shopping must round **up**. `ceil` also leaves serves-1 recipes at their old
  value, so that whole class is provably unaffected.
- **Fallback `servings || 1`, not `|| 2`.** `mapSupabaseToApp` defaults to 2, but here a
  wrong-high default would *under*-buy. Falling back to 1 reproduces the old behaviour
  exactly for any recipe whose servings we can't determine — fails safe.
- **Left the AI-path leftover-span bug out of this PR.** Different mechanism (prompt +
  catalog, not aggregation), and mixing them makes the diff harder to review.
- **Kept the throwaway repro scripts in the scratchpad, not the repo.** They're one-off
  diagnostics; `scripts/smoke_test.mjs` is the committed runtime check. If this needs
  re-testing, the pattern is 20 lines — see §3.

## Current State (end of session)
Working. PR **#73** merged into `main`. ship-check clean: 3/3 parse, smoke 5/5, cache
bumped to `v46`, drift clean.

## Next Steps
1. **Re-open the Shuffle tab and regenerate/re-check the current 4-day plan.** Quantities
   should now show one batch per recipe. Hard-refresh once if `v45` is still cached.
2. **Per-aisle price subtotals will drop** by the same factor the quantities did. Correct,
   not a new bug.
3. **Optional — fix the AI Plan leftover span** (§1). Two candidate changes: add `serves`
   to `formatR`'s catalog line and replace the hardcoded "2–4 consecutive days" with a
   per-recipe instruction; and/or clamp the returned span to the recipe's servings in
   `buildPlanFromAIDays`. **The clamp is the more robust of the two** — it doesn't depend
   on the model obeying the prompt.
4. Nutrition step 2 remains the open workstream, unchanged.

## Open Questions / Blockers
None blocking. Deferred: the AI-path leftover span (above), plus the two Tracker-target
caveats from the entry below.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/manual-macro-targets-y9czdf`
  (restarted from `origin/main` after #72 merged, per the merged-PR rule), PR **#73**.
- `sw.js` `CACHE` now **`daily-shuffle-v46`**. Read the live value from `sw.js`.
- No credentials in play.

## Notes & Gotchas
- **`idCounts` counts slot-occurrences, not days.** That's the right numerator — a recipe
  in two slots on one day is two portions. Don't "fix" it to count distinct days.
- **The grocery list and the plan cost summary compute cost by different routes** (aisle
  subtotals via `agg[].priceCost` × portionScale; the header via `computeRecipeCost`'s
  `perPortion` summed over slots). They agree now. If a future change touches one, check
  the other — a disagreement between them is a reliable smell.
- **The Calendar is a section of the Shuffle tab, not a tab.** `renderPlanOutput()`.
- The serves distribution as of today: no NULLs, 342 recipes, dinners spread 5×serves-1,
  23×serves-2, 7×serves-3, 17×serves-4, 2×serves-5. Will drift — re-measure, don't cite.
- Runtime repro pattern worth reusing: `page.addInitScript` seeding `ds_recipe_cache` +
  `ds_recipe_cache_full`, then `page.evaluate` calling app internals directly. Much
  faster than driving the UI, and it works fully offline.

---

# parseQty Was Dropping Quantities on Glued Units and Ranges (650 lines, 225 recipes)
**Date:** 2026-08-23
**Project:** Daily Shuffle — recipe ingredient parsing (`index.html`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. PR #72 merged.

---

## Project Context
Sits underneath the nutrition-estimation workstream (steps in CLAUDE.md). Step 2
(quantity normalisation) is approved and scripted but still **not applied** — see the
2026-07-01 entry for the §6 decisions and the 2026-08-05 entry for the 250 ml cup
unification. This session did not advance step 2; it fixed a **pre-existing app-side
parser bug** that would have made step 2's output disagree with what the app displays.

Not related to the hollow-recipe damage (closed 2026-08-12) — this bug never wrote
anything to the database.

## Session Goal
Started as two questions from Saffron: (1) does the Tracker let her manually adjust
macro targets, and (2) why do recipes she uploads to Supabase via **Claude chat** end
up with the quantity sitting inside the ingredient-name box instead of the qty box.
Question 2 turned into the session's real work: diagnose and fix.

## State Before This Session
`main` at `5469d36` (#71). Working branch `claude/manual-macro-targets-y9czdf` did not
yet exist. `sw.js` at `daily-shuffle-v44`.

## What Was Done

### 1. Tracker macro targets — answered, no change made
Already implemented, and has been since the tracker was integrated (commit `1ffe151`).
Tracker tab → **"Targets"** button (`index.html:1317`) → `trkOpenTargets()` modal with
five editable fields; `trkSaveTargets()` persists to `localStorage` under
`ds_trk_targets`, merged over `TRK_TARGET_DEFAULTS` (1800/130/170/58/30) on load.

Two caveats surfaced and reported, **neither fixed** (not asked to):
- `ds_trk_targets` is **not** in the cloud-sync snapshot (`buildSyncPayload`, approx.
  `index.html:5037-5053`). That list carries a *legacy* `ds_targets` key from the old
  Track tab — a different thing. So targets do not follow her across devices.
- `trkSaveTargets` does `|| TRK_TARGET_DEFAULTS.cal`, so a blank/zero **calorie** field
  silently reverts to 1800. The other four macros accept 0 fine.

### 2. Diagnosed the ingredient-field bug — it was NOT the chat uploads
Saffron's framing was that Claude chat writes the rows wrong. It doesn't. The library
stores each ingredient as **one plain string** (`"15ml fish sauce"`) — that is the
convention across all 334 recipes including hand-entered ones — and the app splits it
into qty/unit/name at **read time** via `parseQty()`.

Root cause: the quantity regex in `_consumeQtyUnit()` required **whitespace** between
the number and the unit:

```js
/^([\d½¼¾⅓⅔⅛][½¼¾⅓⅔⅛\d.\s]*?)\s+(?=[a-zA-Z(])/
```

So `2 tbsp soy sauce` parsed, `15ml fish sauce` did not. On a miss `parseQty` returns
the **entire original string** as the name — hence a filled name box and an empty qty
box. Verified by extracting the real function out of `index.html` into a node harness
and running it, not by reading the regex.

### 3. Measured the blast radius against live Supabase
Reimplemented the parser's match conditions as SQL over all `ingredient_sections`:
- **4,350** ingredient lines total; **650** lose their quantity; **225 of 334 recipes
  (67%)** affected.
- Breakdown: 536 glued-unit (`200ml milk of choice`), 97 numeric range
  (`4–5 garlic cloves`), 17 other.

Damage was **not** confined to the editor boxes: `computeRecipeCost()`
(`index.html:3440`) passes the null qty to `_toBase()`, gets null back, and counts the
line as **unpriced** — so recipe costs have been silently understated wherever a
glued-unit line appears. Price-book lookups also missed, since
`canonicalise("200g milk of choice")` keys on the digits too.

### 4. Found the Python side was already correct
`parse_leading_amount()` in `scripts/normalise_quantities.py:61` handles both shapes:
`\d+(?:\.\d+)?` followed by `\s*` (so `200g` splits), and ranges → **midpoint**. So the
app was the only component out of step. This meant **no script change was needed**, and
it set the choice of range semantics (see Decisions).

### 5. Fixed `_consumeQtyUnit()` and verified
Two additions, both placed **after** the existing fraction and spaced parsers have
already missed, so existing behaviour is untouched by construction.

### 6. Verification (the part worth trusting)
- 26 hand-picked shapes through old vs. new harness: 12 previously-broken now parse,
  7 previously-working unchanged, 7 must-not-grab cases untouched.
- All 16 distinct "other" residual shapes diffed old vs. new: 13 identical, **2
  improved** (`1.5–2 lb …`, `1x 425g can tuna`), **0 regressed**.
- **Regression proof, not a sample:** counted in SQL how many of the 2,887 lines the
  old parser already handled could trigger either new branch. **Zero overlap on both.**
  The change is therefore strictly additive on this corpus.
- Post-fix: **635 of 650** broken lines parse (224 recipes). 15 remain — see Gotchas.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `index.html` | `_consumeQtyUnit()` — added glued-unit branch + range-midpoint pre-pass | Modified | `/home/user/daily-shuffle/` |
| `sw.js` | `CACHE` bumped `daily-shuffle-v44` → `v45` | Modified | `/home/user/daily-shuffle/` |
| `CLAUDE.md` | Added the parseQty/midpoint rule to the quantity-normalisation bullet | Modified | `/home/user/daily-shuffle/` |
| `logs/daily-shuffle_log.md` | This entry | Modified | `/home/user/daily-shuffle/logs/` |

No database writes. `ingredient_sections` untouched — Supabase MCP used **read-only**.

## Decisions & Reasoning
- **Fixed the app parser rather than the uploaded data.** Options: (a) tell Claude chat
  to write `200 g` with a space, (b) migrate the 650 lines, (c) fix `parseQty`. Chose
  (c): the glued form is correct UK convention and already dominant in the library, so
  (a) fights the house style forever and (b) is a destructive rewrite of reviewed data
  that only fixes today's rows. (c) is read-time — **no migration, every existing
  recipe corrects itself on next load**.
- **Ranges → midpoint, not lower bound.** Lower bound is the conservative default I'd
  otherwise pick, but `quantity-normalisation-plan.md` §3 locks **midpoint** and
  `normalise_quantities.py` already implements it. App now agrees with the script.
  Do not "simplify" this to the lower bound later — it would resplit the two.
- **Reused `_UNIT_RE` for the glued branch instead of writing a second unit list.**
  A duplicated list is a guaranteed future drift bug — CLAUDE.md already tracks five
  copies of `canonicalise()` for exactly this reason.
- **Guarded the glued branch with a lookahead + `_UNIT_RE` test** so it only eats digits
  when a *real* unit follows. Keeps it off `200grams`, `7Up`, `2x400g`.
- **Left `cm`, `4 × 100g` and vulgar-fraction ranges unfixed.** 15 lines total; `cm`
  isn't a supported unit anywhere in the app, so "fixing" it means a new unit class —
  scope creep on a parser fix.
- **Did not fix the two Tracker-target caveats.** Real, but she asked a question, not
  for a change; bundling them into a parser PR would muddy it.

## Current State (end of session)
Working. PR **#72** merged into `main`. ship-check clean: 3/3 script blocks parse,
smoke test 5/5, cache bumped, drift script clean. Nutrition step 2 remains **not
applied** — unchanged by this session.

## Next Steps
1. **Open the app and confirm on a real recipe** — the smoke test covers boot/tabs/
   shuffle, it does **not** exercise the editor's qty boxes. Open any recipe with a
   `200g`-style line, hit "✏️ Edit recipe", confirm qty/unit/name land in three boxes.
   Hard-refresh once if the old `v44` cache is still serving.
2. **Expect recipe costs to move.** Glued-unit lines were being dropped as unpriced, so
   per-portion costs were understated. Post-fix figures are the correct ones — don't
   read the change as a new bug.
3. Nutrition step 2 (quantity normalisation) is still the open workstream — unchanged.
   Its next action is still: dump `recipes` via Supabase MCP, run
   `scripts/normalise_quantities.py`, review `quantity_review.csv` before any write.
4. Optional, if she wants them: the two Tracker-target caveats in §1 above.

## Open Questions / Blockers
None blocking. Two deferred items, both logged above and neither started: Tracker
targets not cloud-synced, and the calorie-field `|| default` quirk.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/manual-macro-targets-y9czdf`,
  PR **#72** (merged). Branch name is a leftover from the macro-targets question and
  does not describe its contents — don't be confused by it later.
- `sw.js` `CACHE` now **`daily-shuffle-v45`**. Read the live value from `sw.js`, never
  from this entry.
- Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes`, read-only this session.
- No credentials involved beyond the already-public inlined anon key.

## Notes & Gotchas
- **The 650/225 figures are as measured on 2026-08-23 and will drift** as recipes are
  added. The SQL that produced them is reproducible from the classification in §3:
  a line is "lost" if it starts with a digit or vulgar fraction but matches neither the
  ASCII-fraction nor the spaced-qty pattern.
- **`parseQty` returns the whole input string as `name` on a parse miss.** That silent
  fallback is what made this bug invisible for so long — nothing errors, the line just
  quietly carries its quantity in the wrong field. Worth remembering when debugging any
  future ingredient-field weirdness.
- **`_UNIT_RE` has no `g` flag**, so `.test()` is stateless — the new glued branch
  relies on that. If anyone adds `/g` to it, the glued branch breaks intermittently via
  `lastIndex`.
- **The range pre-pass rewrites `t` before parsing** (`4–5 garlic` → `4.5 garlic`). It
  is deliberately gated on a `(?=\s|[a-zA-Z])` lookahead so it can't fire on
  `70-80% dark chocolate` or `5-spice powder`. Don't loosen that lookahead.
- `"00 flour"` still yields qty null and name `"flour"` — the `00` is eaten and not
  recovered. Pre-existing, unchanged by this fix, and not worth chasing.
- Claude chat was **not** doing anything wrong. If this symptom is ever reported again,
  check `parseQty` before blaming the writer.

---

# Added Alpro Greek Style plain yoghurt alternative to `staple_products` (178 → 179 rows)
**Date:** 2026-08-13
**Project:** Daily Shuffle — nutrition data (staple products)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete.

---

## Project Context
Nutrition-estimation step 1 (`staple_products`) is long done — see the 2026-07-01 entry
"USDA Staple Lookup Built…" for how the 122 USDA rows were seeded. This session is
ordinary upkeep on that table: Saffron pasted a product label and asked for it to be
added. No connection to steps 2/3, which remain where the 2026-08-12 entry left them.

## Session Goal
Add Alpro Greek Style Plain Dairy Free Yoghurt Alternative to `staple_products` from a
pasted label, following the table's existing naming/notes conventions.

## State Before This Session
`main` at `8257bbd` (#70). `staple_products` at **178 rows** — note CLAUDE.md and the
`recipe-db` skill both still claimed "~167", the post-USDA figure; 11 rows had been
hand-added since without either doc being updated.

## What Was Done

### 1. Checked conventions before writing
Queried the live column list rather than trusting the skill doc, then pulled every
yoghurt/Alpro/soya row to copy the house style. Findings that shaped the row:
- **There is no price column** on `staple_products` (id, name, aliases, serving_qty,
  serving_unit, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, gi_estimate,
  flags, notes, timestamps). Nor is there a sodium/salt column — existing rows put
  salt and saturated fat in `notes` free text (e.g. the "Soya yoghurt, plain, no
  sugars — Alpro" row: "Sat 0.4g, salt 0.24g").
- **Naming pattern for branded rows is `<food>, <qualifiers> — <Brand>`** ("Almond milk,
  barista — Alpro", "Soya yoghurt, plain, no sugars — Alpro", "Soy sauce, gluten free,
  reduced sodium — Emma Basic").
- **Flag vocabulary in use** is exactly: `usda_seed` (112), `high_sodium` (6),
  `high_sugar` (5), `nutrition_estimated` (5), `high_fat` (4), `zero_macro` (3),
  `high_sat_fat` (1). There is no `dairy_free`/`vegan` flag and the other Alpro rows
  carry `flags = {}` — so this row does too. Nothing about it is "high" anything, and
  it is label-verified, so `nutrition_estimated` would be wrong.

### 2. Inserted the row
`id e5ccadf0-5302-44c0-983a-422a5321a94e`, per 100 g:
65 kcal · 5.6 P · 2.2 C · 3.3 F · 1.3 fibre · 2.2 sugar. `gi_estimate` null, `flags` `{}`.

Macro cross-check before writing: 5.6×4 + 2.2×4 + 3.3×9 + 1.3×2 = 63.5 kcal vs the
label's 65 — consistent, so the figures were taken as pasted.

### 3. Verified no alias collision
Alias matching in `index.html` is **exact** in `trkFindStapleId()` (line ~5904) and
substring-`includes` in `trkMatchStaples()` (line ~6454), and every alias is also
injected into the AI prompt context by `trkBuildStapleContext()`. So a careless alias
can silently hijack a different product's logging. Ran an explicit collision query
against every other row's name and aliases — **zero collisions**.

### 4. Fixed the stale row count in two docs
CLAUDE.md and `.claude/skills/recipe-db/SKILL.md` both said "~167 rows". Updated to
~179 with a note that it is 167 from USDA plus hand-added label-verified products.
Historical mentions of 167 in this log and in `quantity-normalisation-plan.md` were
left alone — they were true when written.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `staple_products` (Supabase) | +1 row, id `e5ccadf0-5302-44c0-983a-422a5321a94e` | Modified (insert) | project `jsxcctrskkkxgdxfaduo` |
| CLAUDE.md | Data & sync section: staple row count ~167 → ~179 | Modified | /home/user/daily-shuffle/ |
| .claude/skills/recipe-db/SKILL.md | Schema map: staple row count ~167 → ~179 | Modified | /home/user/daily-shuffle/.claude/skills/recipe-db/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

**No app code touched** — `index.html` and `sw.js` are untouched, so **no cache bump**
and no ship-check run (data + docs only, per CLAUDE.md's bump rule).

## Decisions & Reasoning
- **Name `Greek style yoghurt, plain, dairy free — Alpro`**, not "Alpro Greek Yoghurt":
  matches the existing `<food>, <qualifiers> — <Brand>` convention, and keeps it sorting
  next to the other yoghurts rather than under A.
- **Did NOT reuse the aliases `greek yoghurt` / `greek yogurt`**: those are exact-match
  aliases on the *dairy* "Greek yoghurt" row (USDA FDC 2259794, 93.7 kcal). Claiming
  them would make a bare "greek yoghurt" log resolve to whichever row matched first —
  a silent 29-kcal-per-100g error. Used brand-qualified and dairy-free-qualified
  aliases only (`alpro greek`, `alpro greek style`, `alpro greek yoghurt`,
  `dairy free greek yoghurt`, `greek style yoghurt alternative`, `vegan greek yoghurt`).
- **Price went into `notes`, not the price book**: there is no price column on
  `staple_products`, and `pricebook.csv` is an *audited* file whose rows are derived
  from recipe ingredient usage, currently gated on the open price-unit decision
  (`pricebook-audit.md`). Hand-inserting a branded SKU into it would perturb a file
  CLAUDE.md says not to touch unasked, and would not match any recipe ingredient
  string. Recorded "400g pot £2.15 (£5.38/kg) on offer, normally £2.50 (2026-08-13)"
  in `notes` instead and flagged the gap to Saffron.
- **Recorded salt verbatim as `<0.5g`**: that is what the pasted label said. It is
  almost certainly the packaging's "less than" rounding rather than a real 0.5 g
  (comparable Alpro yoghurts are ~0.09–0.24 g), but inventing a tighter number would
  breach the flag-don't-guess rule. There is no salt column so nothing computes on it.
- **Skipped the pre-write review CSV** from the `recipe-db` skill: that rule is scoped
  to bulk writes (>~10 rows). This is a single insert from a label Saffron supplied and
  read back to her in full.

## Current State (end of session)
`staple_products` = **179 rows**, verified by count. The new row reads back correctly
and collides with nothing. The Tracker and `fetchMacroEstimate` both read this table
live and alias-aware, so the product is usable immediately with no app deploy.

## Next Steps
1. Nothing outstanding on this row.
2. If Saffron wants the £5.38/kg figure to actually drive cost features, decide whether
   branded SKUs belong in `pricebook.csv` at all — that is really a sub-question of the
   open "variant = price unit vs Product = grouping" decision in `pricebook-audit.md`,
   which still gates the Apify scrape.
3. Unrelated and still the real next milestone: nutrition step 2 (apply
   `scripts/normalise_quantities.py` against a live `recipes` dump) — see 2026-08-12.

## Open Questions / Blockers
- Should hand-added branded products get a price home at all? Deferred, see Next Steps 2.
- The `<0.5g` salt figure is the label's rounded value, not a measured one. Harmless
  today (no salt column, nothing computes on it); worth correcting if a sodium column
  is ever added.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/alpro-greek-yoghurt-staples-liiqhy`
off `main` @ `8257bbd`. Supabase project `jsxcctrskkkxgdxfaduo`, table
`staple_products`, written via Supabase MCP `execute_sql` (no migration — no schema
change). No cache version bumped. No credentials touched.

## Notes & Gotchas
- **The dairy "Greek yoghurt" row still exists and still owns the bare `greek yoghurt`
  aliases.** Both rows are now in the AI prompt context simultaneously. If a bare
  "greek yoghurt" tracker entry ever resolves to the dairy row when Saffron meant the
  Alpro, the fix is to re-point those aliases — not to add them to both rows.
- CLAUDE.md's row counts for this table have gone stale twice now (167 stated while the
  live table was 178). Treat any row count in a doc as a hint and run
  `select count(*)` — the same warning the workstream section already makes about the
  "8 no-`serves`" figure.

# Hollow-recipe damage CLOSED (all 52 resolved); cup basis unified on 250 ml; ingredient lines now weight-first
**Date:** 2026-08-12
**Project:** Daily Shuffle — data integrity closeout + ingredient display
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. Nutrition step 2 is now unblocked apart from 4 `serves` values.

---

## Project Context
Closes the thread opened by the two 2026-08-05 entries below (hollow-recipe damage found;
fix merged). **Read those for the root-cause analysis** — this entry does not repeat it.
Covers the cup-basis/display work (PR #66) and the verification + closeout after Saffron
re-entered the lost ingredients.

## Session Goal
Two things: unify the app's cup conversion onto the ruleset's 250 ml basis and change the
ingredient line to lead with weight/volume; then verify the re-entry and close the damage
record out.

## State Before This Session
`main` at `829db47` (#66) then `02eed7b` (#65, price-book, from a parallel session). 52
recipes hollow, CLAUDE.md carrying an open "Known data damage" section.

## What Was Done

### 1. Cup basis unified on UK 250 ml + weight-first ingredient lines (PR #66, merged `829db47`)
The app converted cups on a **US 240 ml** basis while the normalisation ruleset uses the
**UK 250 ml** cup from §6 decision 2 — plain flour 125 vs 133 g/cup. Two shipped tables,
disagreeing, one feeding the screen and one feeding the macros.

Because the tables are differently grained (app: ~60 ingredient names; script: ~20 broad
classes) a blanket ×250/240 rescale would *not* have made them agree. Rule applied:
- **Generic member of a script class → adopt that class's exact value** (flour 133,
  sugar 213, syrup 350, paste 263, cocoa 103). Real agreement on the common ingredients.
- **Finer variant the script doesn't distinguish → rescale ×250/240** (almond flour
  96→100, icing sugar 130→135). Collapsing almond flour to a generic 133 would be worse.
- **Empirically measured entries → untouched** (grains, nuts, seeds, cheese, berries).
  Same distinction the plan drew in July. Cheese already agreed at 100.

`_ingToText()` now renders `133g plain flour (1 cup)` — weight/volume, name, original
measure in brackets. Counts stay counts; already-metric lines are left alone; a note
merges into the same bracket (`80g rolled oats (1 cup, jumbo)`).

**Three pre-existing bugs surfaced by that change**, all fixed in the same PR:
- `convertIngredientText()` skipped any line containing `(...cup)`. The new format would
  have **silently disabled the imperial toggle on every converted line**. Narrowed to
  skip only genuine imperial equivalents `(...oz|lb)`.
- `multiplyIngredientText()` matched `FRAC_OUT` on the entry *value* (a glyph) instead of
  the key (a number), so the fraction branch never fired and `¾` rendered as `0.8`.
- The same function swallowed the space before the unit → `2onion` when scaled.

### 2. Verified the re-entry — 50 of 52, and two deliberate deletions
Saffron re-entered the ingredients via a separate Supabase-MCP chat using the prompts in
the previous entry. Verified against live data:
- **0 null ingredient lines library-wide.** Damage cleared.
- All restored lines are plain strings with source quantities intact and **no
  hand-computed grams** — the addendum's central instruction was followed.
- 50 of the 52 restored; **2 were deliberately deleted by Saffron** (hard-deleted, rows
  gone, not `import_status='deleted'`): Maple Cinnamon Pumpkin Overnight Oats
  (@manskis_wellness) and XL Gluten Free Rice Paper Dumplings (glutenfree.asian). Live
  recipe count 332 → 330.
- Checked for dangling references: **no table in the project has a `recipe_id` column**,
  so nothing in `saved_meals` / `food_log` / `day_meta` points at deleted rows. Only a
  client's `ds_recipe_cache` could hold stale copies until it refreshes.
- Line-count reconciliation vs the worklist: 41 exact, 5 longer (extra detail — e.g.
  Chicken Tikka Masala gained a "Cooking Chicken" section), 4 one line short (Green
  Goddess Pasta Salad, No Bake Coconut Cookies, Pad See Ew with Beef, Snickers Overnight
  Oats). **Saffron reviewed and accepted the short ones** — normal re-entry variance.
- Two recipes have empty `ingredient_sections` (Apple & Cinnamon Protein Porridge, Whole
  Roast Chicken) — both `import_status='custom'` from April/May, unrelated to this damage.

### 3. Closed the damage record
CLAUDE.md's "Known data damage" section rewritten from open to **RESOLVED**, with a note
that any future null lines are a *new* regression rather than this one.
`null-lines-reentry.v2.csv`'s `ingredients_recovered` column filled in (99 rows
"re-entered 2026-08-12", 4 rows "recipe deleted 2026-08-12") so the file is
self-describing history rather than an open worklist.

### 4. Worked out the 4 missing `serves` values (proposed, NOT written)
Three of the four already carry per-serve macros, so serves was **back-calculated** from
stored per-serve figures ÷ estimated whole-recipe totals, cross-checked across kcal,
protein, carbs and fat rather than guessed:

| Recipe | Proposed | Basis |
|---|---|---|
| Cat Magic Macro Protein Brownie | **6** | ~990 kcal / 149 per serve ≈ 6.6; ~95 g protein / 15 ≈ 6.3 |
| Pumpkin Pecan Pancakes | **7** | ~1030 kcal / 148 ≈ 7.0; carbs ≈ 7.2; fat ≈ 6.0 |
| Vegan Blueberry Protein Pancakes | **6** | ~845 kcal / 142 ≈ 6.0; carbs ≈ 6.7; fat ≈ 5.0 |
| Grilled Hot Honey Chicken w/ Peach Salsa | **4** (weak) | No quantities and no macros — conventional default only |

**Written and verified** after Saffron confirmed: 4 rows updated (id-scoped, guarded by
`serves is null`), 0 null `serves` remaining across 330 live recipes, none non-positive.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | Cup basis 240→250, `_ingToText()` weight-first, 3 display-path bug fixes | Modified (merged #66) | repo root |
| sw.js | v42 → v43 (#66). Now v44 on main from #65. | Modified (merged #66) | repo root |
| CLAUDE.md | Damage section open → RESOLVED; cup-basis note added in #66 | Modified | repo root |
| null-lines-reentry.v2.csv | `ingredients_recovered` filled — closed out as history | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | logs/ |
| Supabase `recipes` (4 rows) | `serves` filled: 6 / 7 / 6 / 4 | Modified | Supabase `jsxcctrskkkxgdxfaduo` |

One database write this session: the 4 `serves` values above. Everything else read-only.

## Decisions & Reasoning
- **Rejected input-time gram conversion** (Saffron's suggestion) in favour of the display
  change: it would have covered only 52 of 332 recipes, baked a *third* density table
  into the raw text, and destroyed the source measure — grams are derived, text is truth.
- **Class-value adoption over blanket rescale** for the density table: see §1. A ×250/240
  rescale would have left flour at 130 vs the script's 133 — basis fixed, disagreement not.
- **Left the 4 short-by-one recipes alone** — Saffron reviewed and accepted them.
- **Kept `null-lines-reentry.v2.csv` rather than deleting it**, mirroring how v1 was
  treated: the record of what was damaged has value even once the work is done.
- **Did not write the `serves` values** — they're derived estimates, and serves is coupled
  to the stored per-serve macros (see Gotchas). Saffron's call.

## Current State (end of session)
`main` has the fix, the guards, the 250 ml basis and the new ingredient rendering. The
recipe library is clean: 330 live recipes, 0 null ingredient lines, 0 null `serves`.
**Nutrition step 2 is fully unblocked** — nothing is gating it.

## Next Steps
1. **Run step 2**: dump `recipes` via Supabase MCP → `normalise_quantities.py` → review
   CSV → `apply_migration` for the `ingredient_grams` jsonb column → batched writes.
   The `empty_ingredients` / `serves_missing` guards will now catch anything unusable.
2. **Step 3** (bulk nutrition re-population) once step 2 is applied.
3. Unrelated and still open: the price-book Product-family decision from the 2026-08-06
   entry below, which gates the Apify scrape.

## Open Questions / Blockers
- **`serves` for Grilled Hot Honey Chicken is a guess.** It has no quantities and no
  macros, so nothing constrains it. Filling `serves` will *not* make it usable for step 3
  — its real blocker is the `no_quantities` flag, which needs the source recipe.
- **Does "serves" mean people or pancakes?** For the two pancake recipes the stored
  per-serve macros imply serves = number of pancakes (7 and 6), not diners. Kept
  consistent with the stored macros; changing that convention means recomputing them.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`. PR #66 merged (`829db47`). Cache on `main` is **v44**
(#65 bumped past #66's v43). Supabase `jsxcctrskkkxgdxfaduo`, read-only. Sandbox egress to
`supabase.co` blocked — all DB access via Supabase MCP.

## Notes & Gotchas
- **`serves` and the stored per-serve macros are coupled.** Changing `serves` without
  recomputing `calories`/`protein_g`/`carbs_g`/`fat_g` silently makes the per-serving
  figures wrong. This is how the 4 values above were derived in the first place.
- **`Snickers Overnight Oats` has a bare `"peanuts"` line** with no quantity — it will
  come out `unresolved` in the step-2 review CSV. Expected, not a defect.
- **Hard deletes bypass the `import_status='deleted'` convention.** Two rows were removed
  outright this time. Nothing referenced them, but a hard delete leaves no tombstone, so
  a recipe that vanishes from a worklist may simply be gone rather than damaged.
- The display change is untested against the real recipe modal — the smoke test covers
  boot/tabs/shuffle only. Open a recipe with cup measures and try the ×2 and imperial
  toggles.

# Price-book merge + audit — the pipeline shares one price across a whole Product family
**Date:** 2026-08-06
**Project:** Daily Shuffle — product/recipe pricing (Apify price-book stream)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (PR #65 open as draft) — surfaces one decision that blocks the scrape

---

## Project Context
The price-book stream, dormant since 2026-06. See the 2026-06-25 entry ("Apify price-book
pipeline — build, fix, and merge") for the pipeline build and the ASDA-only/mismatch-policy
decisions, and the 2026-06-26 entry ("Ingredient Normalisation, Consolidation & Variant-Level
Price Book") for the data model this session finds the scripts contradicting. Orthogonal to
the nutrition workstream — nothing here touches steps 1–3 or the hollow-recipe worklist.

## Session Goal
Saffron asked where product and recipe pricing stood. After the status answer she asked for
two things in order: (1) merge the stranded verified prices into `pricebook.csv`, (2) audit
the book and cross-reference it against realistic supermarket products — her instinct being
"a lot of variants there are derived from the same item".

## State Before This Session
`main` at `7093165`, no open PRs. Price book unfilled and split across two sheets:
`pricebook.csv` (987 rows, 1 price — Tortilla) and `pricebook.variants.csv` (781 rows, 20
prices from the PR #21 Lidl audit). The app was — and still is — on the original 41-row
hand-entered Lidl seed from 2026-04-06, flag `ds_pb_seeded_v2`; `csv_to_seed.py` has never
run (it bumps the flag to `v3`). The pipeline had been build-complete and waiting ~6 weeks on
one action: Saffron re-running the scrape on her Mac.

## What Was Done

### 1. Status answer
Traced the whole stream: pipeline merged and complete (v2 category-aware matching `1990aff`,
quota detection + `--resume` PR #14), cost engine fully built and wired into the UI
(`computeRecipeCost`, `costTagHtml`, `renderComputedCostHtml`, `_groceryAggregate`, plan cost
label), and **no price data in any of it**. Flagged the two-sheet split as the thing that had
stranded the manual work.

### 2. Merged the 20 verified prices into `pricebook.csv`
All 20 matched exactly one row. Pack sizes reconciled against the app's 2026-04 seed by
**price-match join** — if a `1 each` row carries a price identical to a seed row with a real
pack size, it is the same observation transcribed lossily:
- **8 adopted the seed's size/unit** (Cocoa Powder 500g, Dark Chocolate 100g, Peanut Butter
  Powder 850g, Basil Pesto 250g, Soya Yoghurt 500g, Ketchup 750ml, Spaghetti 500g, Vegan
  Cheese 350g).
- **9 already agreed.**
- **3 kept verbatim** (Sweet Potato £1.18, Butternut Squash £1.45, Potato £0.48) — their
  prices differ from the seed, so they are a separate observation, not a lossy copy.
Verified the csv round-trip was byte-identical before writing, so untouched rows could not be
silently re-quoted. Diff is exactly 20 changed lines; Tortilla untouched.

### 3. The audit — her instinct was right, but the consequence is the reverse
Duplication confirmed and measured: 42 clusters / 46 redundant rows (plurals, prep words),
plus **100 rows (10%) that are not products at all** — parse artefacts like `- 1 Tbsp Maple
Syrup`, `/ 65ml Vegetable Oil`, `½ Tbsp Fish Sauce`. 211 rows have no Product family and are
overwhelmingly these. **But it costs nothing**: only 3 of the 100 reach occurrences ≥ 3, and
`price_pricebook.py` already groups by Product and filters junk — running its own
`select_products()` against the current book still returns exactly **208**, the number
`handoff.md` quotes.

**The real defect is that the pipeline collapses too much, not too little.**
`csv_to_seed.py:build_entries()` keys on `canonicalise(Product)` and `setdefault`s, so the
first priced row in a family sets the price for every variant in it; `price_pricebook.py` has
the same shape upstream and searches `"Oil"`, not `"sesame oil"`. This contradicts the data
model locked on 2026-06-26 — *variant = price unit, Product = grouping only* — established
from Saffron's own master edits. `csv_to_seed.py` is "unchanged since v1" and predates that
correction. **83 of 204 in-scope families, 62% of all ingredient usage.**

Demonstrated concretely by running `build_entries()` against the book as it now stands: Soya
Yoghurt's £0.99/500g would price Greek Yoghurt (72 uses); Vegan Cheese's price would apply to
Feta; a whole lime's 48p would apply to Lime Juice (57 uses).

### 3b. Saffron's refinement — separate the type-variants from the real duplication
On seeing the audit she made the distinction that matters: **variants differing by type
(milk, cheese, yoghurt) are reasonably separate products**; the genuine same-item
duplication is **mostly veg and fruit, especially rows still carrying qty text**. The data
agrees, so the audit now says so explicitly instead of treating "duplicates" as one bucket.

Measured: of 214 Produce/Vegetables rows plus 47 fruit rows filed elsewhere, 37 still carry
quantity/measure text; clustered to their base item, **49 rows / 302 uses fold into 10 base
items**. Citrus dominates (`Lime Juice` 57, `Lime Wedge` 8, `Juice Of 1 Lime` 7, `Lime Zest`
6 — all a lime). In three cases the fragments outweigh the clean row: `Garlic Clove` 110 vs
`Garlic` 72, `Lime Juice` 57 vs `Lime` 18. `Onion` and `Orange` have no clean base row at all.

**The trap, and the reason this is not a find-and-replace:** folding needs a *conversion
factor*, not just a rename. A clove is ~⅒ of a bulb, a wedge ~⅙ of a lime, a stalk is not a
head of celery. Renaming `Garlic Clove` → `Garlic` without a factor prices every clove at
bulb price — ~10× too high on the most-used ingredient in the library. Same class of problem
as `quantity-normalisation-plan.md` solves for recipe lines; the factors belong in the same pass.

### 4. Two secondary findings, both left unfixed on purpose
- `canonicalise()` maps `potatoes` → `potatoe` (the `([^aeiou])es\b → \1e` rule fires before
  the plural-`s` rule), so `Potato` and `Potatoes` are two separate families. Same mechanism
  splits `Carrot`/`Carrots` and `Banana`/`Bananas`.
- `_toBase()` has no `each`↔`g` bridge (only cups→g via density), so an `each` entry silently
  counts as unpriced against any weight-based line. Five rows are dead this way: Sriracha and
  Light Mayonnaise (bottles used in tbsp) plus the 3 produce rows from §2.

### 5. Hand-pricing worklist + terminology safeguard (later in the same session)
Saffron asked for a list of products she could price **in the meantime**, i.e. excluding
anything blocked on an open decision. Generated `pricebook-manual-batch.csv` — reusing
`select_products(rows, 3)` rather than reimplementing scope, then excluding already-priced
families, multi-product families (§3, the open price-unit question) and produce fragments
(§2a, need conversion factors first). **99 rows**, every one resolving to exactly one source
row. Columns are hers: `Product | Pack qty | Measurement convention | Price per item | Price
per measurement | Notes`; `Product` is the **verbatim `Ingredient` string and the join key**,
so corrections go in `Notes`.

Reviewing the output surfaced duplicate pairs my family-level filter could not catch —
they sit in *separate* families. She ruled on six: `Bananas→Banana`, `Zucchini→Courgette`,
`Pak Choi→Bok Choy`, `Date→Medjool Date`, `Red Curry Paste→Thai Red Curry Paste`,
`Ginger Puree→Ginger Paste`. **`Garlic Paste` and `Ginger and Garlic Paste` stay distinct;
the coconut rows are left alone because context decides them.** Batch went 99 → **93**.

### 6. The safeguard — `CANON_TERMS` + `flagCanonTerms()`
She asked for a rule so this doesn't recur on every new recipe. Implemented as a two-tier
split, and **the split is the important design decision**:
- **`parseWithAI` rewrites.** Its output pre-fills a form she reads before saving, so a
  rename is a visible suggestion (listed in the parse status line), not a silent edit.
- **`addRecipe` (manual typing) and `importRecipeIngredientsCsv` only flag**, via
  `flagCanonTerms()` — the save toast and the import's existing confirm dialog list the
  suggestions without changing anything. Neither path has a review step, and the CSV import
  replaces live ingredient lists *and* patches the cloud library.

`CANON_TERMS` is deliberately **app-only and separate from `canonicalise()`** — that one is
duplicated across five files and would re-key the live localStorage price book. Adding a
synonym to `CANON_TERMS` costs nothing elsewhere. Matching is whole-name via
`canonicalise(_stripPrep(name))`, so `banana bread` and `Medjool Dates` are untouched.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| pricebook.csv | 20 verified Lidl prices merged in, 8 with pack sizes reconciled | Modified | repo root |
| pricebook-audit.md | Full audit: book shape, duplicates/junk, the shared-price defect, recommended work order | Created | repo root |
| CLAUDE.md | Added `pricebook-audit.md` to the planning/handoff docs list | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | logs/ |
| pricebook-manual-batch.csv | Hand-pricing worklist, 93 rows, 6 columns, blank for filling | Created | repo root |
| index.html | `CANON_TERMS` map, `canonTerm()`, `flagCanonTerms()`; rewrite in `parseWithAI`, flag-only in `addRecipe` + `importRecipeIngredientsCsv` | Modified | repo root |
| sw.js | CACHE v42 → v43 | Modified | repo root |
| pricebook.variants.csv | Left untouched as the record of the original audit | Unchanged | repo root |

**No database writes.** `index.html`/`sw.js` were changed late in the session (§6) — cache
bumped v42 → v43, full ship-check run and clean.

## Decisions & Reasoning
- **Price-match join for the pack-size reconciliation, rather than adopting seed sizes
  wholesale.** Options: take every seed pack size (fabricates a per-kg price from an
  each-price observation), leave all 20 verbatim (leaves 8 rows unable to price gram lines),
  or split on whether the price matches. Chose the split: an identical price is real evidence
  it is the same observation, a differing price is real evidence it is not.
- **Merged into `pricebook.csv`, not the reverse.** That is what `price_pricebook.py --in`
  defaults to and what `csv_to_seed.py` consumes. `tools-apply-master.mjs` was deliberately
  pointed at the variants sheet so the scraper's book could not be clobbered — correct at the
  time, but it left the manual prices where nothing downstream reads them.
- **Did not restructure the book, split families, or delete the 100 artefact rows.** CLAUDE.md
  forbids regenerating/reordering a committed data CSV without being asked; she asked for a
  merge and an audit, not a rewrite. The artefacts are also genuinely harmless at `--min-occ 3`.
- **Did not fix `canonicalise()`.** It is duplicated across five files and re-keys the live
  `ds_pricebook` in localStorage — that is its own change with its own sync obligations, not a
  drive-by.
- **Wrote the audit to a repo doc rather than only reporting it in chat.** The finding gates a
  decision she has to make away from the keyboard (on her Mac, with the Apify token), and
  chat context does not survive.
- **Flagged rather than fixed the shared-price defect.** Fixing it means changing the price
  unit in both scripts, which takes the scrape from 208 queries to ~365 — a quota decision
  that is hers, and quota exhaustion has already bitten once.

## Current State (end of session)
Branch `claude/product-recipe-pricing-lw72m2`, PR #65 **merged to `main`**. Repo has no CI
(0 checks, expected); no review comments were left. `pricebook.csv` holds 21 prices of 987
rows. `pricebook-manual-batch.csv` holds 93 unpriced rows awaiting Saffron's shelf-label
pass. The app's *prices* are still unchanged — `ds_pb_seeded_v2`, 41 rows, 2026-04-06 — but
the app *code* now carries the terminology safeguard at CACHE v43.

## Next Steps
1. **Decide the price-unit question** (`pricebook-audit.md` §3): does the scrape query 208
   Product families or ~365 variant rows? Everything else waits on this — scraping at the
   family level and then discovering it is wrong burns the Apify quota twice.
2. If the answer is per-variant: change the grouping key in `price_pricebook.py:select_products()`
   and `csv_to_seed.py:build_entries()` from Product to Ingredient, keeping Product as the
   grouping/alias field only. Re-check the quota estimate with `--price-per-1000` first.
3. Fold the 49 produce/fruit fragment rows into their 10 base items **with a conversion
   factor each** (audit §2a); create base rows for `Onion` and `Orange`. Scope it to produce —
   do not let it creep into the milk/cheese/yoghurt families, whose variants are separate
   products. Then reassign the plural-split families `Carrot`/`Carrots`, `Banana`/`Bananas`,
   `Tuna`/`Tinned Tuna` (audit §2) — no code change, improves alias coverage.
4. Confirm pack sizes for the 5 unit-dead rows (audit §5) — Sriracha, Light Mayonnaise, Sweet
   Potato, Butternut Squash, Potato. Five minutes with a receipt.
5. Fill `pricebook-manual-batch.csv` from shelf labels (93 rows, usage-sorted, top of the
   file is worth the most). Pack size/unit must be the real purchasable pack — `1 each` on
   anything measured by weight or spoon is a dead row (`_toBase()` has no each↔g bridge).
   Applying it means merging on the verbatim `Product` key and working the `Notes` column as
   a separate rename pass. **Four rows in it are known junk, left in deliberately for her
   call**: `Milk Choice` (42 uses, a fragment of "milk of choice"), `Salt And Pepper` (24),
   `Salt Pepper` (14), `Pinche Salt Pepper` (10 — "pinche" is a mangled "pinch of").
6. **Then** run the scrape on her Mac (`handoff.md` NEXT STEPS 1–3), then `csv_to_seed.py --apply`.
7. **Do not run `csv_to_seed.py` against the partially-filled book** — with 21 prices it would
   apply Soya Yoghurt's price to Greek Yoghurt and Vegan Cheese's to Feta.

## Open Questions / Blockers
- **The price-unit decision (step 1) is the only blocker**, and it is Saffron's to make — it
  trades Apify quota against pricing accuracy on 62% of ingredient usage.
- Whether the 3 kept-verbatim produce rows are per-item or per-kg observations is unresolved;
  only her receipt or memory settles it.
- Unknown whether she has ever imported a price CSV in-app (Settings → Import price CSV). That
  writes to `localStorage` and is invisible from a sandbox session, so the live in-app price
  book may hold more than the 41-row seed.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/product-recipe-pricing-lw72m2`, PR #65
(merged). No Supabase access this session. Cache bumped v42 → v43.
`node scripts/claude_md_drift.mjs` passes (15 root files documented). Sandbox egress to
`api.apify.com` remains blocked — the scrape is still Saffron-runs-it-on-her-Mac.

## Notes & Gotchas
- **`select_products()` returning exactly 208 is a coincidence worth not over-reading.** The
  book grew from ~811 to 987 rows since `handoff.md` was written, and the number is unchanged
  because it counts *families* and the growth landed in the low-occurrence tail. If the
  price-unit decision goes per-variant, that number jumps to ~365 and `handoff.md`'s "~208"
  becomes stale — update it there.
- **The audit's "83 families affected" is an upper bound.** The heuristic flags any family
  whose variants carry a distinguishing word, which catches false positives like
  `garlic`/`clove` and `vanilla extract`/`pure`. The ~30 in the audit's table are the real ones.
- **Two-tier normalisation is a deliberate split, not an inconsistency.** `parseWithAI`
  rewrites because its output is reviewed before saving; `addRecipe` and
  `importRecipeIngredientsCsv` only flag because they are not. Do not "tidy this up" by
  making all three behave the same — the import path patches the cloud library.
- **`pricebook.variants.csv` is now historical.** Work from `pricebook.csv`. Do not
  re-merge the variants sheet — the 20 prices are already in and a second pass would
  re-introduce the `1 each` pack sizes that were deliberately corrected.

---

# Claude chat Project instructions written (PR #67, draft)
**Date:** 2026-08-07
**Project:** Daily Shuffle — documentation / tooling context
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. Draft PR #67 open, awaiting Saffron's merge.

---

## Project Context
Not a continuation of any workstream — a standalone documentation session. Saffron is
setting up a **Project in Claude chat** (claude.ai, not Claude Code) to handle Daily
Shuffle work that isn't code editing, and needed instructions for its Instructions
field. The nutrition workstream and the hollow-recipe re-entry are untouched by this
session; see the 2026-08-05 entries for their state.

## Session Goal
Produce project instructions for the Claude chat Project — derived from `CLAUDE.md` but
explicitly "won't need to be as in-depth", and scoped to the adjacent (non-code) work.

## State Before This Session
Branch `claude/daily-shuffle-project-instructions-lpdgyc` cut from `main` at `829db47`
("Unify cup basis on UK 250ml; lead ingredient lines with weight/volume", PR #66). No
such document existed in the repo.

## What Was Done
Read `CLAUDE.md` in full, skimmed `BRAND.md` §1 (palette/token structure),
`MONETIZATION.md` §0–§2 (operating rules, ground truth, strategy), and the top of this
log, then wrote `project-instructions.md` at the repo root.

The file wraps the pasteable block in a short preamble stating what it's for and a note
to keep the file and the pasted text in sync — so the repo copy stays the source of
truth rather than drifting silently from whatever is live in the chat Project.

Content decisions are listed below. Nothing was attempted and abandoned; no code, data,
or Supabase table was touched. No `sw.js` cache bump — doc-only change, per CLAUDE.md.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `project-instructions.md` | Pasteable Instructions block for the Claude chat Project, plus preamble | Created | `/home/user/daily-shuffle/` |
| `logs/daily-shuffle_log.md` | This entry | Modified | `/home/user/daily-shuffle/logs/` |

## Decisions & Reasoning
- **Scoped by *audience*, not by depth.** The obvious reading of "less in-depth" is
  "same content, abridged". Rejected: an abridged CLAUDE.md is just a worse CLAUDE.md,
  and it would go stale against the real one. Instead the document is scoped to what a
  session *without the repo* can actually do — planning, copy, content, data review,
  decisions — and explicitly hands repo edits back to Claude Code. Depth follows from
  scope: no dev workflow, no `canonicalise()` sync rule, no ship-check, no gitignore
  list, no per-function AI call-site table.
- **Framed the architectural constraints as deliberate choices.** A chat session
  told "single 350 KB HTML file, no build step, no auth" will reflexively propose
  React/a backend/a login. Added an explicit "treat these as constraints, not problems
  to solve unprompted" line, because that suggestion loop wastes a whole exchange every
  time it fires.
- **Named the docs and told it not to re-derive them.** `MONETIZATION.md` in particular
  is built to be executed, not re-argued (its own §0 rule 1). Repeating its strategy in
  the instructions would invite contradiction between two copies; pointing at it does not.
- **Included an anti-fabrication rule with a stated reason.** "Never invent macros,
  prices, row counts, or version numbers" lands harder with the *because* attached —
  invented figures end up in a database of things she eats. Also matches CLAUDE.md's
  standing "measure, don't trust a number in a doc" instinct.
- **Included the medical-framing boundary** lifted from `MONETIZATION.md` §1 ("built by
  a coeliac, for coeliacs" fine; "manages coeliac disease" not) — relevant the moment
  the chat Project is used for any marketing or listing copy, which is a named use case.
- **Dated the "current state" section and told it to ask if stale.** A chat Project's
  instructions don't auto-refresh; an undated status block silently becomes a lie.
- **Committed to the repo rather than only pasting in chat.** It's project
  documentation, the session had a designated branch, and a repo copy is what makes the
  sync note meaningful.

## Current State (end of session)
`project-instructions.md` committed as `8383d98` and pushed. Draft PR **#67** open
against `main`. Saffron has not yet pasted the block into the chat Project — that is a
manual step outside the repo. Confirmed via the GitHub API that PR #67 has **zero check
runs** (`total_count: 0`), which is expected: the repo has no CI, only the Supabase
keep-alive workflow.

## Next Steps
1. Saffron: review PR #67, then copy everything below the "Instructions (copy from
   here)" heading in `project-instructions.md` into the Claude chat Project's
   Instructions field.
2. Merge #67 (draft — mark ready first).
3. Optional, once the chat Project has been used a few times: fold back whatever the
   chat sessions kept having to be told, and re-sync the repo copy.
4. Unrelated and still the real open work — the 52 hollow recipes
   (`null-lines-reentry.v2.csv`) and nutrition step 2. See the 2026-08-05 entries.

## Open Questions / Blockers
- The exact use-mix of the chat Project is assumed, not stated. The "what this project
  is good for" list (recipe content/re-entry, nutrition thinking, price-book questions,
  marketing copy, brand direction, monetization planning, feature scoping, outreach
  drafts, data review) is my inference from the repo's active workstreams. If Saffron
  had a narrower purpose in mind, that section is the one to trim.
- Unknown whether the chat Project has Supabase MCP access. The instructions assume it
  does **not**, and route all bulk data work to Claude Code. If it does, the "hand it to
  Claude Code" boundary needs loosening for read-only queries.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch
`claude/daily-shuffle-project-instructions-lpdgyc`, draft PR #67, commit `8383d98`,
based on `main` at `829db47`. No cache bump (doc-only). No credentials, env vars, or
Supabase tables involved. Session subscribed to PR #67 activity.

## Notes & Gotchas
- **Two copies now exist by design** — the repo file and the text pasted into the chat
  Project. Nothing enforces the sync (`scripts/claude_md_drift.mjs` checks `CLAUDE.md`
  against the repo, and knows nothing about this file). If a future session edits
  `project-instructions.md`, tell Saffron to re-paste, or the edit is decorative.
- **The "current state" block is dated 2026-08-07 for a reason.** It names the 52 hollow
  recipes and "step 2 not applied". Both of those numbers move. A future session updating
  this file should re-measure rather than copy the figures forward.
- The document deliberately does **not** restate brand hex values, the Supabase project
  ID, or `localStorage` key names. Anything needing that precision needs the repo, which
  means it isn't a chat-Project task in the first place.

---

# Hollow-recipe fix shipped (PR #63 merged); re-entry handoff prompts written; cup-basis conflict found
**Date:** 2026-08-05
**Project:** Daily Shuffle — data integrity follow-through + ingredient display
**Mode:** Rolling Log + GitHub Push
**Status:** Complete. Two things left open and named below (display change; cup basis).

---

## Project Context
Direct continuation of the entry below it (same date, "Hollow-recipe data damage found and
write path fixed"). **Read that one first** — it holds the root-cause analysis, the damage
counts, and the full next-steps list. This entry covers everything after that log commit:
getting PR #63 merged, writing the prompts Saffron will use to re-enter the lost
ingredients in a separate chat, and a display-format discussion that surfaced a real
inconsistency in the codebase.

## Session Goal
Merge the fix, then give Saffron a self-contained way to restore the 52 hollow recipes by
pasting recipe text into a different chat session with Supabase MCP access.

## State Before This Session
PR #63 open as draft at `910fa40`, branch cut from `228f921`.

## What Was Done

### 1. PR #63 merged — but not cleanly, and the cache collision matters
First merge attempt returned 405 merge conflict: **PR #62 had landed on `main`** after this
branch was cut (`016458d`, "Unify unknown-serves default on 2; correct Dark soy sauce").
- Only true conflict was `logs/daily-shuffle_log.md` — both branches prepended an entry.
  Git interleaved them into three conflict hunks. Resolved by reconstructing from the three
  versions programmatically (base body identical in both; concatenate header + my entry +
  their entry + base body) rather than hand-editing markers. Verified: 0 markers left,
  entry dates descending.
- **#62 had independently bumped the cache to v41 — the same value this branch used.** The
  merge auto-resolved silently because both sides said v41, which would have shipped two
  distinct app-code changes under one cache version. Bumped to **v42**. Worth remembering:
  "one bump per PR" is not collision-proof when two PRs are open at once — always re-check
  the merged value against `main`, not against the branch point.
- Checked #62's `index.html` changes for overlap with `patchRecipeToLibrary()` — none; it
  only moves the Add-form serves default 1 → 2.
- Re-ran ship-check on the *merged* tree (parse 3/3, smoke 5/5, drift clean), then squash-merged
  as `7093165`. Session auto-unsubscribed from PR activity; the scheduled check-in fired once,
  confirmed merged, and was closed out rather than re-armed.

### 2. Wrote the re-entry handoff prompts (delivered in chat, not committed)
Saffron will restore the 52 recipes by pasting source text into a separate chat with Supabase
MCP. Produced an opening message for that chat plus a quantity addendum. **These are not in
the repo** — if she needs them again, the substance is:
- **Coordinates**: project `jsxcctrskkkxgdxfaduo`, table `recipes`, column
  `ingredient_sections` only.
- **Match on `name` AND `creator_handle`** — never name alone. Two distinct recipes are both
  called "Carrot Cake Baked Oats" (@dietitianrose, @tracesoats).
- **Verify the row is actually hollow before writing** (every entry null) and STOP if it holds
  real text — the whole failure mode being recovered from is good data being overwritten.
- **Write pattern**: `UPDATE recipes SET ingredient_sections = '<json>'::jsonb WHERE id = '<uuid>'`
  — one row, one column, no upsert, no other tables.
- **Quantity addendum**: do NOT compute grams in that chat. The script does conversion with the
  locked ruleset; hand-computed grams would diverge. Instead, enter text good enough that the
  script never flags it. Only two of the seven `qty_source` categories come back for review —
  `unresolved` (no amount at all, generic item) and `estimated` (amount present but unsizable
  item, or bare item with no amount). `stated`/`converted`/`defaulted`/`to_taste`/`garnish` all
  resolve silently, so "to taste", "to serve", "a handful" are fine as-is. Keep source-stated
  bracketed grams ("1 cup (240g) flour") — highest-confidence input, and it beats the ruleset's
  conversion for US sources. Ambiguous lines get raised with Saffron at input time, batched per
  recipe, rather than months later in a CSV with no source to hand.
- Also gave her the 52 as copy-paste blocks (full detail w/ uuids + sections, and a names+authors-only
  version). Both regenerate from `null-lines-reentry.v2.csv`.

### 3. Saffron asked whether converting to grams at input would be simpler — answered no, with evidence
Her proposal: convert on input so the normalisation script can ignore these recipes; and she
described a preferred display format — *weight/volume or count | ingredient name | original
measure in brackets*. Investigated before answering:
- **The app already does a partial version of this, in the opposite order.** `_ingToText()`
  (`index.html:4866`) renders `qty unit name (note)` and, **for cups only**, appends a converted
  hint via `_toBase()` — e.g. `1/2 cup flour (≈63g)`. Her format is the inverse plus wider unit
  coverage: a change to one function that lands on all 332 recipes.
- **Found a live inconsistency**: the app converts on a **US 240 ml cup** (`_DENSITY_G_PER_CUP`
  comment at `index.html:3154`; `_toBase` falls back to 240 at `:3362`) — plain flour **125 g/cup**.
  The script's ruleset uses the **UK 250 ml cup** locked in §6 decision 2 — plain flour **133 g/cup**.
  Two tables, ~6% apart, already shipped and disagreeing.
- Argued against input-time conversion on three grounds: it covers only 52 of 332 recipes (so the
  library would render in two formats); it would bake in a *third* density table improvised by
  whichever chat did the typing; and it is irreversible — grams are derived, raw text is the
  source of truth, and "133 g flour" cannot be turned back into "1 cup".

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| logs/daily-shuffle_log.md | Merge-conflict resolution (kept both entries) + this entry | Modified | logs/ |
| sw.js | CACHE v41 → v42 after collision with PR #62 | Modified (merged in #63) | repo root |
| (chat only) | Upload-chat opening message + quantity addendum + two recipe list blocks | Not committed | — |

No database writes this session — all Supabase access was read-only. No new files added to the repo.

## Decisions & Reasoning
- **Bumped to v42 rather than leaving the auto-resolved v41**: both PRs independently chose v41,
  so the merge produced no conflict but would have left two different builds sharing a cache key.
  The service worker keys off that constant; a shared value risks the fix never being fetched.
- **Rejected input-time gram conversion** (Saffron's suggestion): see §3 above. Recommended the
  display-layer change instead, which gets her the format she wants across the whole library
  without touching raw data.
- **Recommended unifying the app onto the 250 ml cup basis**, not the reverse: §6 decision 2 is
  signed off and it is the basis that feeds nutrition, so the number displayed should match the
  number behind the macros. Flagged as her call because it changes displayed weights library-wide.
- **Did not commit the handoff prompts as a repo file**: they're single-use scaffolding for an
  external chat, and CLAUDE.md has no home for that category. Substance captured in this entry
  instead, which is the documented handoff surface.

## Current State (end of session)
`main` at `7093165` — hollow-recipe write fix, step-2 skip guards, `null-lines-reentry.v2.csv`
and cache v42 are all shipped and live. The **52 recipes are still hollow**; the fix prevents
new damage but recovers nothing. Saffron has everything she needs to start re-entry in a
separate chat.

## Next Steps
1. **Saffron re-enters the 52 recipes** in a separate Supabase-MCP chat using the opening message
   + addendum (substance in §2 above). Worklist: `null-lines-reentry.v2.csv`.
2. **Decide the cup basis** — unify the app's `_DENSITY_G_PER_CUP` / `_toBase` onto 250 ml to match
   the locked ruleset (recommended), or keep 240 and amend the plan. Blocks step 3 being coherent.
3. **`_ingToText()` display change** — flip to `63 g flour (1/2 cup)` and widen the converted hint
   beyond cups to all convertible units. Counted items ("1 onion") stay as counts. Saffron asked
   for this; awaiting her go-ahead and the step-2 decision.
4. **Fill `serves` on the 4 null-`serves` recipes** (ids in the previous entry's §1) before the
   step-2 apply.
5. Then the step-2 apply session, then step 3 — both gated as described in the previous entry.

## Open Questions / Blockers
- **Cup basis: 240 or 250 ml?** Saffron's call. Not blocking re-entry, but it should be settled
  before the display change ships, because that change puts the converted weight on screen and
  makes the discrepancy visible to her as a cook.
- **Does `_ingToText`'s hint change belong with or without the basis unification?** Recommended
  together; she has not answered yet.
- Everything from the previous entry's Open Questions still stands (recoverability of the lost
  text, unknowable true blast radius).

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`. PR #63 **merged** (`7093165`); branch
`claude/recipe-db-null-values-9vn3k0` restarted from `origin/main` for this log entry, per the
merged-PR rule. Cache now **v42**. Supabase project `jsxcctrskkkxgdxfaduo`, read-only this session.
Sandbox egress to `supabase.co` is blocked — all DB access via Supabase MCP.

## Notes & Gotchas
- **"One cache bump per PR" is not collision-proof.** With two PRs open simultaneously both will
  read the same starting value from `main` and pick the same next number. After merging `main`
  into a branch, re-check the CACHE constant against `main`'s current value, not the branch point.
- **The app and the normalisation script have separate, disagreeing conversion tables.** App:
  `_DENSITY_G_PER_CUP` + `_toBase` (US 240 ml). Script: the plan's §3.3 values (UK 250 ml). This is
  additional to the `canonicalise()` five-copy problem already in CLAUDE.md — if you change one
  density table, check the other.
- The prompts in §2 deliberately instruct the other chat NOT to compute grams. If a future session
  sees hand-entered gram values in these 52 recipes, that instruction was not followed and those
  lines should be treated as suspect against the ruleset.

# Hollow-recipe data damage found and write path fixed — 52 recipes need ingredient re-entry
**Date:** 2026-08-05
**Project:** Daily Shuffle — data integrity (recipes.ingredient_sections) + nutrition step 2
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (PR #63 open as draft) — but leaves a large open manual task

---

## Project Context
Sits on the nutrition-estimation workstream (see 2026-07-01 entries for the 3-step plan and
the §6 sign-off; 2026-08-04 for the CLAUDE.md drift audit that last touched step-2 docs).
This session started as a question about null `serves` and uncovered unrelated, larger
damage to `ingredient_sections`. Nothing here re-opens the §6 decisions.

## Session Goal
Saffron asked whether there was an outstanding task to normalise recipes with null `serves`.
After the answer surfaced a second problem, she approved three follow-ups in order:
(1) add a skip guard to `normalise_quantities.py`, (2) regenerate the null-line re-entry
worklist against live data, (3) trace the July write path so it can't recur.

## State Before This Session
`main` at `228f921`. Step 2 never applied (`ingredient_grams` column does not exist,
0 rows flagged `serves_missing`). Saffron was part-way through reviewing a locally
generated `quantity_review.csv`. She believed the null ingredient lines had been fixed by
re-uploading recipes.

## What Was Done

### 1. Answered the `serves` question — the plan's numbers are stale
Live: **332** recipes (not 327), **4** with null `serves` (not 8) — Cat Magic Macro Protein
Brownie, Grilled Hot Honey Chicken with Fresh Peach Salsa, Pumpkin Pecan Pancakes, Vegan
Blueberry Protein Pancakes with Sticky Toffee Sauce. Not tracked by any GitHub issue. The
"manual serves fill" that plan §6 decision 5 defers to has never happened.

### 2. Saffron's memory was right, and also the number had grown
Of the 36 recipes on `null-lines-reentry.csv`, **32 have been re-entered**. But **52**
recipes are currently hollow, and **48 of them were never on that list**. Every hollow
recipe has *zero* real lines — section titles and array lengths survive, every element is
literal `null`. Grouping by `updated_at`: 07-16 8/10 hollow, 07-19 15/16, 07-20 14/14,
07-22 14/95, 07-23 0/34, 07-24 0/65. A bad write path ran 16–22 July and stopped.
`updated_at` only records the *last* write, so the original blast radius was probably wider
— some recipes were rewritten cleanly on 23–24 July and healed themselves.

### 3. Root cause traced (this is the important bit)
`patchRecipeToLibrary()` (`index.html`, called fire-and-forget from the recipe-edit save)
rebuilt `ingredient_sections` with `currentSection.ingredients.push(ing.item)`. But
`flattenIngredientSections()` (`index.html:1491`) emits `{group, qty, unit, name, note}` —
**there is no `item` key**. Every line became `undefined`, which `JSON.stringify` serialises
as `null` inside an array. `ing.group` *is* populated, which is exactly why section titles
and section boundaries survived intact. The Add-Recipe path at ~line 4650 does
`push(ing.item || ing)` — the `|| ing` fallback is why that path never caused this.

### 4. The quantity pass would have swallowed it silently
`flatten_item()` returns `None` for a null item and `process()` did `continue` — so a hollow
recipe emitted **zero** review-CSV rows and an `ingredient_grams: []`, with no flag and a
clean-looking summary. It reads downstream as "normalised, has no ingredients". Applied
as-is, all 52 would have sailed into step 3. Also found: the script read `serves` at line
418 and **never used it** — plan §6 decision 5 was never implemented either.

### 5. Fixes shipped
- `index.html`: write the structured line (`{qty,unit,name,note}`, minus `group`); **omit**
  `ingredient_sections`/`method_steps` from the PATCH when the local copy is empty (PATCH
  ignores absent columns) so an unloaded or already-hollow recipe can't blank the column;
  added `res.ok` + ⚠ toast (this write was fire-and-forget with only a console.warn).
- `normalise_quantities.py`: `empty_ingredients` + `serves_missing` guards, skipped recipes
  get `ingredient_grams: null` (not `[]`), new `skip_reason` CSV column, explicit summary
  block listing every skipped id. Tested against a 5-case fixture.
- `null-lines-reentry.v2.csv`: 52 recipes / 103 sections / 681 lines, reconciles exactly
  with the DB.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | `patchRecipeToLibrary()` — line rebuild fix, empty-payload guard, res.ok+toast | Modified | repo root |
| scripts/normalise_quantities.py | `empty_ingredients` + `serves_missing` skip guards, `skip_reason` column, summary block | Modified | scripts/ |
| null-lines-reentry.v2.csv | Regenerated re-entry worklist (52 recipes / 681 lines) | Created | repo root |
| null-lines-reentry.csv | Superseded v1 worklist — left untouched as history | Unchanged | repo root |
| sw.js | CACHE v40 → v41 | Modified | repo root |
| CLAUDE.md | Step-2 guard behaviour, CSV list, new "Known data damage" section | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | logs/ |

**No database writes were made this session** — all Supabase access was read-only.

## Decisions & Reasoning
- **New `null-lines-reentry.v2.csv` rather than overwriting v1**: CLAUDE.md forbids
  regenerating a committed data CSV without being asked. Saffron asked, but v1 is also the
  only record of which 36 were originally damaged and which 32 got re-entered — worth
  keeping. v2 is the one to work from.
- **Write the structured object, not a rendered string**: the column already holds both
  shapes (plan §1: 4049 legacy strings, 56 structured objects), and
  `normalise_quantities.py`'s `flatten_item()` handles dicts. Rendering back to text would
  round-trip through `parseQty()` and risk mangling lines it mis-parses.
- **Omit rather than send `null` for empty payload fields**: considered keeping
  `ingredient_sections: null`, but that's precisely the next failure — `flattenIngredientSections()`
  filters blanks, so re-saving an already-hollow recipe would produce an empty sectionMap and
  wipe the section titles too. PATCH ignores absent keys, so `delete` is the safe form.
- **Added `serves_missing` alongside `empty_ingredients`** even though only the latter was
  asked for: same function, same failure mode (silent skip), and it's a locked plan decision
  the script claimed to implement but didn't.
- **Did not fill the 4 null `serves` values**: they need real per-recipe judgement from the
  source, not a guess. Flagged for Saffron.

## Current State (end of session)
Branch `claude/recipe-db-null-values-9vn3k0` at `b2dc099` + this log commit, pushed. PR #63
open as draft, subscribed for activity. Repo has no CI (0 checks — expected), no review
comments. The **write path is fixed but the 52 recipes are still hollow** — the fix stops
new damage, it cannot recover lost text.

## Next Steps
1. **Manually edit-and-save one healthy recipe in the live app** and confirm its
   `ingredient_sections` still holds real lines afterwards. The sandbox blocks egress to
   `supabase.co`, so the fixed write path was never exercised against live Supabase — the
   smoke test covers boot/tabs/shuffle, not a recipe-edit round-trip. Do this before merging.
2. **Re-enter ingredients for the 52 recipes** in `null-lines-reentry.v2.csv`, filling the
   `ingredients_recovered` column from source (`source` column carries the creator handle).
   This is the big manual job; 681 lines.
3. **Fill `serves` on the 4 null-`serves` recipes** (ids in the DB query in this entry's §1).
   Doing this before the step-2 apply lets the pass cover the whole library and makes the
   `serves_missing` flag machinery unnecessary.
4. **Then** run step 2: dump recipes via Supabase MCP → `normalise_quantities.py` →
   review CSV → `apply_migration` for `ingredient_grams` jsonb → batched writes.
5. Step 3 (bulk nutrition) stays blocked, and must additionally skip anything flagged
   `empty_ingredients` or `serves_missing`.

## Open Questions / Blockers
- **Is the ingredient text recoverable from anywhere cheaper than the source?** Checked and
  ruled out: `user_library` holds a single settings/overrides blob dated 2026-04-27, not a
  recipe backup. Supabase free tier has no PITR. If Saffron has a local browser profile with
  a stale `ds_recipe_cache` in localStorage predating 16 July, that would be worth dumping
  before it refreshes — untested, and the cache may already have been overwritten.
- **Was the damage wider than 52?** Unknown and probably unknowable — `updated_at` only holds
  the last write, so recipes damaged then rewritten cleanly are invisible.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/recipe-db-null-values-9vn3k0`, PR #63
(draft). Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes` (read-only this session).
Cache bumped v40 → v41. Self check-in scheduled on PR #63 (trigger `trig_01H3wd4vWpmEVGvGGV7inczt`).
Sandbox egress to `supabase.co` is blocked (curl 403 CONNECT tunnel failed) — all DB access
went through Supabase MCP.

## Notes & Gotchas
- **The `|| ing` fallback is load-bearing.** `index.html` ~4650 has `push(ing.item || ing)`
  and survived; `patchRecipeToLibrary()` had bare `ing.item` and did the damage. If you write
  a third path that rebuilds `ingredient_sections`, do not read `.item` — that key does not
  exist on `flattenIngredientSections()` output.
- **`ingredient_sections` is raw truth** (recipe-db skill: "read-only in practice"). The
  July damage happened because an app save path overwrote it. Any future write to that
  column deserves the same scrutiny.
- **Don't trust the counts in `quantity-normalisation-plan.md` §1** — its "327 recipes / 8
  no-serves / 53 null lines" are all wrong now (332 / 4 / 681). The 53 is suspiciously close
  to the 52 affected *recipes*, so it may have been mis-measured as recipes-not-lines even
  at the time. Measure live before relying on any of them.
- Regenerating `quantity_review.csv` after this change adds a `skip_reason` column. Row order
  is unchanged for a given input dump, so Saffron's in-progress review of normal rows is not
  invalidated.

# Handoff items 2–4 done; the `serves` bug was misdiagnosed — real defect was the Add-form default
**Date:** 2026-08-04
**Project:** Daily Shuffle — nutrition accuracy (recipe path), staple data, doc drift
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (items 2–4). Item 1 **Blocked** — needs Saffron's API key.

---

## Project Context
Direct continuation of the 2026-08-03 entry below ("PR backlog cleared"), whose Next
Steps listed four items. This session took all four. See the 2026-08-02 entries for the
staple corrections and the original low-estimate diagnosis; see `handoff.md` for the
ruled-out causes list.

## Session Goal
Work the four-item handoff list: (1) confirm the low-estimate bug is gone, (2) fix the
`serves` fallback, (3) correct `Dark soy sauce`, (4) fix CLAUDE.md's AI-features list.

## State Before This Session
0 open PRs, `main` at `b4535e7`, CACHE v40. All four items untouched since being
enumerated on 2026-08-03.

## What Was Done

### Item 2 — the `serves` fallback: filed premise was wrong on both counts
The handoff said *"index.html ~L4705 lacks the `|| 2` that L1481 has. Real bug, 8
recipes, small fix."* Checked before editing, and neither half survived:

- **`supabaseRow.serves` can never be null.** It's built at L4665 as
  `parseInt(f-servings) || 1`. Adding `|| 2` at L4710 would have been dead code — it
  would have "fixed" nothing while looking like a fix in the diff.
- **It's 4 no-`serves` recipes, not 8.** And all 4 are April-import rows that never pass
  through that code path at all.

The genuine defect was one function away and worse than the one reported. The
Add-Recipe form hardcodes `value="1"`, and `parseWithAI` returns `servings: null` when
it can't determine a count from a screenshot. `prefillForm`'s `set()` helper is
`if (el && val != null)` — so **null silently leaves the field at 1**. `addRecipe` then
divides whole-recipe macro totals by 1 and stores them labelled per-serving: a 2–4×
overstatement, with nothing on screen to signal it.

Asked Saffron rather than guessing, since the fix changes a visible form default. She
chose "default to 2 everywhere" and asked for the list of unknown-serves recipes.
Unified on the convention the app already used at L1481 (`unknown serves ⇒ 2`) across
six sites: form default (1248), the macro-estimate divisor (4625), `supabaseRow.serves`
(4665), the local-object mirror (4710), `clearForm`'s reset (4752), and
`buildRecipeRow` (5048).

**Deliberately left alone:** `fetchMacroEstimate`'s `Number(servings) > 0 ? … : 1`
(3605), `estimateNutritionWithAI`'s `recipe.servings || 1` (3683), the modal display
fallback (2370) and cost-per-portion (3360). These are *invalid-input* guards on values
already defaulted upstream, not *unknown-serves* defaults. Changing them would silently
halve a caller's explicit intent.

**No existing rows rewritten.** Checked whether the bug had already corrupted data:
86 recipes sit at `serves = 1`, but they're overwhelmingly genuine single-serve items
from the April bulk import (overnight oats, mug cakes, "Single Serve …"). Only 2 were
created after May. Concluded this was a forward-looking risk, not existing damage —
so a backfill would have done harm, not good.

### Item 3 — Dark soy sauce corrected (1 row, applied)
Still carrying tamari's USDA FDC 174278 figures. Not a rounding error — the wrong
*shape*: dark soy is molasses-sweetened, so it's low-protein/high-sugar, the opposite of
tamari. Sourced the Amoy UK label (the standard UK supermarket dark soy) via two
independent web searches that agreed exactly.

60 → **120 kcal**, 10.51 → **1.3 g** protein, 5.57 → **28.6 g** carbs, 1.7 → **24.8 g**
sugars, unit `100 g` → `100 ml`, flags `usda_seed` → `high_sodium, high_sugar`.
7 recipes reference it.

Left `Tamari` and `Soy sauce — generic` alone: FDC 174278 genuinely *is* tamari, and
regular soy sauce is nutritionally close enough that it isn't the same class of error.

### Item 4 — CLAUDE.md AI-features list
Diffed the doc against the live call sites. Replaced the one-line prose list with a
five-row table (`parseWithAI`, `fetchMacroEstimate`, `generatePlanWithAI`,
`trkRunQuickAdd`, `trkRunBulkStaples`), and recorded the total-vs-per-serving contract
inside `fetchMacroEstimate` — the thing most likely to be broken by a well-meaning
prompt edit, and the mechanism behind suspect 1 in `handoff.md`.

### Item 1 — low-estimate bug: NOT confirmed, and cannot be from an agent session
Both tests need a live `api.anthropic.com` call with `ds_api_key`, which lives in
Saffron's browser localStorage. No agent session has it, and it shouldn't. Code-level
review can't settle it either: the prompt at index.html:3617-3629 correctly demands
whole-recipe TOTALS and the JS divides once, so double-division only occurs if the model
disobeys — which is exactly what the empirical test is for. Recorded this in
`handoff.md` rather than leaving the item looking actionable.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | 6 one-token changes unifying unknown-serves on 2 (L1248, 4625, 4665, 4710, 4752, 5048) | Modified | repo root |
| sw.js | CACHE v40 → **v41** (app-code change) | Modified | repo root |
| CLAUDE.md | AI-features prose → table of all 5 live call sites | Modified | repo root |
| handoff.md | Corrected the ruled-out `serves` bullet; recorded item 1 as blocked | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | repo root |
| `staple_products` row `d5004176-…` | Dark soy sauce → Amoy UK label figures | **Updated in Supabase** | project `jsxcctrskkkxgdxfaduo` |

## Decisions & Reasoning

- **Verified the filed bug before fixing it, and reported that it was wrong.** Options:
  apply the one-line change as described (fast, looks done, fixes nothing), or check
  first. Checking cost two SQL queries and one file read, and found both a dead-code
  "fix" and a real 2–4× macro error hiding beside it. The lesson for future sessions:
  the handoff's line numbers were right, its diagnosis wasn't.
- **Asked Saffron before changing the form default.** Adding `|| 2` in JS is invisible;
  changing a visible form default from 1 to 2 is a product decision with a real
  trade-off (genuinely single-serve recipes now need her to type 1). Different answers
  meant materially different diffs, so it was worth one question. She picked 2.
- **Did not backfill the 86 `serves = 1` rows.** Considered it, then read them: they're
  real single-serve breakfasts and desserts. A blanket rewrite to 2 would have halved
  correct macros across ~86 recipes — strictly worse than the bug being fixed.
- **Used the Amoy label rather than a USDA generic for dark soy.** USDA has no clean
  dark-soy entry (that's how it ended up on tamari's row in the first place), the
  sandbox blocks `api.nal.usda.gov` anyway, and Amoy is what's actually in UK
  supermarkets. Two independent searches returned identical figures.
- **Recorded the wheat content in `notes`, not as a new flag.** The existing flag
  vocabulary has no `contains_wheat`, and inventing one for a single row helps nothing —
  whereas `notes` is injected verbatim into the Quick Add prompt, so the model sees it.
- **Left `quantity-normalisation-plan.md` untouched** despite its §6 saying "the 8
  no-`serves` recipes" when it's now 4. Its decisions are signed off and the skill says
  don't reopen them. Flagged in the PR instead.

## Current State (end of session)
Draft **PR #62** open, commit `cbdd7b5`, `mergeable_state: clean`, no review comments,
0 check runs (the only workflow is the schedule-only Supabase keepalive, which runs on
`main`). CACHE **v41**. Subscribed to PR activity.

`staple_products` still 167 rows — one row updated, none added or deleted.

## Next Steps
1. **Merge PR #62** (un-draft first — `merge_pull_request` returns 405 on drafts).
2. **Run the two low-estimate tests** — the only remaining item, and only Saffron can do
   it: (a) open a 4-serving recipe, hit "Re-estimate", check whether it lands ~4× low
   (confirms/kills the double-division suspect); (b) one Quick Add against a
   hand-calculated figure (isolates suspect 2, no-room-to-compute). Re-test *before*
   investigating — every staple correction since 2026-08-02, including Dark soy sauce
   today, pushes estimates up.
3. If confirmed: raise `max_tokens` (currently **256** for the recipe estimate, **1024**
   for Quick Add), enable thinking, make the total-vs-per-serving contract unambiguous.
   `claudeText()` is already in place so a model swap won't break parsing.
4. Nutrition step 2: run `scripts/normalise_quantities.py`, review its CSV, populate
   `ingredient_grams`. Step 3 stays blocked until that lands.

## Open Questions / Blockers
- **Item 1 is blocked on Saffron specifically** — not on information or effort. It needs
  her `ds_api_key` in a real browser. No agent session can close it.
- `quantity-normalisation-plan.md` §6 says 8 no-`serves` recipes; it's 4. Left as-is
  (signed-off doc) but the apply-session should use the live count, not the doc's.
- Still parked, unchanged: the 5 `nutrition_estimated` staples on US-leaning brand
  averages, and `Coconut sugar`'s knowingly-inconsistent 100.0 g carbs.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/low-estimate-recipe-data-yyuwdr`,
  branched from `main` at `b4535e7`. PR **#62**, draft.
- `sw.js` CACHE **v41**. Next bump is v42.
- Supabase project `jsxcctrskkkxgdxfaduo`. Only `staple_products` was written, 1 row.
- ship-check: 3/3 script blocks, 5/5 smoke, `claude_md_drift.mjs` clean.

## Notes & Gotchas
- **The smoke test does not exercise the Add-Recipe form.** It covers boot, tabs and
  shuffle only — so this session's serves change is verified by diff-reading, not by a
  runtime check. First real confirmation will be Saffron adding a recipe.
- **Don't "fix" L4710 again.** `supabaseRow.serves || 2` is now belt-and-braces
  symmetry with L1481, not a live code path — `supabaseRow.serves` is always ≥ 1. A
  future reader may flag it as redundant; it is, deliberately.
- **`prefillForm`'s `set()` skips null.** `const set = (id, val) => { … if (el && val
  != null) … }`. Any future AI-parsed field that can legitimately come back null will
  hit the same silent-stale-default trap this bug came from. Worth remembering before
  adding fields to the parse schema at L5434.
- **Dark soy sauce is not coeliac-safe.** It contains wheat. The corrected row says so
  in `notes` and names tamari as the swap, but the 7 recipes using it were never
  audited for that — separate question, not raised this session.

---

# CLAUDE.md drift audit run manually — 3 judgement-level drifts from PR #36, all invisible to the drift script
**Date:** 2026-08-04
**Project:** Daily Shuffle — doc accuracy (CLAUDE.md weekly audit)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (PR #61 open as draft)

---

## Project Context
The weekly CLAUDE.md accuracy audit — a scheduled routine (trigger
`trig_012FVP34K8kH664FDZayj6Lb`, "Weekly CLAUDE.md drift audit (daily-shuffle)", cron
`0 7 * * 1`, last fired 2026-08-03). It pairs a mechanical script
(`scripts/claude_md_drift.mjs`) with a judgement-level review of the week's merges. See
the 2026-08-03 entry below for the PR-backlog session that merged the commits this audit
reviewed.

## Session Goal
Saffron asked to run the drift-detection task manually rather than wait for Monday's
firing. Identify her meaning, run the audit end-to-end, and ship any fixes.

## State Before This Session
`main` at `b4535e7`. The routine last fired 2026-08-03 at 07:07 UTC — *before* PR #36 was
merged (`cc615a5`, 2026-08-04 06:24 BST), so the newest merge on `main` had never been
audited. Branch `claude/claude-md-drift-detection-pbgymc` existed on origin but was
identical to `main` (zero commits ahead).

## What Was Done

### 1. Identified the task from the trigger list
"The CLAUDE.md drift detection task" was ambiguous between the script and the routine.
Listed the account's triggers and found the weekly routine, whose stored prompt is the
actual three-step procedure. Followed that prompt, with one deviation: it says to create
`claude/claude-md-refresh-YYYYMMDD`, but this session had a designated branch
(`claude/claude-md-drift-detection-pbgymc`), so the work went there instead.

### 2. Mechanical check — clean, and that's the interesting part
`node scripts/claude_md_drift.mjs` passed all five checks (5 tabs, 9 scripts, 13 root
files, 5 `canonicalise()` copies, 3 sw.js hosts). But `normalise_quantities.py` — merged
the day before — was **not mentioned in CLAUDE.md at all**. The script's rule 2 accepts a
`scripts/` file documented in `scripts/README.md` **or** CLAUDE.md, and #36 documented it
in the README only. Not a bug (the rule is deliberate — most script detail belongs in the
README), but it means a new script can land with CLAUDE.md's own prose about `scripts/`
left wrong, and only the judgement pass catches it.

### 3. Judgement-level review — 3 drifts, all from `cc615a5` (PR #36)
- **"two standalone Python 3 pipelines"** → there are now three. Added a
  quantity-normalisation bullet, and split the "Both are build-only, run locally by
  Saffron" sentence to "Those two", because `normalise_quantities.py` is genuinely
  different: stdlib-only with **no external network**, so it *can* run in an agent session
  on a Supabase-MCP dump. Leaving it under the blanket "never run these from an agent
  session" rule would have mis-instructed the session that eventually applies step 2.
- **Nutrition step 2** read "approved, **not applied**" with no hint the apply script now
  exists — a future session would have re-derived or rewritten it. Now "approved, script
  written, **not applied**", naming the script and stating it has never been run against
  live data. The step-2 → step-3 gate is deliberately unchanged.
- **gitignore list** omitted the script's three outputs.

### 4. Verified accurate, no edit (recorded so the next audit doesn't re-check)
sw.js network-first + 3 passthrough hosts; AI features (`api.anthropic.com/v1/messages`,
`claude-haiku-4-5-20251001`, direct-browser header) — `29008c3` only changed response
*parsing*, not any documented fact; tabs; Supabase tables/conventions; `ds_*` key
families; `canonicalise()` sync list. `93bb7e5` (staples search), `1c81f90` (cuisine tags)
and `2cd36be` (null-ingredient filter) are UI changes touching no documented fact.

Re-ran the drift script after editing — still clean.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| CLAUDE.md | scripts/ overview (2→3 pipelines + network-access split), step-2 status, gitignore list | Modified (`839ffc5`) | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | logs/ |

## Decisions & Reasoning
- **Used the designated session branch, not the routine's `claude/claude-md-refresh-*`
  name**: the session's branch instruction is explicit and the routine's naming is
  incidental to what it produces. Same content either way.
- **Did not "fix" the drift script to require CLAUDE.md mentions for scripts/ files**:
  that would force every script's detail into CLAUDE.md and fight the README split the
  repo already uses. The routine's judgement pass is the right layer for this. Noted here
  as a known limitation rather than patched.
- **Did not change the step-2 → step-3 gate**: the script existing is not the same as the
  ruleset being applied. The 2026-08-03 entry verified #36 lands no data. Wording moved to
  "script written, not applied" and no further.
- **No sw.js cache bump**: doc-only change, per CLAUDE.md's own rule.
- **Recorded no version numbers in CLAUDE.md**: the routine prompt forbids it (read
  `CACHE` from `sw.js` — currently v40 — never from a doc). The dated reference to #36's
  merge is a historical fact, not a live value.

## Current State (end of session)
Branch `claude/claude-md-drift-detection-pbgymc` pushed, one commit ahead of `main`
(CLAUDE.md) plus this log commit. **PR #61** open as a draft. No PR CI exists in this repo
(only the `main`-scheduled Supabase keep-alive), so nothing to wait on; no review comments.
A ~60-minute self check-in is armed (`trig_01CqYGUGiqxuNfN4qqpxuxXe`) and will re-arm
silently until the PR is merged or closed.

## Next Steps
1. Merge PR #61 (draft; doc-only, no CI to wait for).
2. Next Monday's routine firing (2026-08-10 07:00 UTC) will re-audit — nothing to prepare.
3. Unchanged from 2026-08-03: nutrition step 2 is still unapplied. The apply session must
   dump `id/serves/ingredient_sections` for the 317 non-deleted recipes with `serves` via
   Supabase MCP, run `python3 scripts/normalise_quantities.py recipes_dump.json
   quantity_review.csv ingredient_grams_updates.json`, review the CSV, *then* write the
   `ingredient_grams` jsonb column. Step 3 stays blocked until that's done.

## Open Questions / Blockers
- Should `claude_md_drift.mjs` gain a check that a new `scripts/` file also appears in
  CLAUDE.md when CLAUDE.md states a count of pipelines? Deliberately not done this session
  (see Decisions). Worth 10 minutes if this drift recurs.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/claude-md-drift-detection-pbgymc`,
PR #61. No cache bump (sw.js untouched, still v40). No credentials in play. Routine trigger
IDs: weekly audit `trig_012FVP34K8kH664FDZayj6Lb`; this session's PR check-in
`trig_01CqYGUGiqxuNfN4qqpxuxXe`.

## Notes & Gotchas
- **A clean `claude_md_drift.mjs` run does not mean CLAUDE.md is accurate.** It checks five
  mechanical inventories only. All three drifts this session passed it. Don't let
  `ship-check`'s green drift line stand in for reading the doc.
- The routine's stored prompt says to end quietly with no branch/commit/PR **only if
  nothing is stale**. Something was stale here, so the PR is correct behaviour, not noise.
- `normalise_quantities.py` is now the one script in `scripts/` that an agent session may
  run. Don't re-generalise the "never run these from an agent session" rule back over it.

---

# PR backlog cleared — 6 merged including a split of the 2-month-old RLS PR; open-PR count 6 → 0
**Date:** 2026-08-03
**Project:** Daily Shuffle — repo hygiene (PR backlog), plus a full outstanding-work inventory
**Mode:** Rolling Log + GitHub Push
**Status:** Complete

---

## Project Context
Third and final entry from the 2026-08-02/03 conversation — see the two entries below for
the staples rename + search work and the nutrition corrections + parse fix. This entry is
almost entirely repo hygiene: Saffron asked to "merge PRs to main", which surfaced **five
stale PRs from earlier sessions** nobody had closed out, going back to 2026-05-30.

## Session Goal
Merge the open PRs, and enumerate what's actually left outstanding on the project.

## State Before This Session
`main` carried PRs #57 and #58 (merged in the entry below). PR #59 (session log +
`handoff.md` bug note) was open as a draft. **Unnoticed until now: five further PRs were
also open** — #5, #14, #36, #45, #56.

## What Was Done

### 1. Scope check before merging anything
"Merge PRs to main" was ambiguous once six PRs turned out to be open rather than one.
Merged **#59** immediately (unambiguously this session's work), then **stopped** and
test-merged the other five locally against current `main` to produce real information —
conflicts, file lists, ages — before asking. Saffron chose "all five, but split #5".

### 2. PR #5 split — the one that needed judgement
Opened 2026-05-30, still not a draft, bundling **two unrelated changes**:

- **KEPT** — `index.html`: `flattenIngredientSections` skips null/blank ingredient items.
  Verified against `main` that this was **still needed** (no such filter existed), so
  recipes whose ingredient text was lost on import were still rendering a literal `"null"`
  line per item, two months on.
- **DROPPED** — `supabase/migrations/20260530092223_enable_rls_recipes_readonly_user_library_rw.sql`.
  Checked `pg_policies` against the live project first: `recipes` currently grants anon
  **SELECT + INSERT + UPDATE**. The migration documents anon *read-only*, which is simply
  not the live state — and applying it would break in-app recipe add/edit/soft-delete
  syncing. CLAUDE.md also says not to change RLS in passing. Removed from the branch and
  the reason recorded in the merge commit rather than merged as a dormant footgun.

### 3. The other four
- **#14** (2026-06-25) — `price_pricebook.py` quota detection + `--resume`. Clean, merged.
- **#45** (2026-07-19) — log correction only. Clean, merged.
- **#56** (2026-08-02) — log conflict. Merged after resolution.
- **#36** (2026-07-01) — log conflict; payload is `scripts/normalise_quantities.py`.
  **Verified before merging that it lands no data**: stdlib-only, zero network or DB calls,
  so the nutrition step-2 gate is untouched. Also confirmed `claude_md_drift.mjs` stayed
  clean with the new script present (9 scripts, all documented).

### 4. Log-conflict resolution method
Both conflicts were purely prepend-ordering — each branch and `main` had added entries at
the top. Everything in #56's conflict was dated **2026-08-02**, so date alone couldn't
order them; used **the PRs each entry describes** instead. The japchae entry covers PR #53
and the Asian-cuisine entry above it covers #54/#55, so japchae slots below it. For #36,
"Ruleset Applied" sits above "§6 Decisions Signed Off" because sign-off precedes apply.
Resolved by script (extract entry, insert at anchor) rather than by hand, then verified
zero conflict markers and 23 intact headings.

### 5. Outstanding-work inventory
Saffron asked what else is open. Produced a full inventory — reproduced in Next Steps and
Open Questions below so it doesn't have to be re-derived.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | `isBlank` null-ingredient filter in `flattenIngredientSections` (from #5) | Modified (merged, `2cd36be`) | repo root |
| sw.js | CACHE v39 → **v40** (#5 is an app-code change) | Modified (merged) | repo root |
| scripts/normalise_quantities.py | Nutrition step-2 apply script — lands unused | Added (merged, `cc615a5`) | scripts/ |
| scripts/price_pricebook.py | Apify quota detection + `--resume` | Modified (merged, `61a9a92`) | scripts/ |
| scripts/README.md, .gitignore | Updated alongside #36 | Modified (merged) | repo root / scripts/ |
| logs/daily-shuffle_log.md | 2 conflict resolutions + this entry | Modified | repo root |
| supabase/migrations/…enable_rls_recipes_readonly….sql | RLS lockdown migration | **Deleted before merge** — see Decisions | was on branch `claude/recipe-null-supabase-GnoDV` |

## Decisions & Reasoning

- **Merged #59 first, then paused to ask.** Options were: merge all six, merge only #59,
  or ask. "Merge PRs to main" plural could reasonably mean either, and five of the six
  were months-old work from other sessions with real risk in at least one. Splitting it —
  land the unambiguous one, gather concrete data on the rest, then ask — meant progress
  without an irreversible guess.
- **Test-merged all five locally before asking.** Turned "shall I merge these?" into a
  question with a table attached: which merge clean, which conflict, on what files. Cost
  ~30 seconds and made the decision answerable in one reply.
- **Dropped #5's RLS migration rather than merging or closing the whole PR.** Options:
  merge whole (ships a footgun), close whole (loses a live bug fix), or split. Checked the
  live policies first, which showed the migration contradicts reality — so splitting was
  clearly right rather than a judgement call.
- **Merged #36 despite the nutrition step-2 gate.** The gate is about *writing
  `ingredient_grams`*, not about the script existing. Verified no network/DB calls, so
  merging changes nothing operationally and gets the script out of a stale branch.
- **Ordered conflicting log entries by the PRs they describe, not by date.** Every entry
  in #56's conflict was 2026-08-02; PR numbers gave a total order where dates gave a tie.

## Current State (end of session)
- **0 open PRs** (was 6).
- `main` verified after all merges: 3/3 script blocks, **5/5 smoke**, no CLAUDE.md drift,
  0 conflict markers in the log, 23 log headings intact.
- CACHE **v40**. `staple_products` 164 rows, unchanged this session — **no database writes
  were made at any point**.

## Next Steps
1. **Confirm the low-estimate bug is actually gone** (see `handoff.md`) — add a recipe,
   run a Quick Add, compare against a hand-calculated figure. If gone, delete the note.
2. **Fix the `serves` fallback**: `index.html` ~L4705 `servings: supabaseRow.serves` lacks
   the `|| 2` that L1481 has. Real bug, affects the 8 no-`serves` recipes.
3. **Correct `Dark soy sauce`** — it still carries tamari's figures (shared FDC 174278).
   Never fixed because Saffron said to disregard the soy sauces in that collision group.
4. **Fix CLAUDE.md's AI-features list** (details in Open Questions).
5. Nutrition step 2: run `scripts/normalise_quantities.py` (now on `main`), review its CSV,
   then populate `ingredient_grams`. Step 3 stays blocked until that lands.

## Open Questions / Blockers
- **CLAUDE.md's AI-features list is wrong in three ways**, enumerated this session by
  diffing the doc against the five live `api.anthropic.com` call sites. It names
  **"pantry item parsing"**, which is dead (Pantry lives in `legacy/`, not loaded), and
  omits **`fetchMacroEstimate`** (recipe macro estimation) and **`generatePlanWithAI`**
  (Shuffle-tab plan generation). `claude_md_drift.mjs` does not catch this class — it only
  checks tabs, script files, root data files, canonicalise copies and sw.js hosts.
  Notably `fetchMacroEstimate` is the feature Saffron reported as producing bad numbers,
  and it isn't in the docs at all.
- Still parked, unchanged: the low-estimate bug (`handoff.md`), the 5
  `nutrition_estimated` staples sourced from US-leaning brand averages, and `Coconut
  sugar`'s knowingly-inconsistent 100.0 g carbs.
- `MONETIZATION.md` remains an untouched separate track with its own gates.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`. Merged this session: **#59** `6cad58c`,
  **#5** `2cd36be`, **#14** `61a9a92`, **#45** `1d107f0`, **#56** `af6e9b4`, **#36** `cc615a5`.
- This entry's branch: `claude/ai-model-product-naming-1c1nd4`, restarted from `main` again
  after #59 merged (second restart of the same branch name this conversation).
- `sw.js` CACHE **v40**. Next bump is v41.
- All five stale PRs were **drafts except #5** and had to be un-drafted before merging —
  `merge_pull_request` returns `405 Pull Request is still a draft` otherwise.

## Notes & Gotchas
- **Do not resurrect the dropped RLS migration** without re-checking `pg_policies` first.
  As of 2026-08-03 `recipes` grants anon SELECT + INSERT + UPDATE, and the app depends on
  those writes for custom recipes. The migration's read-only policy would break them.
- **`sw.js` has never had a v38.** It was consumed resolving the #57/#58 conflict and never
  landed on `main`: the sequence is v37 → v39 (#58) → v40 (#5). Don't "fix" the gap.
- **The five stale PRs had base SHAs up to 2 months old**, yet only two conflicted, both on
  the log file. `index.html` auto-merged cleanly in #5 despite the age gap — but that is
  luck, not a guarantee; always verify the merged result rather than trusting a clean
  auto-merge (checked here: `isBlank` present, 6 `claudeText` sites, 3 `trkMatchStaples`).
- When a log-file conflict has entries sharing one date, order by the **PR numbers the
  entries describe**. This will recur — the log is the single most conflict-prone file in
  the repo because every session prepends to it.

---

# Nutrition corrections applied, `claudeText()` parse fix shipped, both PRs merged, low-estimate bug diagnosed
**Date:** 2026-08-02
**Project:** Daily Shuffle — `staple_products` nutrition data, the embedded-AI response-parse path, and the AI macro-estimate accuracy investigation
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (one bug parked as possibly-resolved — see Open Questions)

---

## Project Context
Direct continuation of the entry below (same day, same conversation). That entry covers
the staples search UI, the 158-row rename, and the collision resolution; it also left
**8 rows flagged `nutrition_unverified`** and the model change **scoped but not built**.
This entry covers everything after that point. Read both together.

## Session Goal
1. Apply the nutrition data Saffron supplied for the 8 flagged staples.
2. Recommend on the model change, and ship the prerequisite parse fix as its own PR.
3. Merge both PRs to `main`.
4. Diagnose the reported "AI nutrition estimates are wrong" problem.

## State Before This Session
Per the entry below: `staple_products` at 163 rows, renames applied, 8 rows flagged
`nutrition_unverified`, PR #57 (staples search) open as a draft, model change scoped only.
It had also been established that **no nutrition data can be sourced from an agent
session** — USDA and Open Food Facts are both 403 at the egress gateway.

## What Was Done

### 1. Nutrition data applied — but only 5 of the 8 rows
Saffron supplied figures for all 8 flagged products. **Diffing them against what was
stored changed the answer: 3 didn't need changing at all.**

**Tamari, Brown sugar and Red pepper flakes were the *legitimate* owners of their USDA
records** — FDC 174278 is literally *"Soy sauce made from soy (tamari)"* and FDC 168833
is *"Sugars, brown"*. Their **twins** were the borrowers (`soy sauce`/`dark soy sauce`
from tamari; `coconut sugar` from brown sugar). The previous entry's flagging was too
broad. Applying the supplied figures would have made those three *worse* — rounder
numbers, and fibre zeroed (tamari 0.8 g, red pepper flakes 27.2 g). Values kept, flag
cleared only.

The 5 that genuinely changed: **Coconut sugar** (was brown sugar's figures),
**Gochugaru** (was cayenne's), **Vanilla paste** (was vanilla *extract*, 12.7 → 65 g
carbs), **Dark chocolate chips** (was the chocolate *bar*), and **Chicken stock**
(36 → 270 kcal/100 g).

`Chicken stock` was **renamed to `Chicken stock cube`** — the figures changed from
made-up stock to cube, a ~7.5x jump, so without "cube" in the name a 100 g log would be
silently catastrophic. Tagged `high_sodium` (~13,000 mg/100 g).

`usda_seed` was **stripped from all 5** — their figures are brand-label averages now, so
that provenance flag had become false. They carry `nutrition_estimated` instead.

### 2. PR #58 — `claudeText()` parse fix
Shipped separately from any model change because it's a correctness fix on its own.
All five call sites parsed `data.content?.[0]?.text`, which holds on Haiku (no thinking
blocks) but breaks on Sonnet 5 / Opus 5, where adaptive thinking is on by default and
`content[0]` is a `thinking` block. Added `claudeText(data)` — finds the first `text`
block — at top level of script block 1, so it's global in block 2 the same way
`showToast()` already is. Unit-tested against 6 response shapes.

### 3. Both PRs merged to `main`
#57 first (`93bb7e5`), then #58 (`29008c3`). **The `sw.js` conflict predicted in the PR
body did occur** — both branches changed line 6 from v37 (#57→v38, #58→v39). Resolved to
**v39**. `index.html` auto-merged cleanly (different regions), and this was verified
post-merge rather than assumed: 6 `claudeText` sites, 3 `trkMatchStaples` refs, 0
old-style parses, 3/3 script blocks, 5/5 smoke, no CLAUDE.md drift.

### 4. Low-estimate diagnosis (the substantive investigation)
Saffron reported estimates skewed **low** in *both* `fetchMacroEstimate` and
`trkRunQuickAdd`. That direction + both-paths combination was decisive — it ruled out
two candidates and left two. Full write-up is now in `handoff.md`; summary in Open
Questions below. By the end she judged it may already be resolved by the nutrition
corrections in step 1 (which all push estimates *up*), so it was parked rather than fixed.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | `claudeText()` helper + all 5 call sites routed through it | Modified (merged, `29008c3`) | repo root |
| sw.js | CACHE v37 → **v39** (v38 claimed by #57, conflict resolved on merge) | Modified (merged) | repo root |
| handoff.md | New "AI nutrition estimates skewed low" entry — ruled-out causes, live suspects, the one-click test | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | repo root |
| Supabase `staple_products` | 5 rows re-nutritioned + 1 renamed; 3 flag-cleared only; `usda_seed` stripped from the 5 | Modified | project `jsxcctrskkkxgdxfaduo` |

## Decisions & Reasoning

- **Only 5 of 8 nutrition rows updated.** Options were: apply all 8 as supplied, or diff
  first. Diffing showed 3 would have been *degraded*. Verifying supplied data against
  what's stored, rather than trusting the request, is what caught it.
- **Parse fix shipped as its own PR, before any model change.** It changes nothing on
  Haiku, so it can merge with zero risk, and it removes the tripwire ahead of time. Had
  the model been swapped first, four of the five sites would have failed with messages
  ("No products recognised", "Unexpected format from AI") that read as model regression —
  a near-certain false rollback.
- **CACHE resolved to v39, not v38.** The constant only has to *change* to bust the
  cache; contiguity is not required, so skipping 38 on that line is harmless and avoids
  renumbering a merged commit.
- **`Chicken stock` renamed rather than just re-numbered.** A silent 7.5x change in what
  "100 g" means is a data trap; the name now carries the warning.
- **Model recommendation: Sonnet 5, not Opus 5.** Cost is immaterial at this volume
  (~2¢ vs ~4¢ vs ~10¢ for the largest call). Opus 5's edge is long-horizon agentic work;
  these are single-turn bounded extractions, which is Sonnet 5's sweet spot. Paying 5x
  for an unexercised capability profile is a bad trade.
- **Bug parked, not fixed.** Saffron's call — she believes the nutrition corrections may
  have resolved it. Documented thoroughly in `handoff.md` instead, including the two
  *ruled-out* causes so a future session doesn't re-derive them.

## Current State (end of session)
- `main` carries both merges. CACHE **v39**. JS parse 3/3, smoke 5/5, no CLAUDE.md drift.
- `staple_products`: **164 rows** — 163 after this session's work, plus **Konjac noodles**,
  which Saffron added herself via the app on 2026-08-03 and which already fits the new
  naming convention unaided (a small signal the convention is self-sustaining).
- 0 rows `nutrition_unverified`; 5 `nutrition_estimated`; 113 `usda_seed`.
- Model change: **recommended and scoped, not implemented.** Parse-fix prerequisite done.

## Next Steps
1. **Confirm whether the low-estimate problem is actually gone.** Add a recipe and run a
   Quick Add; compare against a hand-calculated figure. If gone, delete the `handoff.md`
   entry. If not, go to step 2.
2. If it persists on the **recipe** path: open a 4-serving recipe, hit re-estimate, and
   check whether it lands ~4x low. That one click confirms or kills the double-division
   hypothesis outright.
3. Fix the `serves` fallback at `index.html` ~L4705 (`servings: supabaseRow.serves` has no
   `|| 2`, unlike L1481) regardless of the above — it's a real bug affecting the 8
   no-`serves` recipes, just not the one reported.
4. Optional: the model swap itself (5 model strings + `thinking`/`max_tokens`). Must also
   update `CLAUDE.md:113` and the `index.html` "claude-haiku call pattern" comment, and
   bump CACHE.

## Open Questions / Blockers
- **The low-estimate bug is parked as possibly-resolved.** Full detail in `handoff.md`;
  the short version: *ruled out* — the `serves` bug (skews high, recipe path only) and
  truncated JSON (`trkParseJsonLoose` ends in a strict `JSON.parse`, so it throws rather
  than dropping items). *Live suspects* — double division on the recipe path, and no room
  to compute on both (measured: **~7,200 tokens** of staples injected into Quick Add,
  **~4,400** into the recipe estimate, against `max_tokens` of 1024 and **256**).
- **CLAUDE.md's AI-features list is still drifted** (carried over from the entry below,
  not fixed): it names *"pantry item parsing"* (pantry lives in `legacy/`, not loaded) and
  omits `fetchMacroEstimate` and `generatePlanWithAI`, both live. `claude_md_drift.mjs`
  does not catch this class. Fix when this area is next touched.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`. Merged: **#57** (`93bb7e5`), **#58** (`29008c3`).
- This entry's branch: `claude/ai-model-product-naming-1c1nd4`, **restarted from `main`**
  after #57 merged, per the merged-PR-is-finished rule — so its new PR is a *new* PR.
- `sw.js` CACHE **v39**. Supabase project `jsxcctrskkkxgdxfaduo`, `staple_products` 164 rows.
- Both Supabase and GitHub MCP servers disconnected and reconnected mid-session, twice,
  under changed tool prefixes — re-load via ToolSearch if tool calls start failing.

## Notes & Gotchas
- **Do not re-flag Tamari, Brown sugar or Red pepper flakes as needing nutrition.** They
  are the correct owners of their USDA records. The rows that were borrowing from them
  (`Soy sauce — generic`, `Dark soy sauce`, `Coconut sugar`) are the ones to scrutinise —
  and note **`Dark soy sauce` still carries tamari's figures** and was never corrected,
  because Saffron said to disregard the soy sauces in that group.
- **`Coconut sugar` carries a knowingly inconsistent figure**: carbs **100.0 g/100 g**
  against 378 kcal (100 g of carbs ≈ 400 kcal, and leaves no room for moisture/ash).
  ~94 g would be consistent. Applied verbatim as supplied rather than silently overridden;
  the discrepancy is ~2.4 kcal at typical 10 g usage. Recorded in the row's `notes`.
- **`Gochugaru` and `Dark chocolate chips` kept fibre carried over from their old USDA
  records** (27.2 g and 6.5 g) — the supplied data had none. Flagged in each row's `notes`.
  Don't mistake those for verified figures.
- **The staples context injected into Quick Add includes every row's full `notes` text**
  (`trkBuildStapleContext`), which is why it is ~1.6x the size of the recipe-path context.
  This session's long explanatory notes therefore have a direct token cost on every
  Quick Add call — worth remembering before writing more prose into `notes`.
- `sw.js` CACHE is at **v39**, not v38 — v38 was consumed by the #57/#58 conflict
  resolution and never existed on `main`. Next bump is v40.

---

# Staple products: search UI, full rename to a new naming convention, collision resolution + AI model-change scoping
**Date:** 2026-08-02
**Project:** Daily Shuffle — Tracker staples (`staple_products` data + `index.html` UI) and the embedded-AI model choice
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (both session tasks landed; one optional follow-up left open)

---

## Project Context
Second session on 2026-08-02 — see the entry below for the same-day Asian-cuisine
reclassification work, which is unrelated. This session covered two asks: (1) *scope*
changing the model behind the app's embedded AI, and (2) rename the staple products,
change the naming convention (especially branded goods), and add a search function.

The `staple_products` table had reached 168 rows after the USDA expansion (see the
2026-07-01 entry for the `usda_staples.py` pipeline) and had never had a naming pass —
so it carried two clashing conventions and a set of silent data faults.

## Session Goal
1. Scope (not implement) moving the 5 in-browser Anthropic call sites off
   `claude-haiku-4-5-20251001`.
2. Add search to the staples manager + staple picker.
3. Agree a naming convention, resolve name/alias collisions, and apply the renames.

## State Before This Session
- **`staple_products`**: 168 rows. ~120 lowercase USDA seeds ("almond butter"), ~48
  Title-case curated rows using *three* different branded formats (brand-first
  "Alpro Original soya milk"; product-first "Soya yoghurt — Lidl plain";
  product-first-with-retailer "Dark chocolate 74% — Fin Carré (Lidl)").
- **No search anywhere**: the manager rendered all 168 into a 240px scroll box; the
  picker put all 168 into a flat `<select>`.
- **7 exact name/alias collisions** and **13 groups sharing one USDA FDC record**, none
  previously identified.
- All 5 AI call sites parsing `data.content?.[0]?.text`.

## What Was Done

### 1. AI model-change scoping (deliverable: `ai-model-change-scope.md`, sent, not committed)
Mapped all 5 call sites: `fetchMacroEstimate` (L3581, max_tokens 256),
`generatePlanWithAI` (L3926, 512), `parseWithAI` (L5380, 2048),
`trkRunBulkStaples` (L6390, 4096), `trkRunQuickAdd` (L6509, 1024).

**Headline finding — the blocker, not the cost:** every site parses
`data.content?.[0]?.text`. Adaptive thinking is **on by default on both Sonnet 5 and
Opus 5**, so `content[0]` becomes a thinking block and `.text` is `undefined`. Verified
each site's failure mode individually rather than assuming uniform silence:
`fetchMacroEstimate` fails **silently** (catch returns null); the other four surface a
*misleading* error ("Unexpected format from AI", "No products recognised", "No items
recognised") that reads as model regression, not a shape change.

Cost was ruled out as a decision driver — worst case (bulk staple paste, ~5k in/3k out)
is ~2¢ Haiku vs ~4¢ Sonnet 5 vs ~10¢ Opus 5. Recommendation: **all five → Sonnet 5,
thinking disabled, defensive parse** (~30 min), with thinking-on for `fetchMacroEstimate`
as a later measurable experiment. Not implemented — the ask was to scope only.

### 2. Staples search (PR #57, draft)
Added `trkMatchStaples(q)` matching on **name or any alias**, shared by the manager
(`trkRenderStapleList()`) and the picker (`trkRenderStaplePickOptions()`). Followed the
existing recipe-picker idiom rather than a new pattern. Also fixed empty-result paths
that had never existed: picker clears its macro preview instead of showing stale figures;
`trkSubmitStaple` toasts "Pick a product" instead of a silent `return`; deleting in the
manager re-renders only the list so the search box and half-filled add-product form
survive.

### 3. Collision analysis → two review CSVs → applied renames
Wrote both review CSVs to scratchpad (per the 2026-08-02 Asian-cuisine precedent —
review CSVs are **not** committed) and sent via `SendUserFile`. Saffron returned the
collision CSV annotated; a second round settled the convention.

**Applied to Supabase in three ordered steps** — aliases folded *first* (while old names
still existed), then deletions, then renames.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | `trkMatchStaples`, `trkRenderStapleList`, `trkRenderStaplePickOptions`; empty-result handling in `trkStaplePreview`/`trkSubmitStaple`; manager + picker markup | Modified | repo root |
| sw.js | `CACHE` v37→v38 | Modified | repo root |
| logs/daily-shuffle_log.md | This entry | Modified | repo root |
| Supabase `staple_products` | 158 renames, 5 deletions, alias re-pointing, 5 nutrition corrections, flag hygiene | Modified | project `jsxcctrskkkxgdxfaduo` |
| ai-model-change-scope.md | Model-change scoping doc | Created (scratchpad, sent, not committed) | session scratchpad |
| staple-collision-review.csv | 7 exact collisions + 13 shared-FDC groups, with proposed resolutions | Created (scratchpad, sent, not committed) | session scratchpad |
| staple-rename-review.csv / -v2.csv | v1 (inverted convention) then v2 (final) rename plans | Created (scratchpad, sent, not committed) | session scratchpad |
| gen_rename.py / gen_rename_v2.py | Generators for the above | Created (scratchpad) | session scratchpad |
| staple_search_check.mjs | Ad-hoc Playwright test of the new search paths, 10/10 | Created (scratchpad, not committed) | session scratchpad |

## Decisions & Reasoning

- **Naming convention → `<Food name>[, <qualifier>][ — <Brand \| generic>]`.** Saffron
  first picked "product-first, brand after em-dash", so I proposed mechanical inversion
  (`Sugar, brown`, `Oil, sesame`). She pushed back asking *"should it be sugar, Brown?"*
  — **and her instinct was right, mine was wrong.** Final rule: **do not invert the food
  name**; the comma is only for a qualifier separating two rows of the *same* food
  ("Peanut butter, smooth" vs "Peanut butter, crunchy"), and the dash is only for the
  source. Test: you'd say "brown sugar" aloud, never "sugar, brown". The original
  argument for inversion (alphabetical grouping) was obsoleted by the search shipped in
  the same session. **This reversed ~25 proposed names.**
- **`— generic` only where a branded twin exists**, not on all 120 USDA rows — chosen
  over "on every USDA row" and over "`— USDA` everywhere". Keeps the tag informative
  rather than noise ("Avocado — generic" tells you nothing).
- **Defaults flipped to match how Saffron actually eats.** The bare terms "soy sauce"
  and "protein powder" resolved to the USDA generics — which are *wheat-containing* soy
  sauce and *whey* protein, for a coeliac, dairy-free user. Now `soy sauce` → **Emma
  Basic GF** and `protein powder` → **Free Soul vegan**; the whey row was stripped of
  *all* aliases (including the chocolate/vanilla flavour ones, which moved to Free Soul
  since its label is universal across flavours) so it can't catch a generic mention.
- **`chilli oil` row deleted, not relabelled.** Saffron asked to relabel it "sesame oil",
  but it was already byte-identical to the existing `sesame oil` row (same FDC 171016),
  so relabelling would have created a duplicate. Deleting achieves the same intent.
- **3 of the 8 "needs nutrition" rows were left untouched.** When Saffron supplied
  replacement figures, the diff showed **Tamari, Brown sugar and Red pepper flakes were
  the *legitimate* owners of their USDA records** — their twins were the borrowers. My
  original flagging was too broad. Applying the supplied figures would have *degraded*
  them (rounder numbers, fibre zeroed). Values kept; flag cleared only.
- **`Chicken stock` renamed to `Chicken stock cube`** rather than just re-numbered — the
  figures changed from made-up stock (36 kcal/100 g) to cube (270 kcal/100 g), a ~7.5×
  jump. Without "cube" in the name a 100 g log would be silently catastrophic.
- **`usda_seed` stripped from the 5 re-sourced rows** — their figures are now brand-label
  averages, so the provenance flag had become false.
- **Review CSVs to scratchpad, not the repo** — follows the same-day Asian-cuisine
  precedent; they're pre-review proposals, not the reviewed-decisions the root CSVs hold.

## Current State (end of session)
- **`staple_products`: 163 rows.** 0 lowercase names, 0 stale `(generic)` suffixes,
  0 duplicate names, 0 `nutrition_unverified`, 5 `nutrition_estimated`, 113 `usda_seed`.
- **PR #57** (`claude/ai-model-product-naming-1c1nd4`) open, draft, mergeable_state clean.
  No CI on this repo (the keepalive is `main`-only), no review comments.
- Model change **scoped only — no code written**.

## Next Steps
1. **Merge PR #57** (search) — verified, nothing outstanding.
2. If proceeding with the model change: apply the defensive parse
   `(data.content||[]).find(b=>b.type==='text')?.text` at index.html L3633, L4024, L5479,
   L6426, L6561 — **this is worth landing even if the model doesn't change.** Then swap
   the 5 model strings and add `thinking:{type:'disabled'}`. Must also update
   `CLAUDE.md:113` and the `index.html:5596` comment, and bump `sw.js` CACHE.
3. Optional: replace **Coconut sugar** carbs 100.0 g → ~94 g (see Gotchas).
4. Optional: re-source the 5 `nutrition_estimated` rows from *her actual UK products* —
   the current figures are US-leaning brand averages.

## Open Questions / Blockers
- **CLAUDE.md AI-features list is drifted, independent of this session.** It names
  *"pantry item parsing"* (pantry now lives in `legacy/`, not loaded) and omits
  `fetchMacroEstimate` and `generatePlanWithAI`, both live. `claude_md_drift.mjs` does
  **not** catch this — it only checks mechanical cases. Fix when this area is next touched.
- **No nutrition data can be sourced from an agent session.** Verified this session:
  `api.nal.usda.gov` *and* `world.openfoodfacts.org` both return **403 connect_rejected**
  at the egress gateway, and WebFetch hits the same policy. WebSearch works but returns
  page snippets only — no per-100 g figures, and no FDC ID for provenance. Only
  `api.anthropic.com` + package registries are allowlisted. Nutrition sourcing must be
  `scripts/usda_staples.py` on Saffron's Mac, or label data pasted into chat.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/ai-model-product-naming-1c1nd4`,
  **PR #57** (draft).
- `sw.js` CACHE **v37 → v38**.
- Supabase project `jsxcctrskkkxgdxfaduo`, table `staple_products` (163 rows after).
- Flags in play: `usda_seed`, `nutrition_estimated` (new this session),
  `nutrition_unverified` (introduced then fully cleared), `high_sodium`.
- The Supabase MCP server disconnected and reconnected mid-session under a new tool
  prefix — re-search via ToolSearch if this happens again.

## Notes & Gotchas
- **Renaming staples could not orphan saved meals — verified, don't re-panic.**
  `trkFindStapleId()` (L5773) resolves by name/alias but runs **only at save time**;
  `trkResolveItemMacros` reads by `source_id`. Confirmed 0 dangling references post-write.
- **Coconut sugar carries an internally inconsistent figure**, applied verbatim as
  supplied: carbs **100.0 g/100 g** against 378 kcal. 100 g carbs ≈ 400 kcal, and 100 g
  of carbs leaves no room for moisture/ash. ~94 g would be consistent. Left as-is
  deliberately rather than silently overriding her data; the discrepancy is ~2.4 kcal at
  her typical 10 g usage, so it is immaterial in practice. Noted in the row's `notes`.
- **Gochugaru and Dark chocolate chips kept fibre carried over from their old USDA
  records** (27.2 g and 6.5 g) — the supplied data had no fibre. Flagged in each row's
  `notes`. Don't mistake these for verified figures.
- **`Chicken stock cube` is per 100 g of CUBE.** A 10 g cube ≈ 1,000–1,700 mg sodium.
  Never log it by volume of made-up stock.
- **`staple_products` has no sodium column** — all sodium data from this session lives in
  the `notes` text, not a queryable field.
- Ad-hoc browser tests must seed `trkStaples` via `trkLoadStaples(true)` reading the
  `ds_trk_staples` localStorage key. Setting `window.trkStaples` does **not** work —
  it's a `let` binding at module scope and doesn't attach to `window`.

---

# Asian cuisine tag expansion + recipe reclassification (cuisine, carb type, meal type, Dish Type)
**Date:** 2026-08-02
**Project:** Daily Shuffle — tagging taxonomy (`index.html` taxonomy code + Supabase `recipes` data)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete

---

## Project Context
Saffron wanted the "Asian" cuisine tag split into country-specific variants (keeping
"Asian" as the ambiguous/fusion catch-all), plus a handful of new tags across other
taxonomies, and then wanted the *existing* recipe library retroactively reclassified
into the new tags — not just the schema/UI support. First entry to touch the
cuisine/cravings/meal-type/carb-type taxonomy in `index.html` since it was built; no
prior log entry to cross-reference.

## Session Goal
1. Expand the cuisine taxonomy (dropdown, filter chip, Shuffle cravings group, AI
   parser) with Vietnamese/Thai/Chinese/Korean as first-class values, plus carb types
   `noodles`/`oats`, meal type `sauce`, and a new "Dish Type" cravings group (Salad,
   Pancakes, Bakery, Soup, Stir-fry, Curry, Traybake/One-pot, Sandwich/Wrap, Bowl).
2. Retroactively reclassify the ~327-row `recipes` table against all of the above.

## State Before This Session
`index.html`'s `cuisine` field only had comfort/asian/japanese/indian/italian/mexican/
american/mediterranean/middleeastern/simple/other. `CARB_TYPES` had no noodles/oats.
`MEAL_TYPES` had no sauce. `CRAVING_TAXONOMY` had no dish-type/format group at all —
only cuisine/texture/mood/dietary. No recipes had ever been reclassified against any of
this (it didn't exist yet).

## What Was Done
1. **Code (index.html + sw.js), PR #54, merged** — added vietnamese/thai/chinese/korean
   to the cuisine dropdown (`#f-cuisine`, `#edit-cuisine`), `CUISINE_EMOJI`, the
   "Cuisine" filter-panel array, and `CRAVING_TAXONOMY.cuisine`; added `noodles`/`oats`
   to `CARB_TYPES`/`CARB_TYPE_LABELS`; added `sauce` to `MEAL_TYPES`/`MEAL_TYPE_LABELS`/
   `TYPE_LABELS`/`TYPE_CLASSES` (+ new `.type-sauce` CSS rule); added a new `dish` group
   to `CRAVING_TAXONOMY` (salad/pancakes/bakery/soup/stirfry/curry/traybake/sandwich/
   bowl) with `CRAVING_GROUP_LABELS.dish = 'Dish Type'`; updated the AI recipe-parser
   system prompt schema/rules to match all of the above. Ran the full `ship-check`
   (JS parse 3/3, smoke test 5/5, `claude_md_drift.mjs` clean) and bumped `sw.js` CACHE
   v36→v37 (one bump, this PR only).
2. **Cuisine reclassification (Supabase `recipes.cuisine`), two passes**:
   - Pass 1: reviewed all 86 recipes tagged `asian`, proposed a confident/unsure split
     inline in chat, Saffron answered the 10 unsure ones directly → 34 reclassified
     (6 vietnamese, 10 thai, 7 chinese, 5 korean, 6 japanese), 52 stayed `asian`.
   - Pass 2: Saffron asked to see the remaining 52 — exported them as a CSV (path
     `scratchpad/asian-cuisine-review.csv`, columns id/name/tags/craving_tags/
     new_cuisine) via `SendUserFile`. She edited it in **Apple Numbers** and uploaded
     the `.numbers` file back (not CSV) — parsed it by `pip install numbers-parser`
     (not preinstalled; installs cleanly, no network issues) and reading
     `doc.sheets[0].tables[0].rows(values_only=True)`. Normalised her answers
     (strip/lowercase), all 52 mapped cleanly to a known cuisine value → 28 more
     reclassified (14 chinese, 9 japanese, 3 thai, 2 vietnamese), 24 confirmed staying
     `asian`. **Final: 62/86 originally-"asian" recipes now have a specific cuisine;
     24 are the genuine catch-all.**
3. **Carb type / meal type / Dish Type reclassification (Supabase, same session,
   mechanical name-pattern matching, no CSV round-trip)** — for each new tag, ran a
   `SELECT` to find candidates by `name ILIKE` patterns (+ existing `tags`/
   `craving_tags` signals), manually eyeballed the candidate list for false positives,
   then ran a matching `UPDATE`. Verified every category with a post-write count and a
   spot-check read-back.
   - `carb_type='noodles'`: 32 recipes (Pad Thai/Ramen/Pho/Laksa/noodle bowls).
   - `carb_type='oats'`: 47 recipes (overnight/baked oats, oat-based pancakes/bars).
   - `meal_types` gets `sauce`: only 2 recipes — **Chilli Oil**, **Nước Chấm (Huy Vu
     dipping sauce)** — set to `ARRAY['sauce']` outright (both had been sitting on the
     mismatched legacy value `'side'` singular, not the app's `'sides'` plural, so this
     incidentally fixed that data-quality wrinkle for these 2 rows only — **did not**
     do a wider `side`→`sides` sweep, out of scope). Two borderline condiment-tagged
     recipes (**Garlic Cucumber Salad**, **Pickled Red Onions**) were flagged and
     asked about explicitly — Saffron said leave both as-is (no `sauce` tag).
   - `craving_tags` append (additive, a recipe can carry several): bakery 68, salad 34,
     bowl 34, soup 17, pancakes 13, stirfry 7, curry 5, sandwich 6, traybake 2.
4. **`handoff.md` note (PR #55, merged? — see Environment note below re: status)** —
   captured the "convert primary `cuisine` field to multi-select" idea that came up
   when Saffron asked whether multi-cuisine tagging was possible. Answer given: it
   already partially exists — the Shuffle tab's Cravings "Cuisine" subgroup is already
   multi-select and shares the same value set as the primary dropdown — so for now use
   that for recipes spanning >1 cuisine; converting the *primary* `cuisine` column
   itself to an array is logged as a future option, not done.
5. **Branch-reset gotcha hit and handled**: PR #54 merged mid-session, so per the
   environment's "restart from `main` after a merge" rule, `git fetch origin main` +
   `git checkout -B <branch> origin/main` + `git stash pop` was used before the
   `handoff.md` commit, rather than stacking on the now-merged history.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | Cuisine dropdown ×2, `CUISINE_EMOJI`, cuisine filter array, `CRAVING_TAXONOMY` (+dish group), `CRAVING_LABELS`, `CARB_TYPES`/`CARB_TYPE_LABELS`, `MEAL_TYPES`/`MEAL_TYPE_LABELS`, `TYPE_LABELS`/`TYPE_CLASSES`, AI parser prompt | Modified | repo root |
| sw.js | `CACHE` v36→v37 | Modified | repo root |
| handoff.md | New "Multi-select primary cuisine" future-idea entry | Modified | repo root |
| Supabase `recipes` | `cuisine` (62 rows across 2 passes), `carb_type` (79 rows), `meal_types` (2 rows), `craving_tags` (186 row-tag-additions across 9 dish-type tags, some rows got >1) | Modified | project `jsxcctrskkkxgdxfaduo` |
| scratchpad/asian-cuisine-review.csv | Pass-2 review export (id/name/tags/craving_tags/new_cuisine) | Created (not committed — scratchpad) | session scratchpad dir |

## Decisions & Reasoning
- **Kept "Asian" as a real, permanent value, not a migration artifact** — Saffron was
  explicit it should stay for genuinely ambiguous/fusion dishes (crispy-rice-salad
  trend bowls, generic peanut-noodle dishes, etc.), so the reclassification passes
  deliberately left ~24 recipes on it rather than forcing a specific country.
- **CSV → Numbers round-trip, not a second inline Q&A** — with 52 items left after
  pass 1, a wall of AskUserQuestion prompts wasn't viable (tool caps at 4 questions);
  exporting a fill-in-the-blank CSV and having her return whatever she has (in this
  case Numbers, not CSV) was the right shape. `numbers-parser` handled the format with
  zero friction once installed — worth remembering as the tool of choice if this
  happens again.
- **Only 2 recipes got the `sauce` meal type**, not every recipe whose name contains
  "sauce"/"dressing" — a broad keyword match pulled in full dinner/lunch dishes that
  merely *feature* a sauce (e.g. "Vietnamese Lettuce Wraps with Peanut Sauce"); those
  correctly stayed on their existing meal type. Only recipes that ARE a condiment
  (nothing else on the plate) got reclassified.
- **Bakery dish-tag query needed exclusion patterns**, not a simple keyword OR — naive
  `name ILIKE '%cake%'` also matches "pan-**cake**s", "rice **cake**s", and "fish**cake**s"
  since the substring is embedded in unrelated words. Fixed with explicit
  `NOT ILIKE '%pancake%'` / `%rice cake%` / `%fishcake%` plus exclusions for savory
  "bake" dishes (gnocchi bake, enchilada bake, sushi bake, chicken traybake) that
  aren't bakery items at all.
- **Used `SELECT`-then-matching-`UPDATE` instead of manually transcribing UUID lists**
  for the mechanical carb/meal/dish-type passes — after building each candidate list
  and eyeballing it for false positives, the `UPDATE` re-runs the *same* WHERE
  predicate rather than a hand-typed `id IN (...)` list, removing transcription-error
  risk across ~80 rows.

## Current State (end of session)
**Done**, pending Saffron's confirmation that PR #54 and #55 review activity is
settled (both were merged/open as of this entry — see Environment note). All 4 new
taxonomy dimensions (cuisine variants, carb types, sauce meal type, Dish Type group)
exist in the app AND have been retroactively applied across the existing recipe
library. No further action needed unless she flags a miscategorized recipe.

## Next Steps
1. Nothing blocking. Optional future work (already logged in `handoff.md`, not
   scheduled): convert the primary `cuisine` field from single-select to multi-select
   if the two-parallel-systems (dropdown + Cravings chips) proves confusing in
   practice.
2. If Saffron wants further cuisine grain (e.g. splitting out Malaysian/Singaporean/
   Hawaiian/Filipino, which currently have no matching option and default to `asian`
   — see Quick Chicken Laksa, Singapore Chicken Noodles, the two poke bowls, One Pan
   Vegan Sushi Bake), that's a clean follow-on using the same taxonomy-expansion +
   reclassification pattern from this session.
3. `Summer Salad with Blackened Salmon` is still tagged `asian` with no clear Asian
   signal in the dish itself (flagged mid-session as a possible stray import tag,
   never resolved either way) — worth a decision if it comes up again.

## Open Questions / Blockers
N/A — no blockers. The only loose thread is the optional Summer Salad w/ Blackened
Salmon miscategorization flagged above, which isn't blocking anything.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`. Branch: `claude/asian-cuisine-tags-expansion-cvdxj9`.
- **PR #54** (index.html/sw.js taxonomy code) — merged to `main` (squash, commit
  `1c81f90`) mid-session.
- **PR #55** (`handoff.md` note) — opened as a draft after PR #54 merged (branch was
  reset to fresh `main` first, per the "no stacking on merged history" rule); status as
  of this log entry: check `gh`/GitHub MCP for current state before assuming it's still
  open — it may have merged since.
- Supabase project: `jsxcctrskkkxgdxfaduo` (the bundled recipe-library project, per
  `recipe-db` skill). All writes were plain `execute_sql` UPDATEs against `recipes` —
  no migration needed anywhere this session (`cuisine`, `carb_type`, `meal_types`,
  `craving_tags` all have no `CHECK` constraints, confirmed via
  `pg_constraint` before the first write).
- `numbers-parser` (Python) was `pip install`-ed into the sandbox this session — not
  present by default. Installs fine, no egress issues (PyPI, not the blocked
  Apify/USDA hosts).

## Notes & Gotchas
- **`cuisine` (single-select dropdown) and the Cravings-tab "Cuisine" chip group are
  two separate, parallel systems** that happen to share the same value vocabulary —
  don't assume setting one sets the other. See `handoff.md`'s "Multi-select primary
  cuisine" entry for the full explanation and the future unification option.
- **The pre-existing `meal_type` singular value `'side'` (not `'sides'` plural) is a
  latent data-quality bug** independent of this session's work — it doesn't match
  `MEAL_TYPES`/`MEAL_TYPE_LABELS` keys in `index.html`, so any recipe still on it
  renders with a raw, unstyled fallback label in the app. Only the 2 recipes touched
  for the `sauce` reclassification (Chilli Oil, Nước Chấm) got fixed as a side effect;
  a wider sweep was explicitly out of scope this session and has NOT been done.
- **Keyword-substring tagging needs exclusion lists, not just inclusion lists** — see
  the bakery/pancake/rice-cake collision above. If extending any of these dish-type
  categories later (e.g. adding more cuisines or dish types), re-check for the same
  class of substring collision before trusting a raw `ILIKE` count.
- All data changes this session were to Supabase only — **no local backup exists**
  beyond what's in this log and the chat transcript. If a reclassification needs
  reverting, the before/after cuisine values for the 86 originally-`asian` recipes are
  recoverable from this log's pass-1/pass-2 breakdown and the chat history, not from
  any DB snapshot.

# Japchae recipe duplication (in-session, unsaved) + variant-toggle idea + soya milk staple
**Date:** 2026-08-02
**Project:** Daily Shuffle — recipe library (Supabase `recipes`) exploration, `staple_products`
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — one PR merged (#53); one small direct DB write; one item left undone by design

---

## Project Context
Unrelated to the macro-correction stream closed out in the 2026-07-24 entry below, and to the
Asian cuisine tag expansion entry immediately below this one (also same-day, different session).
This was a mixed session: (1) an explicitly non-persisted recipe-duplication exercise against the
bundled Supabase project (`jsxcctrskkkxgdxfaduo`), (2) a resulting feature-idea note, and (3) an
unrelated one-off staple addition.

## Session Goal
1. Pull "Glass & Konjac Chicken Japchae" and its sibling "Chicken Mince Konjac Japchae" from
   `recipes` into the conversation so Saffron could duplicate and alter them (ingredient swap +
   macro recalculation) without writing anything to the DB until she says so.
2. Answer her follow-up questions about how such duplicates would surface in Shuffle/Tracker,
   and how to represent them as "variants."
3. (Unrelated, same session) add an unsweetened soya milk entry to `staple_products`.

## State Before This Session
Clean — prior session (2026-07-24) had closed out the macro-correction stream entirely; `main`
had no open work relevant to this session's topics.

## What Was Done
1. **Pulled both japchae recipes read-only** via `execute_sql` (`select * from recipes where
   name ilike '%japchae%' or ...`) — `b8bb9c91-b2d4-4ee7-877b-ea976d7a5a26` (Glass & Konjac
   Chicken Japchae, serves 4) and `7670cb5c-e6ef-437e-bc3b-fd0780b4e19d` (Chicken Mince Konjac
   Japchae, serves 5). Presented both in full (ingredients, method, macros) in chat.
2. **Duplicated + altered both, in-session only** — per Saffron's explicit instruction ("nothing
   needs to be stored before my say so"), no `INSERT`/`UPDATE` was run for either recipe. Applied:
   replace the sweet potato glass noodles line with 200g konjac noodles, merged into the existing
   konjac noodles line (1000g total in both recipes), scrubbed the glass-noodle mention from each
   subtitle/notes field, and recalculated macros using generic per-100g reference values (sweet
   potato glass noodles ≈351 kcal/85g carb dry; konjac noodles ≈7–9 kcal/100g, ~3g fibre, ~0 net
   carb) applied as a delta against the original per-serving macros:
   - Glass & Konjac Chicken Japchae (serves 4): 470→**~360** kcal, 66→**~40**g carb, fibre
     14→**~15**g; protein/fat/sugar effectively unchanged.
   - Chicken Mince Konjac Japchae (serves 5): 515→**~448** kcal, 50→**~34**g carb, fibre
     9→**~10**g; protein/fat/sugar effectively unchanged.
   Neither duplicate was ever written to Supabase — **this recalculated data only exists in that
   conversation's transcript and is not persisted anywhere.** If Saffron wants these variants
   saved, they need to be re-derived (the exact deltas are in this log entry) and inserted fresh.
3. **Answered "how would these show up in Shuffle/Tracker"** by reading the actual fetch queries
   in `index.html`: Shuffle's pool (`fetchCloudRecipes`, ~line 1511) only pulls
   `import_status=eq.ready`; Tracker's recipe picker (`trkFetchRecipes`, ~line 6220) pulls
   `import_status=in.(ready,review,custom)`. So `custom` rows are Tracker-only; `ready` rows are
   both.
4. **Answered "how would these show up as *variants*"** — checked the `recipes` schema via
   `list_tables`: no `variant_of`/`parent_id` column exists. A duplicate is just another
   standalone row with no link back to its source recipe. Confirmed with Saffron she wants to
   keep these as `custom` for now (Tracker-only, not Shuffle-eligible) given the macros are
   AI-recalculated estimates, not staple-grounded.
5. **Logged the variant-toggle idea** as a new "Future — other feature ideas (unscheduled)"
   section appended to `handoff.md` (previously only had the cost-aware-features future list).
   Committed + pushed on `claude/japchae-recipe-duplicate-l3z9i5`, opened **draft PR #53**,
   subscribed to its activity. CI showed `pending`/0 checks the whole time (repo has no CI beyond
   the unrelated Supabase keep-alive) — nothing to fix. No review comments. Saffron marked it
   ready for review herself; **merged** by her directly. Session unsubscribed automatically on
   merge.
   - Note: while this PR was open, a **second, unrelated** feature note ("multi-select
     primary-cuisine idea") was appended to `handoff.md` by another PR (**#55**, merged after
     #53, alongside **#54** "Expand Asian cuisine tags" — see that entry below). Neither was part
     of this session — flagging so nobody attributes them here.
6. **Added a new staple** (unrelated ask): `staple_products` had "Alpro Original soya milk"
   (sweetened, 2.5g sugar/100ml) but nothing unsweetened. Inserted a new row, first as branded
   ("Alpro Unsweetened soya milk") using generic Alpro-Unsweetened label values, then — per
   Saffron's correction ("I want it unbranded and generic") — **updated in place** (same row,
   `id c88bbbfe-f065-46c9-b917-f991f0142c47`) to rename to "Unsweetened soya milk" and swap
   aliases to generic terms. Macros were left unchanged (they were already generic-label values,
   not brand-specific): 33 kcal / 3.3g protein / 0.3g carb / 1.8g fat / 0.5g fibre / 0.3g sugar
   per 100ml.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| `handoff.md` | Future-ideas section | Modified (variant-toggle bullet added) | repo root — merged via PR #53 |
| Supabase `staple_products` | New staple row | Created then updated | row `c88bbbfe-f065-46c9-b917-f991f0142c47` |
| Supabase `recipes` | Japchae duplicates | **Not created** — deliberately left unpersisted | N/A |
| `logs/daily-shuffle_log.md` | This entry | Modified | repo root |

No `index.html`/`sw.js`/`manifest.json` touched — no cache bump needed.

## Decisions & Reasoning
- **Kept the duplicates unpersisted per Saffron's explicit instruction**, even after later
  discussing `import_status`/variant mechanics in detail — the discussion was exploratory, not
  authorization to write. Only wrote to the DB when she gave a direct, unambiguous instruction
  ("add unsweetened soya milk to my staples").
- **Chose to merge the 200g konjac addition into the existing konjac-noodle line** (rather than
  add a second line item) since "replace X with Y" reads as a net ingredient-quantity change, not
  two separate konjac lines in the same recipe.
- **Recalculated macros via generic-value deltas against the original per-serving figures**
  rather than re-deriving the whole recipe from scratch — faster, and keeps everything else
  (protein/fat/sugar, which the swap doesn't touch) anchored to the original AI estimate instead
  of introducing new estimation error.
- **`variant_of` proposed as nullable, not required** — documented as a future-feature note only,
  not implemented; no schema migration was run this session.
- **Named the new staple generically per direct correction** — first guess (branded "Alpro
  Unsweetened") was wrong; fixed via `UPDATE` on the same row rather than delete+reinsert, since
  the macros were already valid and only naming needed to change.

## Current State (end of session)
- PR #53: merged to `main`. Branch `claude/japchae-recipe-duplicate-l3z9i5` reset to `origin/main`
  after the merge (per the merged-PR restart convention) so this log entry lands clean.
- `staple_products`: "Unsweetened soya milk" row live and correct per Saffron's confirmation.
- The two altered japchae recipes exist **only in this log entry and the closed conversation** —
  not in the database, not in any file. Re-derive from §"What Was Done" item 2 above if resuming.

## Next Steps
1. If Saffron wants either/both altered japchae recipes actually saved: re-apply the swap
   documented above (merge 200g into the konjac line, scrub subtitle glass-noodle mentions, use
   the recalculated macros given) and `INSERT` into `recipes` with `import_status='custom'`
   (Tracker-only) or `'ready'` (also Shuffle-eligible, her call) — nothing currently blocks this,
   it just wasn't authorized this session.
2. `variant_of` column is documented in `handoff.md` under "Future — other feature ideas
   (unscheduled)" — no urgency, revisit whenever recipe-variant handling comes up again (note this
   session's discovery that #54/#55 landed a *different* feature idea, "multi-select primary
   cuisine," in the same handoff.md section — read both before adding a third).
3. No other open threads from this session.

## Open Questions / Blockers
N/A — nothing blocking. The only "unfinished" item (the japchae variants) is unfinished by
Saffron's explicit choice, not a blocker.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`. Branch: `claude/japchae-recipe-duplicate-l3z9i5` (reset
  from `origin/main` post-merge, per convention, before this log commit).
- PR #53 (merged). Unrelated PRs #54/#55 also merged to `main` during this session's window by a
  different session — visible in `git log` but not this session's work.
- Supabase project: `jsxcctrskkkxgdxfaduo` (bundled `recipes`/`staple_products`/etc.).
- No env vars or credentials touched.

## Notes & Gotchas
- **`recipes` has no variant/parent linkage** — don't assume duplicated recipes are discoverable
  as a group; they're only findable by name, exactly like any other row.
- **`import_status` is the only lever controlling Shuffle vs. Tracker visibility** (`ready` = both,
  `custom`/`review` = Tracker only, anything else = neither). This is a coarser mechanism than a
  true variant toggle would be — see the `handoff.md` note.
- **The recalculated japchae macros are estimates layered on estimates** (original recipes were
  already flagged "AI estimate"; this session's deltas used generic reference values, not
  `staple_products` lookups) — if these ever get saved, consider flagging
  `review_flags: quantities_estimated` rather than treating them as staple-grounded.
- `handoff.md`'s "Future" area now holds two unrelated feature-idea sections appended by
  different sessions in close succession (cost-aware features → variant toggle → multi-select
  primary cuisine) — worth consolidating into a proper backlog file if it keeps growing.

---

# Session close-out — macro-correction stream fully complete (Batches M–O)
**Date:** 2026-07-24
**Project:** Daily Shuffle — recipe library macros (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — §A–§G closed; library at 0 null macros; all PRs merged

---

## Project Context
Wrap-up of the recipe macro-correction stream that ran across today's Batches M, N, and O
(each has its own detailed entry below — see the Batch M / N / O entries dated 2026-07-24 for
per-recipe math and reasoning; this entry is the consolidated "where it all landed" record).
The stream corrected per-serving macros on the bundled Supabase `recipes` library that backs
the live PWA. This is the **hand-patching** stream (writes 6 macros straight to `recipes`), not
the blocked systematic step-3 pipeline (still waiting on `ingredient_grams` / PR #36).

## Session Goal
Pick up "PR #48 remaining work" and drive the macro-correction worklist to completion.

## State Before This Session
PR #48 (Batches E–L) had just merged to `main`, closing §B/§C/§D/§E/§F/§G. `remaining-work.md`
claimed §A had ~90 open items. Ready library had a handful of null-macro rows.

## What Was Done (arc of the whole session)
1. **Batch M** — filled the last 3 null-macro §A rows (Raspberry Cheesecake Bowl →285, Roasted
   Cod on Sweet Potato →590, Single Serve Sticky Date Pudding →316). Library reached 0 nulls.
   → PR #49, merged.
2. **Merge-conflict resolution** — PR #48 landed in `main` mid-session; resolved conflicts in all
   3 log files (renamed my "Batch C" → "Batch M" to avoid colliding with main's Batch C).
3. **PR cleanup** (on Saffron's "merge to main and delete conflicting PRs/branches") — merged
   #49; closed **#47** (superseded by #48). Branch deletion **blocked** by egress policy.
4. **Batch N** — reconciled §A against the live DB instead of trusting the worklist: **84 of ~90
   "open" items were already written by Batch B and just never ticked** → verified + ticked. Only
   3 genuinely needed recompute (Single Serve Double Choc Butter Cake →358, Skillet Chicken Thighs
   w/ Mushroom Gravy →425, Basic Oat Flour Pancakes →160). → PR #50, merged.
5. **Batch O** — resolved the final 4 decision-gated §A items with Saffron's per-recipe calls:
   Middle Eastern Chicken & Rice Bowl →658 (½ cup rice/serve), Pho Gà →750 (full edible meat
   split ÷4), Thai Red Curry Pot Roast →920 (meat only, oil reduced, rice excluded + noted),
   Chicken and Potato Traybake →590 (eyeball). → PR #51, merged. **§A–§G now fully closed.**

## Artifacts Produced / Modified
Across the session (all merged to `main`):

| File | What it is | Status |
|------|------------|--------|
| Supabase `recipes` | 10 rows rewritten (M:3, N:3, O:4) + flags cleared / notes appended | Modified |
| logs/macro-audit.md | Batches M, N, O entries | Modified |
| logs/remaining-work.md | All §A ticked; RESUME rewritten to COMPLETE | Modified |
| logs/daily-shuffle_log.md | Batch M/N/O entries + this close-out | Modified |
| scratchpad/reconcile.py, null-macro-fills-review.md | Working artifacts (not committed) | Created |

No `index.html`/`sw.js`/`manifest.json` change all session — **no cache bump** (data-only).

## Decisions & Reasoning
- **Reconcile before recompute (the session's key move)**: comparing each §A item's stored
  calories to its worklist "before" value revealed the worklist was stale, not the DB — saving
  ~84 needless rewrites and avoiding divergence from Batch B's values.
- **Followed Saffron's per-recipe calls exactly** for the 4 decision-gated items rather than my
  own defaults (she chose full meat yield for pho, meat-only + reduced oil for the curry, etc.).
- **Left the higher calorie results as computed** (pho 750, curry 920) — legitimate once full
  meat/coconut cream are counted; the old 501/548 were undercounts.

## Current State (end of session)
**Done.** All 311 ready recipes carry a full 6-macro set (0 nulls). Every worklist section
§A–§G is closed. PRs #49/#50/#51 merged; #47 closed. `main` @ fd75a59.

## Next Steps
1. Nothing required — the macro stream is complete. Optional loose ends Saffron may want later:
   - Three `Carrot Cake Baked Oats` rows all `ready` (718/serves-1, 268/serves-1, 407/serves-4) —
     possible unintended duplicate; her call which (if any) to soft-delete.
   - 4 independent open PRs untouched: **#36** qty-normalisation (nutrition step 2 apply), **#14**
     Apify quota/`--resume`, **#5** RLS lockdown, **#45** japchae log fix.
   - Next real workstream is nutrition **step 2** (apply `ingredient_grams`, PR #36) → then step 3.

## Open Questions / Blockers
- Systematic step-3 nutrition still blocked on step 2 (`ingredient_grams`), unchanged.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`; work branch `claude/pr-48-remaining-work-raln2k` (restarted
from `origin/main` after each merge — its PRs #49/#50/#51 are all merged, so reused per the
merged-PR workflow). Supabase `jsxcctrskkkxgdxfaduo`, table `recipes`. No cache bump this session.

## Notes & Gotchas
- **Trust the live DB, not the worklist checkboxes.** The whole §A "90 open" figure was stale;
  always reconcile stored values against the DB before recomputing.
- **Branch deletion is blocked in this environment** (git push --delete → 403 egress policy; no
  `delete_branch` MCP tool). Stale merged `claude/*` branches must be cleared from the GitHub UI.
- Rice-exclusion / meat-split assumptions for the pot recipes are recorded in each row's `notes`
  (Thai curry, Pho Gà) — don't "recorrect" them; they reflect Saffron's explicit calls.

# Batch O — 3 decision-gated §A recipes resolved with Saffron's calls
**Date:** 2026-07-24
**Project:** Daily Shuffle — recipe library macros (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — 3 rows written + verified; §A down to 1 open item

---

## Project Context
Direct continuation of the same-day Batch M/N entries (below). After Batch N, §A had 4
decision-gated items left (unstated chicken weights / rice qty / rendering). Saffron gave
calls on 3 of them this turn.

## Session Goal
Resolve the decision-gated §A items using Saffron's per-recipe calls, write them, and update
the record.

## What Was Done
Saffron's calls and the resulting writes (all serves 4, per-serving, staple-grounded):
- **Middle Eastern Chicken & Rice Bowl** (`4e79b17f…`): "½ cup cooked rice". Full recompute
  (2 lb thighs → ~43 g protein/serve, confirming the "→~47" note; mayo white sauce; sumac
  salad; cucumber/feta optional excluded) → 428 → **658/48/41/33/3.5/4.5**.
- **Pho Gà** (`8990b52a…`): "logical split of the remaining meat + carbs". Counted the full
  edible thigh meat (~730 g cooked, bones+skin discarded) split evenly ÷4; broth fat skimmed;
  360 g dried noodles ÷4 → 501 → **750/55/90/18/3.5/11**.
- **Thai Red Curry Pot Roast** (`15de62d0…`): "count just the meat, reduce oil significantly,
  don't count the rice + note it". ~780 g cooked meat from the 1.8 kg bird; oil 3 tbsp→~1 tbsp;
  full 400 ml coconut cream sauce + potatoes + beans; jasmine rice excluded → 548 →
  **920/61/42/56/5.5/9**.
`review_flags` cleared on all 3; assumption notes appended to `notes` on Pho Gà + Thai Red
Curry (rice-exclusion recorded on the latter).

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| Supabase `recipes` (3 rows) | §A decision-gated recomputes | Modified | Supabase `jsxcctrskkkxgdxfaduo` |
| logs/macro-audit.md | Batch O entry | Modified | /home/user/daily-shuffle/logs/ |
| logs/remaining-work.md | 3 §A ticks + RESUME cleaned to 1 open item | Modified | /home/user/daily-shuffle/logs/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

Data-only Supabase change — no `index.html`/`sw.js`, **no cache bump**.

## Decisions & Reasoning
- **Followed Saffron's per-recipe calls exactly** rather than my own defaults: she chose to
  count the full Pho Gà meat yield (not a lowball), meat-only for the Thai curry with reduced
  oil, and ½ cup rice for the Middle Eastern bowl. These were the load-bearing judgement calls
  the recipes needed.
- **Thai curry rice excluded + noted** (per her instruction) — consistent with the other
  rice-to-serve recipes in the library; recorded in the row's `notes`.
- **Appended to `notes` rather than overwriting** — fetched existing notes first (they carry
  freezing/GI guidance) and concatenated the macro-assumption sentence.

## Current State (end of session)
3 rows written + verified. §A has **1 item left** (Chicken and Potato Traybake — needs a
cooked-meat-weight call). Ready library at 0 null macros (311 ready). Changes committed on
`claude/pr-48-remaining-work-raln2k` (restarted from `origin/main` @ 968f16a after PR #50
merged); new draft PR opened.

## Next Steps
1. Saffron gives a cooked-meat weight for **Chicken and Potato Traybake** (or "eyeball ~590")
   → one-line write closes §A entirely.
2. Then the whole macro-correction stream (§A–§G) is done.

## Open Questions / Blockers
- Chicken and Potato Traybake weight (last §A item). Systematic step-3 nutrition still blocked
  on `ingredient_grams` (PR #36) — unchanged.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/pr-48-remaining-work-raln2k` (restarted from
`origin/main` @ 968f16a). Supabase `jsxcctrskkkxgdxfaduo`, table `recipes`. Wrote by explicit id
UPDATE via Supabase MCP; `notes` appended with `||`. No cache bump.

## Notes & Gotchas
- Pho Gà at 750/serve and Thai curry at 920/serve are legitimately calorie-dense once the full
  meat + noodles (pho) / coconut cream (curry) are counted — not errors. The old 501/548 were
  undercounts.
- Branch deletion still blocked here (egress 403); stale merged branches need the GitHub UI.

# §A reconciliation + close-out — Batch N (recipe macros)
**Date:** 2026-07-24
**Project:** Daily Shuffle — recipe library macros (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — 3 rows written + verified; §A effectively closed (4 decision-gated left)

---

## Project Context
Same macro-correction stream as the earlier 2026-07-24 entries (Batch M null-macro fills, and
the merge that pulled Batches E–L into `main` via PR #48). This session continued straight on:
Saffron said "proceed" with §A, the last open bucket. See the Batch M entry below for the
hand-patching-vs-step-3 distinction and the merge/branch-cleanup context.

## Session Goal
Work §A ("under-counted recalcs"), which the worklist showed as ~90 open items.

## State Before This Session
PR #49 (Batch M) merged to `main`; ready library at 0 null macros. `remaining-work.md` RESUME
block claimed "§A: 90 left". Branch `claude/pr-48-remaining-work-raln2k` restarted fresh from
`origin/main` (its prior PR #49 was merged, so per the workflow it's reused for new work → new PR).

## What Was Done
1. **Reconciled the worklist against the live DB** instead of blindly recomputing. Pulled
   name+calories for all 311 ready rows, compared each §A item's stored calories to its worklist
   "before" value (script: `scratchpad/reconcile.py`). Finding: **84 of ~90 had already been
   written by Batch B (2026-07-22) and were simply never ticked** — the worklist was stale, not
   the DB. Only 6 still held their old value.
2. Of those 6: **Sticky Chicken Gochujang** was already done (Batch B wrote 655, rice-excluded —
   coincidentally near its old 646). **3 were clean recomputes** → written. **2 are decision-gated**.
3. **Wrote 3 rows** (staple-grounded, stored serves kept, optional toppings excluded):
   - Single Serve Double Chocolate Butter Cake (`7a0644a4…`): 278 → **358/3/42.5/21/2/27**; cleared `nutrition_incomplete`.
   - Skillet Chicken Thighs w/ Mushroom Gravy (`7dad40e9…`): 318 → **425/36/11.5/27/2/4** (4 tbsp oil counted); kept `serves_estimated`.
   - Basic Oat Flour Pancakes (`9af1cd54…`): 68 → **160/9/18/6/2.5/3** (old 68 was wrong for serves 2; base only).
4. Ticked 86 §A lines in `remaining-work.md`, rewrote the RESUME table (§A now 4 left, all
   decision-gated), added Batch N to `macro-audit.md`.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| Supabase `recipes` (3 rows) | §A macro recomputes | Modified | Supabase `jsxcctrskkkxgdxfaduo` |
| logs/macro-audit.md | Batch N entry | Modified | /home/user/daily-shuffle/logs/ |
| logs/remaining-work.md | 86 §A ticks + RESUME rewrite | Modified | /home/user/daily-shuffle/logs/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |
| scratchpad/reconcile.py | DB-vs-worklist reconciliation script | Created (not committed) | session scratchpad |

Data-only Supabase change — no `index.html`/`sw.js`/`manifest.json`, **no cache bump**.

## Decisions & Reasoning
- **Reconcile before recompute**: blindly redoing 90 items risked diverging from Batch B's
  already-written values and wasting effort. The DB is the source of truth; the worklist ticks
  were just stale. Comparing stored-cal vs worklist-"before" cleanly separated done from not-done.
- **Wrote Basic Oat Flour Pancakes despite its "check serving basis" flag**: the old 68 is
  clearly wrong (ingredients ÷ serves 2 = ~160), and keeping the stored serves=2 is the
  conservative faithful choice. Noted the serving-basis caveat rather than changing serves.
- **Did NOT write the 4 decision-gated §A items**: Chicken & Potato Traybake (bone-in/skin-on
  weights + fat-retention judgement — faithful compute ~614 but genuinely uncertain), Middle
  Eastern Chicken & Rice Bowl (no rice qty), Pho Gà (broth rendering), Thai Red Curry Pot Roast
  (whole-bird rendering). These need Saffron, per the recipe-db "flag, don't guess" rule.
- **Skillet oil counted in full** (fat 27/serve): matches the audit target 418 and the Batch B
  convention (count listed oil, note retention). Bump down if discounting pan retention.

## Current State (end of session)
3 rows written + read-back verified. §A is 4/111 open, all decision-gated. Ready library still
0 null macros. Changes committed on `claude/pr-48-remaining-work-raln2k`; new draft PR opened.

## Next Steps
1. Saffron decides the 4 remaining §A items (weights/rice-qty/rendering) — then they're a quick
   write. Everything else in the macro stream is done.
2. Optional cleanup she may want: the three `Carrot Cake Baked Oats` rows all `ready`
   (718/serves-1, 268/serves-1, 407/serves-4) — possible unintended dup; and the 4 independent
   open PRs (#36 qty-normalisation, #14 Apify, #5 RLS, #45 japchae log fix).

## Open Questions / Blockers
- The 4 decision-gated §A items above. Systematic nutrition "step 3" still blocked on
  `ingredient_grams` (step 2, PR #36) — unchanged.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/pr-48-remaining-work-raln2k` (restarted from
`origin/main` @ 270cceb after PR #49 merged). Supabase `jsxcctrskkkxgdxfaduo`, table `recipes`.
Wrote by explicit id UPDATE via Supabase MCP. No cache bump.

## Notes & Gotchas
- **Trust the DB, not the worklist checkboxes.** This session's whole point: 84 "open" items
  were already done. Always reconcile stored values against the live DB before recomputing.
- Branch **deletion is blocked** in this environment (git push --delete → 403 org egress policy;
  no `delete_branch` MCP tool). Stale merged branches must be cleared from the GitHub UI.

# PR #48 remaining work — Batch M: final 3 null-macro fills (library → 0 nulls)
**Date:** 2026-07-24
**Project:** Daily Shuffle — recipe library macros (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — data written, verified, draft PR #49 open

---

## Project Context
Continuation of the recipe-macro correction stream (Batches A–F; see `logs/macro-audit.md`
and PR #46/#47/#48). This is the **hand-patching** macro stream that writes 6-macro
per-serving values directly to `recipes` — distinct from the blocked systematic "step 3"
nutrition pipeline (which still waits on `ingredient_grams`/step 2). Task was "pick up PR #48
remaining work." PR #48 (`claude/pr-47-outstanding-sections-ucxebb`) closed §F 24/24 and
listed §B/§C/§G/§A-leftovers/§D as still outstanding.

## Session Goal
Continue PR #48's outstanding macro work on the designated branch
`claude/pr-48-remaining-work-raln2k` (a **new** branch → new PR, since #48 is a separate head).

## State Before This Session
Worklist `logs/remaining-work.md` implied large outstanding buckets (§A 97, §B 14, §C 3,
§E 8, §F 24, §G 34). **The worklist was badly stale.** A live DB sweep at session start showed
the ready library (307 rows) was far more complete than the worklist recorded.

## What Was Done
1. **DB completeness sweep** — of 307 `import_status='ready'` recipes, only **3** still had any
   null macro. §G (34) already fully populated (verified). §C dupes resolved (dupe rows
   soft-`deleted`, survivors clean — e.g. High Protein Salmon Potato Salad, Roast Chicken Rice
   Salad, Easy Chicken Traybake). §E empty lists all populated. This cleanup was done by Saffron
   in parallel (noted in Batch B) — not this session.
2. **Recomputed + wrote the 3 stragglers** (the §A "+null macros" recipes Batch B skipped), all
   6 macros/serving from `ingredient_sections`, grounded in `staple_products`:
   - Raspberry Cheesecake Protein Bowl (id `7495b06c…`): 225 → **285/31/16/10/4.5/10**
   - Roasted Cod on Sweet Potato (id `ed533df0…`): 347 → **590/41/73/14.5/10.5/23**
   - Single Serve Sticky Date Pudding (id `0a7f5180…`): 235 → **316/12/57/5.5/2.5/32**
3. **Verified:** post-write sweep = 0/307 ready rows with any null macro (100% complete).
4. Updated `logs/macro-audit.md` (new Batch M) and annotated stale `logs/remaining-work.md`.
5. Committed (`6c05b6b`), pushed, opened **draft PR #49**, subscribed to its activity.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| Supabase `recipes` (3 rows) | Macro fills by id | Modified | Supabase `jsxcctrskkkxgdxfaduo` |
| logs/macro-audit.md | Batch C entry + per-ingredient math | Modified | /home/user/daily-shuffle/logs/ |
| logs/remaining-work.md | 3 ticks, §G resolved, 2026-07-24 status header | Modified | /home/user/daily-shuffle/logs/ |
| scratchpad/null-macro-fills-review.md | Pre-write review sheet (working, not committed) | Created | session scratchpad |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

No `index.html`/`sw.js`/`manifest.json` change — data-only, **no cache bump** (per CLAUDE.md).

## Decisions & Reasoning
- **Picked the 3 null-macro rows as the deliverable** (vs. §B/§C/§D): they were the only
  genuinely-outstanding, decision-free, fully-computable work. §C dedupes = destructive deletes
  needing Saffron's call (recipe-db skill forbids autonomous DELETEs); §B = serve-count
  decisions; §D/§A-leftovers = need source data / eyeball. So this closes the autonomous tail
  cleanly and takes the library to 100% macro-completeness.
- **Roasted Cod protein lowered 49.1 → 41**: recomputed calories hit the audit target (571);
  at that calorie level the ingredient list (2 cod fillets ≈ 290 g) computes to ~41 g protein,
  so the stored 49.1 was inconsistent. Faithful-to-ingredients wins over preserving a rough prior.
- **Sticky Date Pudding recomputed all 6, not just the 2 nulls**: stored carbs (35) and cal
  (235) were undercounted (date + flour + maple sum to ~57 g carbs / 316 kcal); protein/fat
  were already right and kept.
- **No `review_flags` added** to the 3 rows despite raspberry-qty / cream-cheese-type estimates:
  every macro row in the library is an estimate and none carry the flag; adding it to just these
  3 would be inconsistent noise. Estimates documented in the audit log instead (recipe-db rule 5
  balanced against library-wide precedent).

## Current State (end of session)
Complete. `recipes` ready library at 0 null macros. Draft PR #49 open with the two log files.
No app-code change. PR #49 subscribed for activity (no CI in this repo — `get_status` total_count=0).

## Next Steps
1. Saffron reviews/merges draft **PR #49**.
2. Decision-gated remainder (future session, needs Saffron): **§B** serving-count fixes;
   **§D** ingredient-list gaps (Café Style Jacket Potatoes has no potato/corn listed);
   **§A** eyeball/uncertain leftovers — Basic Oat Flour Pancakes (serving basis), Thai Red
   Curry Pot Roast & Pho Gà (whole-bird/soup fat-rendering), Middle Eastern Chicken & Rice
   Bowl (rice qty).
3. Also surfaced (not acted on): **three** `Carrot Cake Baked Oats` rows are all `ready`
   (718/serves-1, 268/serves-1, 407/serves-4) — possible unintended duplicate; Saffron's call.

## Open Questions / Blockers
- Which of the 3 `Carrot Cake Baked Oats` rows (if any) is a dupe to soft-delete — Saffron's call.
- Systematic nutrition "step 3" remains blocked on `ingredient_grams`/step 2 (unchanged).

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/pr-48-remaining-work-raln2k`, draft PR **#49**
(base `main`). Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes` (307 ready of 338).
Wrote by explicit `id` UPDATEs via Supabase MCP `execute_sql`. No cache bump.

## Notes & Gotchas
- **`logs/remaining-work.md` is stale** — do NOT trust its checkboxes. Trust a live DB sweep
  (`select count(*) filter (where …is null)`). Its per-section boxes were left mostly un-ticked
  on purpose; the 2026-07-24 status header at the top reconciles it against reality.
- The macro hand-patching stream writes cal/protein/carbs/fat/fibre/sugar **directly** to
  `recipes` — this is NOT the blocked step-3 pipeline; don't conflate them.
- Recipe-db skill's review-CSV-before-write rule: honored via
  `scratchpad/null-macro-fills-review.md`; only 3 rows (under the ~10-row bulk threshold).

# Recipe Macro Corrections — Batches E–L (PR #48)
**Date:** 2026-07-24
**Project:** Daily Shuffle — recipe library macro audit (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — §B/C/D/E/F/G all closed; only §A (93 under-count recomputes) remains

---

## Project Context
Continuation of the recipe-macro-correction stream tracked in `logs/macro-audit.md` and
`logs/remaining-work.md`. Follow-up to merged #46 (Batch B, all of §A's ★ items) and the
open PR #47 (Batches C/D). This session opened a **new PR #48** on branch
`claude/pr-47-outstanding-sections-ucxebb` (which was reset to PR #47's head
`claude/remaining-work-clarification-uxc73y` at session start, then carried forward).
All recipe data lives in Supabase `recipes` (project `jsxcctrskkkxgdxfaduo`); the only repo
changes are the two log files. Data-only — no `index.html`/`sw.js`, no cache bump. Use the
`recipe-db` skill for schema + non-destructive-write conventions.

## Session Goal
Work through the outstanding sections of `logs/remaining-work.md` (§B–§G, §C dedupes, §D/§E/§F
stragglers) using details Saffron supplied turn-by-turn, writing corrected 6-macro per-serving
values to Supabase. Leave a clean resume point for §A.

## State Before This Session
`remaining-work.md` had §D/§E/§F checkboxes stale (writes from Batches C/D never ticked), and
§B/§C/§G untouched. `recipes` ≈ 338 rows. PR #47 body listed the outstanding work.

## What Was Done
Ten batches (E–L), each written to Supabase then logged in `macro-audit.md` and committed:

- **Batch E** — §F "need one quantity" (10): Mediterranean Chicken & Rice Skillet, Harissa
  Chicken w/ Roasted Veg & Feta, Honey Sesame Salmon Bowl, Instant Noodle Jars, Crispy GF Shrimp
  Dumplings, GF Easy Pan Dumplings ×2, Double Roast Chicken, Green Goddess Chicken Prep Mix, PB
  Banana French Toast. Open-decision estimates (tofu block 300g, ~15g dumpling coatings, Harissa
  full compute, roast yield 52%, ~100g/thigh) later **confirmed by Saffron**.
- **Batch F** — final 3 §F + Frozen Strawberry Raspberry PB Bites → **§F closed (24/24)**. Also
  fixed 2 Batch E notes (Mediterranean Skillet had null notes; Honey Sesame said "with rice"
  though computed rice-excluded).
- **§D** — Café Style Jacket Potatoes: found it was ALREADY renamed to "Chicken and Bacon Caesar
  Pasta Salad" in Batch C with the exact recipe Saffron re-supplied (541/59). No write; ticked.
  **§D closed (4/4).**
- **Batch G** — §B tranche 1 (8): populated Asian Chicken Salad (serves 1), Carrot Cake Loaf,
  Cinnamon Roll Baked Oats @entirelyemmy (serves 10), Crispy Rice and Chicken Salad, Fluffy Greek
  Yogurt Pancakes, Oat Flour Pancakes — all from full recipes Saffron pasted (her in-app edits
  never synced to Supabase — the known bug). Deduped Butternut Protein Brownie (kept butternut/
  egg-white 112/16, soft-deleted pumpkin variant). Renamed the existing "Air Fryer Cinnamon Roll
  Oats" (@tracesoats) → "Cinnamon Roll Baked Oats @tracesoats" to pair with @entirelyemmy.
- **Batch H** — §B tranche 2: Protein Brownie Bake (246/16), Salmon Poke Bowl (serves 1, 765),
  Sticky Miso Chicken Prep Boxes (488/41.5), GF Cinnamon Buns (later serves 12). Held 2.
- **Batch I** — resolved holds: GF Cinnamon Buns → serves 12 (585/bun); Protein Pancakes → per
  pancake serves 12 (71); Sticky Soy Chicken w/ Garlic Rice → rice is COOKED + bumped to 2 chicken
  breasts, serves 2 (699/53.5). Confirmed the "Pho Inspired" recipe Saffron pasted ≠ Sticky Soy —
  it's the already-populated "Phò Inspired Chicken Broth and Rice" (581/36). **§B closed (14/14).**
- **Batch J** — §G macro-completeness: filled all 34 (17 all-null, 17 fibre/sugar-only) +
  Blueberry Protein Yoghurt Bowl (sugar). **§G closed (34/34).**
- **Batch K** — deduped High Protein Salmon Potato Salad (soft-deleted identical dup, filled
  survivor 895/44/80/45/19.5/13); Marinated Fish Tacos → serves 3, 540/45/45/20/5/9.
- **Batch L** — §C traybake + rice-salad dedupes: kept "Roast Chicken and Charred Corn Rice
  Salad" (488) + "Chicken and Potato Traybake" (448), soft-deleted the two duplicates.
  **§C closed (3/3).**
- Final commit: rewrote `remaining-work.md` intro into a ▶ RESUME HERE banner.

Method throughout: pull `ingredient_sections` from Supabase, recompute per-serving 6 macros
staple-grounded (staple_products values, light-coconut default, faithful listed quantities),
write via `execute_sql`, verify with a read-back, tick the worklist, log the batch.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| Supabase `recipes` rows | ~55 rows updated + 5 soft-deleted (deduped) across Batches E–L | Modified | Supabase `jsxcctrskkkxgdxfaduo` |
| logs/macro-audit.md | Batch E–L entries appended | Modified | /home/user/daily-shuffle/logs/ |
| logs/remaining-work.md | §B–§G ticked; ▶ RESUME HERE banner added; counts refreshed | Modified | /home/user/daily-shuffle/logs/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

No `index.html`/`sw.js`/`manifest.json` change.

## Decisions & Reasoning
- **Rice-exclusion**: where a "rice/base to serve" line had no qty, computed WITHOUT it per
  Saffron's standing instruction, adding a notes line "+~200 kcal / +44g carbs per 150g cooked
  rice". Applied to Katsu, Thai Satay, Mediterranean Skillet, Honey Sesame, Chipotle Skillet, etc.
- **Soft-delete over hard DELETE** for all dedupes: set `import_status='deleted'` (matches the
  Batch C convention), never a destructive SQL DELETE.
- **Cinnamon Roll pair naming**: Saffron gave two recipes both titled "Cinnamon Roll Baked Oats".
  The @tracesoats one already existed as "Air Fryer Cinnamon Roll Oats" — renamed rather than
  creating a duplicate. Flagged that its DB oat base says "cinnamon roll cookie butter" vs her
  paste's "almond butter"; left as-is pending her call.
- **Sticky Soy Chicken**: Saffron corrected two of my assumptions — rice is COOKED (not the 1 cup
  dry I'd assumed, ~460 kcal less) and chicken → 2 breasts, serves 2. Edited the ingredient list
  (1→2 breasts) per her explicit instruction (authorized edit to otherwise-read-only source).
- **GF Cinnamon Buns**: recipe text says "cut into 6" but 800g flour ÷6 is an implausible bun;
  Saffron chose serves 12 → 585/bun. Old 488 had under-counted the flour/honey/frosting.
- **§G cal/protein trusted**: for the 34 fills, kept existing (audit-confirmed) cal/protein and
  computed the missing fields; where a line-item compute exceeded stored cal, kept carbs/fat
  roughly cal-consistent rather than inflating — fibre/sugar (the actually-missing fields)
  computed directly.

## Current State (end of session)
§B, §C, §D, §E, §F, §G all fully closed and written to Supabase. `remaining-work.md` has a
▶ RESUME HERE banner. **Only §A remains: 93 under-count recomputes** (18 already done). PR #48 is
open (draft) on branch `claude/pr-47-outstanding-sections-ucxebb`, auto-watched.

## Next Steps
1. Start §A: pick the first unchecked `- [ ]` in §A of `remaining-work.md` (alphabetical, e.g.
   "4 Ingredient Rice Cake Chocolate Bars — 165→266"), pull its `ingredient_sections` from
   Supabase `recipes`, recompute 6 macros per serving staple-grounded (same method as Batches
   B–L), write via `execute_sql`, clear resolved `review_flags`, read-back to verify.
2. Work §A in alphabetical batches of ~15–20; tick each line in `remaining-work.md` and append a
   batch entry to `macro-audit.md`; commit + push per batch on the same branch.
3. Route the 5 judgement-call items to Saffron rather than naive-computing (see banner): Thai Red
   Curry Pot Roast Chicken (whole-bird rendering), Pho Gà (soup fat-render/meat-yield), Middle
   Eastern Chicken & Rice Bowl (rice qty missing), Basic Oat Flour Pancakes (serving basis),
   Chicken and Potato Traybake (optional §C-survivor fat recompute).

## Open Questions / Blockers
- **Cinnamon Roll Baked Oats @tracesoats**: DB lists "cinnamon roll cookie butter" where Saffron's
  paste says "almond butter + cinnamon" — flagged, left as-is (641 macros) pending her preference.
- The app→DB sync bug remains unfixed (in-app edits to bundled recipes stay in localStorage, never
  reach Supabase). This is why §B recipes came back with empty/null DB ingredient lists. Worth a
  proper `index.html` fix at some point (noted in PR #47/#48 bodies).

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`. Branch: `claude/pr-47-outstanding-sections-ucxebb`
  (reset at session start to origin/`claude/remaining-work-clarification-uxc73y`, PR #47's head).
- PR **#48** (draft, auto-watched) carries all Batch E–L commits.
- Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes`. Writes via Supabase MCP `execute_sql`.
  Commit signing: user.email must be `noreply@anthropic.com` (a stop-hook flags unverified commits).
- No cache bump (data-only). Staple macros from `staple_products` (~167 rows).

## Notes & Gotchas
- **Do not naive-recompute deleted rows.** Five rows were soft-deleted this session
  (`import_status='deleted'`): pumpkin Butternut Protein Brownie, one Salmon Potato Salad dup,
  Roast Chicken Rice Salad, Easy Chicken Traybake, + earlier Batch C deletions. The §A worklist
  lines for the deleted traybake/rice-salad were retitled "DELETED as §C duplicate".
- **§A survivor exception**: "Chicken and Potato Traybake" (448, §C survivor) may still want the
  §A fat recompute (skin-on legs+thighs+Flora ~589) — left flagged/unchecked in §A.
- Faithful-quantity computes routinely land ABOVE the old rough stored values (full oils, skin-on
  chicken, full mayo). This is expected — the old placeholders under-counted. Don't "correct"
  downward without a reason.
- Two recipes still can't be auto-done: Marinated Fish Tacos is now done (serves 3), but any other
  null-serves recipe needs a serves count first.

# Add Recipe — Chicken Mince Konjac Japchae
**Date:** 2026-07-19
**Project:** Daily Shuffle — recipe library (Supabase `recipes`)
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — recipe is live in the app

---

## Project Context
One-off recipe addition to the bundled Supabase recipe library
(`jsxcctrskkkxgdxfaduo`), which backs the live PWA. See CLAUDE.md "Data & sync" and
the `recipe-db` skill for the schema. The app fetches `recipes?import_status=eq.ready`
(index.html:1511) network-first and caches to `ds_recipe_cache`, so a data insert with
`import_status='ready'` makes the recipe appear on the next app open — no `index.html`
or `sw.js` change, no cache bump.

## Session Goal
Add Saffron's "Chicken Mince Konjac Japchae" (serves 5) to Supabase and the app.

## State Before This Session
`recipes`: 336 total / 310 ready. A **sibling** recipe already existed —
"Glass & Konjac Chicken Japchae" (id `b8bb9c91…`, chicken **breast** + frozen veg,
serves 4, different sauce). The new recipe is a distinct variant (chicken **mince 5%**,
fresh mushrooms/carrots/red onion, MSG + fish sauce + sweet-chilli sauce), so it was
added as a **new row**, not an overwrite of the sibling.

## What Was Done
Inserted one row into `recipes` via Supabase MCP `execute_sql`, mirroring the sibling
recipe's field conventions:
- `ingredient_sections` jsonb → two sections MAIN (8 items) + SAUCE (8 items), each item
  `{qty,name,note,unit,group}` matching the existing shape. Garlic entered as
  `qty:4, unit:"clove"`; red onions `qty:3, unit:null`; noodles/mince/veg in grams;
  sauce liquids in ml, brown sugar in g.
- `method_steps` text[] → the 7 steps verbatim (step 2's "just under" phrasing kept).
- Classification: `meal_type='dinner'`, `meal_types=['lunch','dinner']`,
  `protein_source='chicken'`, `cuisine='korean'`, `carb_type='none'` (matches the
  sibling — konjac-based), `serves=5`, `cost_tier='2'`, `prep_cook_time='35 minutes'`,
  `craving_tags=['savoury','highprotein','glutenfree','asian','comfort','healthy']`.
- **Macros are an estimate** (flagged in `notes`). **Corrected mid-session** after
  Saffron asked whether they drew from `staple_products` — the first pass (590/46/47/13/
  9/15) was a hand guess that did NOT. Recomputed grounded in `staple_products` where
  available and updated the row to per serve **cal 515 / protein 51 / carbs 50 / fat 13
  / fibre 9 / sugar 14**. Grounded items: chicken mince 5% (135 kcal·22 g P/100 g — the
  hand guess had over-used ~172, hence the −75 kcal calorie drop), GF reduced-salt soy
  (Emma Basic), fish sauce, brown sugar, carrot, red onion, garlic granules, sesame oil,
  rice vinegar. Still generic (not in staples): konjac noodles, sweet potato glass
  noodles, mushrooms, cornstarch, sweet chilli sauce, MSG. Not from the nutrition
  pipeline (step 3 still blocked); ≈ ±10% on calories, protein tightest.
- id / created_at / updated_at left to defaults (`gen_random_uuid()`, `now()`).
- New id: `7670cb5c-e6ef-437e-bc3b-fd0780b4e19d`.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| Supabase `recipes` row | New recipe `7670cb5c…` | Created | Supabase `jsxcctrskkkxgdxfaduo` |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

No `index.html` / `sw.js` / `manifest.json` change — app is data-driven from Supabase.

## Decisions & Reasoning
- **New row, not overwrite of the sibling japchae**: different protein form (mince vs
  breast), different vegetables (fresh vs frozen) and a materially different sauce (adds
  fish sauce, MSG, sweet chilli). Two legitimately distinct recipes.
- **Macros included as an AI estimate rather than left null**: the sibling recipe carries
  estimated macros and the app surfaces macros in Shuffle/Tracker; a filled estimate is
  more useful than null. Flagged clearly in `notes` so it's not mistaken for measured.
  If Saffron wants them blanked or recomputed via the real pipeline, easy to update by id.
- **No cache bump / no code change**: recipe delivery is pure data
  (`import_status=eq.ready`); CLAUDE.md says data-only changes don't need a `sw.js` bump.

## Current State (end of session)
Recipe live: `recipes` now 337 total / 311 ready. Row verified read-back — 2 sections,
7 steps, `import_status='ready'`, `is_hidden=false`. It will appear in the app on next
open (network-first recipe fetch refreshes `ds_recipe_cache`).

## Next Steps
1. None required. Optional: if Saffron reviews the macros and wants them exact, update
   row `7670cb5c-e6ef-437e-bc3b-fd0780b4e19d` once nutrition step 3 is unblocked.

## Open Questions / Blockers
N/A.

## Environment & Config Notes
Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/chicken-konjac-japchae-recipe-v6uboe`.
Supabase project `jsxcctrskkkxgdxfaduo`, table `recipes`, open anon RLS. No cache bump
(current `sw.js` version unchanged). No credentials handled.

## Notes & Gotchas
- Don't confuse this with the sibling **"Glass & Konjac Chicken Japchae"** (`b8bb9c91…`) —
  they're near-namesakes but different recipes; both are meant to exist.
- `carb_type='none'` is deliberate (konjac-forward, small glass-noodle portion) and
  matches the sibling — leave it unless Saffron reclassifies.

---

# Redesign Ship — Merge to Main, Icon, Layout Fixes, Repo Cleanup
**Date:** 2026-07-17
**Project:** Daily Shuffle — mobile redesign finalisation + repo hygiene
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — mobile redesign is now live on `main`; desktop layout remains the next deliverable

---

## Project Context
Directly continues the 2026-07-15 entry (mobile editorial redesign — full oxblood/cream + Fraunces + bottom-tab-bar reskin of every screen, built on branch `claude/mobile-redesign-foundation`). That session left the redesign committed but **not merged** and flagged desktop as next. This session shipped it to `main`, resolved a competing design refresh already on main, cleaned up branches + a docs collision, added the app icon, and fixed three layout bugs. See 2026-07-15 for the full redesign detail — not repeated here.

## Session Goal
Merge the mobile redesign to `main`; reconcile it against the parallel design work already on main; clean up obsolete branches and a HANDOFF file collision; replace the off-brand app icon with the on-brand 1a mark; fix reported layout overflows (Add form, Tracker margins, Shuffle controls); align PWA chrome colours to the oxblood register.

## State Before This Session
Redesign complete on `claude/mobile-redesign-foundation` at commit `2b2f61d`, unmerged. `origin/main` had **diverged 13 commits** since the branch was cut — critically including PR #41 (`991b2b2 "Apply design refresh to index.html"`), a **separate, competing** design refresh to the same file from another session. A pre-existing uncommitted `HANDOFF.md` change was in the working tree. ~18 remote branches existed, most stale.

## What Was Done
1. **Merge reconciliation (the load-bearing decision).** A merge of the branch into main conflicted in `index.html`, `sw.js`, `logs/daily-shuffle_log.md`. Verified via `git log --oneline 70da8fa..origin/main -- index.html` that the **only** commit touching `index.html`/`sw.js` since the branch base was PR #41's design refresh — i.e. taking our version discards *only* the competing design, zero functional/backend work. Saffron chose "this redesign wins." Resolved `index.html`+`sw.js` with `--ours`, took main's log with `--theirs` then spliced our entry on top, kept all of main's other new files (BRAND.md, MONETIZATION.md, quantity-normalisation-plan.md, CLAUDE.md rewrite, 4 skills, scripts). Smoke-tested the merged tree in-browser before committing. Fast-forwarded `origin/main` (`ef012a3..557a4c2`, no force).
2. **Branch cleanup.** Classified all remote branches by `git branch -r --merged origin/main` + per-branch `merge-base --is-ancestor` checks. Deleted **11 obsolete** remote branches (merged, session-log-only, or superseded — incl. `update-root-index-html-hzmwfx` whose design PR #41 was the one we overrode). Kept 4 with genuinely un-landed code (see Open Questions). Corrected an earlier misread: `daily-shuffle-foundations-C2e6Q`'s keep-alive workflow is already identical on main (obsolete too, left for Saffron to confirm-delete). Deleted 2 stale local branches.
3. **HANDOFF.md case-collision.** The perpetual "modified HANDOFF.md" was **not a real edit** — `HANDOFF.md` and `handoff.md` are one physical file on case-insensitive macOS; git tracks both paths; the physical file held `handoff.md`'s Apify-pipeline content, so git reported the uppercase path as modified forever. Fixed: salvaged the unique cost-aware-features vision from the uppercase roadmap into `handoff.md`, `git rm --cached HANDOFF.md`, updated the CLAUDE.md pointer. Working tree is finally clean.
4. **App icon → design 1a.** Prototype `Daily Shuffle - App Icon.dc.html` (in `~/Documents/Claude/PERSONAL/Daily_Shuffle/daily-shuffle-prototype-screens-1/`) offered 4 directions; Saffron picked **1a "Oxblood · cream mark"**: full-bleed oxblood radial gradient (`#5c1a1f→#3D0F13→#2a090c`) + cream `#F3ECD8` shuffle-loop glyph. No SVG→PNG CLI tools available (no rsvg/imagemagick/inkscape/sharp), so authored the brand SVG and rasterised via **macOS `qlmanage -t`** (QuickLook) at 512 and 192 — verified crisp in-browser. Maskable-safe (full-bleed, glyph at 56% inside safe zone; manifest icons are `purpose:"any maskable"`).
5. **Layout fixes (all the same root cause).** The app is a fixed ~430px column but its responsive rules key off **viewport width** (`@media max-width:768px`), which never fires on desktop — so multi-column grids overflow the column. Fixed three: **Add form** (`#tab-add .form-grid → 1fr` + full editorial restyle of the form), **Tracker** side margins (`.trk-wrap` padding `4px 0` → `4px 22px`), **Shuffle controls** (`#tab-plan .control-group/select/input { min-width:0 }` so the native date input shrinks to its `1fr` cell instead of stretching past the card). Also stripped remaining emoji (`deEmoji()` helper over the label-map constants + manual sweeps), rebuilt Grocery rows to the prototype catalogue design, reskinned Shuffle day cards, and reconciled cafe/coastal to accent-only swaps.
6. **PWA chrome colours → oxblood.** `index.html` `<meta name="theme-color">` was still the old light `#F5F2EC`; manifest `theme_color`/`background_color` were `#120d0b`. Set all to `#3D0F13` (the CTA/tab-bar/icon oxblood). Also replaced the stale per-theme JS colour map (`natural/cafe/coastal → F5F2EC/F1EEEB/FFFFFF` at ~line 1381) with a constant `#3D0F13`, since alt themes are now accent-only on one cream/oxblood base.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | Redesign merged; Add/Tracker/Shuffle overflow fixes; theme-color meta + JS map → oxblood | Modified | /Users/saffron/daily-shuffle/ |
| sw.js | Cache bumped across the session, now **v36** | Modified | /Users/saffron/daily-shuffle/ |
| manifest.json | theme_color + background_color → `#3D0F13` | Modified | /Users/saffron/daily-shuffle/ |
| icon-192.png / icon-512.png | Regenerated as the 1a oxblood/cream shuffle mark | Modified | /Users/saffron/daily-shuffle/ |
| handoff.md | Appended salvaged cost-feature roadmap from the retired uppercase file | Modified | /Users/saffron/daily-shuffle/ |
| HANDOFF.md | Untracked (case-collided with handoff.md) | Deleted (from index) | /Users/saffron/daily-shuffle/ |
| CLAUDE.md | Updated handoff-docs pointer | Modified | /Users/saffron/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry + merged main's log entries | Modified | /Users/saffron/daily-shuffle/logs/ |

## Decisions & Reasoning
- **Redesign wins over PR #41's design refresh**: Saffron's call. De-risked first by confirming PR #41 was the *only* index.html change on main since the branch base, so nothing functional was lost — only a competing visual pass discarded.
- **`qlmanage` for SVG→PNG**: no rasteriser was installed and installing one wasn't warranted for two icons; QuickLook ships with macOS, renders SVG gradients + stroke paths faithfully, and produced exact-dimension PNGs. Verified visually rather than trusting it blind.
- **Single oxblood `#3D0F13` for all theme-colors** (not per-theme): the redesign collapsed the three themes to accent-only swaps on one cream/oxblood base, so the browser chrome should be constant. The old per-theme map was stale light values.
- **Left the 4 un-landed-code branches undeleted**: they hold work not on main (see below) — deleting them loses it. Only deleted branches proven fully-merged or session-log-only.
- **Kept manifest → oxblood rather than cream**: the launch splash + chrome reading as the brand oxblood matches the icon and tab bar; a cream chrome would clash with the dark backdrop the mobile column sits on.

## Current State (end of session)
Mobile redesign is **live on `main`** (last shipped tip before this log commit: `fc56549`, the Shuffle controls fix). Icon 1a live. Add/Tracker/Shuffle overflow bugs fixed and verified at 390px. This session's final code change — the theme-colour/manifest oxblood alignment + SW **v36** — is committed on `claude/mobile-redesign-foundation` alongside this log entry, **pushed to the branch but NOT yet merged to main** (no merge instruction given this turn; awaiting Saffron's go). Working tree clean. JS parses clean (3 blocks, 0 errors); manifest is valid JSON.

## Next Steps
1. **Merge the theme-colour + log commit to main** if Saffron approves (same fast-forward pattern: `git branch -f main <branch> && git push origin <branch>:main`). Direct-push-to-main is gated by the safety classifier and needs per-turn authorisation.
2. **Desktop layout — THE next deliverable.** Branch fresh off current `main` (it keeps moving). The core problem, now proven three times (Add form, Tracker, Shuffle controls): **responsive rules key off viewport width but the app is a fixed-width column**, so any multi-column grid overflows on desktop. Solve structurally — either a max-width breakpoint that expands the column into a real multi-pane desktop shell (side nav replacing the bottom tab bar, multi-column recipe grid, side-by-side plan+grocery), or container-query-based components. Decide the desktop IA with Saffron before building (consider another Claude Design pass — that workflow has worked well three times now).
3. Optional carry-over polish: recipe cards/detail hero still use gradient placeholders (no photography); the prototype's full-screen recipe-detail hero + "Add to plan" sticky flow was not built.

## Open Questions / Blockers
- **Desktop IA undecided** — side nav vs. bottom bar, how the column expands, plan+grocery side-by-side. Needs a design decision before implementation.
- **4 un-landed-code branches to triage** (kept, not yet actioned): `daily-shuffle-qty-normalisation-d8su8h` (quantity-normalisation script + applied ruleset, "DB write pending"), `recipe-ingredient-prices-RYSob` (19-commit ingredient CSV pipeline, possibly partly superseded), `gallant-wright-xo9frd` (Apify `--resume` + quota detection, confirmed absent from main's script), `recipe-null-supabase-GnoDV` (old RLS migration, may be superseded). Plus `daily-shuffle-foundations-C2e6Q` (now confirmed obsolete — safe to delete). Decide which to land vs. delete.
- No recipe photography exists; a source + storage decision is needed before the photo-hero designs can ship.

## Environment & Config Notes
- Repo `/Users/saffron/daily-shuffle`, working branch `claude/mobile-redesign-foundation`; `main` fast-forwards to it. Remote `origin` = github.com/saffronlm-cmyk/daily-shuffle. No open PR — merges done by direct fast-forward push.
- **Service worker at v36.** Bump on every shippable index.html/asset change (the project's #1 "my fix isn't showing" cause).
- Icon prototype + handoff bundle live under `~/Documents/Claude/PERSONAL/Daily_Shuffle/daily-shuffle-prototype-screens-1/` (also zipped as `Daily Shuffle icone-handoff.zip`). Design tokens under its `_ds/…/tokens/`.
- Two handoff docs on main, distinct: `handoff.md` (Apify price pipeline + salvaged cost-feature roadmap). The uppercase `HANDOFF.md` is gone.

## Notes & Gotchas
- **macOS case-insensitive FS**: never keep two files differing only in case (`HANDOFF.md`/`handoff.md`) — git shows a permanent phantom "modified" and only one can physically exist. Resolved this session.
- **The fixed-column-vs-viewport-media-query trap is systemic**: every `@media (max-width: …)` rule in the file is dead on desktop now that the app is a fixed ~430px column. Any grid using viewport breakpoints will overflow until desktop is built properly. Fix new grids with `min-width:0` + column-scoped single-column rules as a stopgap; solve structurally in the desktop pass.
- **`qlmanage` quirk**: it writes `<name>.svg.png` in the `-o` dir and resets shell cwd after running — use absolute paths and `mv` the output.
- **`deEmoji()` runs once at load** over the label-map constants; emoji hardcoded in markup/JS strings are NOT auto-stripped (swept manually this session). New emoji added to the constant maps get stripped automatically.
- SW is now v36 — if verifying in-browser, a stale SW will serve old CSS/manifest; hard-reload with a `?v=` query or bump again.

---

# Mobile Editorial Redesign — Foundation + All Screens Re-skinned
**Date:** 2026-07-15
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete (mobile) — desktop layout is the next session's work

---

## Project Context
See earlier entries (2026-07-01 nutrition estimation; 2026-06-25/29 ingredient + parser work) for data/architecture background. This session was a **visual redesign stream**, orthogonal to the price/nutrition data work. Saffron used Claude Design (claude.ai/design) to mock up a mobile-first editorial reskin of the app and exported two handoff bundles; this session implemented them on the live repo.

## Session Goal
Implement the Claude Design high-fidelity prototypes as a mobile-first editorial redesign of the whole app — new oxblood/cream + Fraunces brand register, floating bottom tab bar, and every screen re-skinned — **without breaking any existing functionality**. Desktop layout explicitly deferred to a later session.

## State Before This Session
App was desktop-oriented: top header + horizontal emoji nav, light cream/taupe theme (`--bg #F5F2EC` etc.), plain cards. Single-file `index.html` (~6,200 lines, grew to ~6,500). No design tokens beyond the three legacy theme blocks. On branch `claude/focused-darwin-enipb5` with an unrelated uncommitted `HANDOFF.md` edit (price-book stream — left untouched all session).

## What Was Done
Worked in four passes, verifying each in-browser via a localhost server + Chrome automation (file:// is blocked by the extension, so `python3 -m http.server 8747` was used throughout).

1. **Foundation + Recipe Library proof** (plan-approved first). Added the prototype's design tokens to `:root` (namespaced `--fn-*`/`--ed-*`/`--cta`, Fraunces via Google Fonts with Georgia fallback, radii/shadow/glass). Inlined the needed Lucide icons as a hidden `<svg><symbol>` sprite at top of `<body>` (offline-safe, no new network requests — deliberate, the app is cache-first PWA). Wrapped the app as a ~430px mobile column centered on a dark `#2A2320` backdrop on wide screens. Added a floating oxblood bottom tab bar (markup after `</main>`) wired to the **existing** `switchTab()` (added a `.tabbar` active/dot sync line inside it). Relocated settings to a top-corner icon. Re-skinned Recipe Library: kicker + Fraunces title, pill search + filter button, restyled `#recipesFilterbar` chips, and rewrote the `renderRecipes()` card template to the prototype's image cards (gradient placeholders, archival `No. 0NN` badges, glass hearts using `--ed-oxblood-bright`, hero + 2-col grid). Updated `toggleFav()` selectors from `.recipe-card/.fav-btn` → `.rl-card/.rl-fav`.

2. **Rolled the register across the other four tabs.** Rather than replace the app's richer functionality with the simpler mockups, **remapped the legacy `:root` tokens** (`--bg`, `--surface`, `--accent`, `--text`, …) to the editorial palette so modals + every un-bespoke screen inherit cream/oxblood at once; then gave Shuffle / Grocery / Add / Tracker editorial headers (kicker + Fraunces title) and pill-styled primary actions (oxblood CTA).

3. **Two bespoke prototypes** (second bundle: `daily-shuffle-prototype-screens-1`, which added the Recipe Detail + Nutrition designs the first bundle lacked). **Nutrition Dashboard**: full rewrite of `renderTracker()` — oxblood editorial stat strip (Eaten/Burned/Deficit), calorie hero card with a real SVG progress ring, name-leads macro cards, per-meal log cards; `trkEntryRow()` reskinned to `.nd-logrow`. **Recipe Detail modal**: restyled `openModal()`'s output — kicker + `No. 0NN` archive mark, Fraunces title, icon meta row (users/clock/££), oxblood pill multiplier, numbered-circle method, compact single-line nutrition tiles. Kept it as the app's feature-rich centered modal (edit/delete/cost/tips/estimate) rather than the prototype's full-screen photo-hero + "Add to plan" sticky bar, since the app has no recipe photos and no add-to-plan-from-detail action.

4. **Cleanup pass** (Saffron's follow-ups). Stripped emoji app-wide per the no-emoji brand rule via a `deEmoji()` helper that mutates the label-map constants at source (`CRAVING_LABELS`, `PROTEIN_LABELS`, `MEAL_TYPE_LABELS`, `CARB_TYPE_LABELS`, `CUISINE_EMOJI`, `PROTEIN_EMOJI`, `FILTER_CHIPS`) plus targeted edits + `perl -i` sweeps for inline-markup and JS status strings. Removed Grocery header duplication and rebuilt grocery rows to the prototype's catalogue design (round oxblood check + colour swatch + stacked name/qty + price). Gave Shuffle day cards the editorial register. Reconciled cafe/coastal alt themes to accent-only swaps on the shared base.

5. **Two layout bugs** (Saffron's final follow-ups). Tracker had no side margin (`.trk-wrap` padding was `4px 0 60px`) → `4px 22px 60px` + de-doubled the header inline padding. Add Recipe form overflowed and looked off-brand: **root cause = responsive breakpoints key off viewport width (`@media max-width:768px`), which never fires now that the app is a fixed 430px column on desktop**, so `.form-grid` stayed 2-col and spilled the card. Fixed with `#tab-add .form-grid { grid-template-columns: 1fr }` and a full editorial restyle of the Add form (cards, inputs, chips, buttons). Hit the project's classic **stale-service-worker trap** mid-verify — a reload showed no change until the SW cache was bumped; confirmed via a `?v=` cache-busted URL.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | The entire app — all redesign markup/CSS/JS changes | Modified | /Users/saffron/daily-shuffle/ |
| sw.js | Service worker — cache bumped v32 → v34 | Modified | /Users/saffron/daily-shuffle/ |
| HANDOFF.md | Pre-existing price-book edit — **NOT touched/committed** this session | Untouched | /Users/saffron/daily-shuffle/ |

Committed as `342bc14` on branch `claude/mobile-redesign-foundation` (index.html + sw.js only). Not pushed, not merged, not deployed.

## Decisions & Reasoning
- **Additive tokens, then remap legacy tokens** rather than find/replace every hardcoded colour: kept the diff safe and let un-bespoke screens inherit the register for free.
- **Inline SVG sprite, not icon files**: preserves the single-file, offline-first, no-new-requests nature of the PWA.
- **Kept app functionality over prototype simplicity**: the mockups (esp. Shuffle/Grocery/Recipe-Detail) are thinner than the shipped features; adapted the *look* onto the real feature set rather than downgrading.
- **Recipe Detail stayed a centered modal**, not the prototype's full-screen hero — no recipe photos exist and there's no "add to plan from detail" action to anchor the sticky CTA.
- **Left HANDOFF.md out of the commit**: it's an unrelated uncommitted change from the price-book stream that predates this work.
- **Mobile-only for now**: all new layout assumes the ~430px column; desktop is a separate deliberate effort (next session).

## Current State (end of session)
Full mobile editorial redesign is live on the branch and verified in-browser across all five tabs + Recipe Detail modal: tab bar switches with active dots, favourites toggle + persist, cards open the detail modal, search/filters work, grocery checks toggle, tracker renders real data, Add form saves. JS parses clean (3 inline `<script>` blocks, 0 errors via the `new Function()` check). SW at v34.

## Next Steps
1. **Desktop layout / webpage adjustment — THIS IS THE NEXT DELIVERABLE.** The mobile redesign is now **merged and live on `main`** (fast-forwarded to the merge commit; the redesign won the reconciliation against the parallel PR #41 design refresh, which was discarded). The whole redesign currently assumes a fixed ~430px mobile column; the key structural issue to solve first is that **responsive rules key off viewport width but the app is a fixed-width column**, so a real desktop layout needs either (a) a max-width breakpoint that expands the column into a multi-pane desktop shell (e.g. persistent side nav instead of the bottom tab bar, multi-column recipe grid, side-by-side plan+grocery), or (b) container-query-based components. **Decide the desktop information architecture with Saffron before building** — and branch fresh off current `main` (it moved 13 commits during the mobile work, so re-diverging is a real risk).
2. Optional polish carried over: recipe cards still use gradient placeholders (no photography); the prototype's full-screen recipe-detail hero + "Add to plan" flow was not built.

## Open Questions / Blockers
- **Desktop IA is undecided** — bottom tab bar vs. side nav, how the mobile column expands, whether plan+grocery go side-by-side. Needs a design decision with Saffron before implementation (worth another Claude Design pass or a plan-mode discussion).
- No recipe photography exists; cards/hero use warm gradient placeholders. Real images would need a source + storage decision.

## Environment & Config Notes
- Repo: `/Users/saffron/daily-shuffle`, branch `claude/mobile-redesign-foundation` (created off `claude/focused-darwin-enipb5`). Remote `origin` = github.com/saffronlm-cmyk/daily-shuffle. Commit `342bc14` local-only.
- Verify loop: `python3 -m http.server 8747` in the repo, open `http://localhost:8747/index.html` (file:// blocked by the Chrome extension). Bump `sw.js` CACHE or use a `?v=` query when a reload "doesn't show" — SW is cache-first for assets.
- JS sanity check (no linter/bundler): extract inline `<script>` blocks and `new Function(src)` each — used all session, kept at 0 errors.
- Prototype bundles: `~/Downloads/daily-shuffle-high-fidelity-prototypes` (screens 1: library/shuffle/grocery/add + 4 editorial screens) and `~/Downloads/daily-shuffle-prototype-screens-1` (Recipe Detail + Nutrition + a design-system change memo). Design tokens live under each bundle's `_ds/…/tokens/`.

## Notes & Gotchas
- **Design tokens are namespaced**: bespoke screens use `--fn-*`/`--ed-*`/`--cta`; the legacy `--bg/--surface/--accent/--text` were *remapped* to the same palette so both coexist. Don't delete the legacy vars — lots of un-migrated inline styles still reference them.
- **`deEmoji()` runs once at load** over the label-map constants — new emoji added to those maps get stripped automatically; emoji hardcoded in markup/JS strings do not (had to sweep those manually).
- **Two prototype bundles, not one**: the 4 editorial screens (Splash/Onboarding/Empty/Weekly-recap) from bundle 1 were **deferred** and never built — they're new features, not reskins.
- **Fraunces loads from Google Fonts** — degrades to Georgia offline. Acceptable for now; revisit if full-offline serif fidelity matters.
- Standard project gotcha reconfirmed: the service worker will serve stale HTML/CSS after an edit — bump `sw.js` CACHE every shippable change (now v34).

---

# Claude Config Audit — CLAUDE.md rewrite, 4 skills, browser smoke test, drift automation
**Date:** 2026-07-05
**Project:** Daily Shuffle — agent config / dev tooling
**Mode:** Rolling Log + GitHub Push
**Status:** Complete

---

## Project Context
Housekeeping session on the agent-facing config rather than the app itself. Saffron asked for a full audit of CLAUDE.md, `.claude/skills`, and `.claude/agents` (dry-run first, then execute), plus a new browser smoke-test workflow. See the 2026-07-01 entries for the state of the nutrition workstream — unchanged this session.

## Session Goal
Audit and rewrite every instruction file, create the missing skills a repo this shape needs, and add a runnable headless-browser smoke test — first as a reviewed dry-run, then applied on approval.

## State Before This Session
CLAUDE.md was stale in ways that actively misled: it described `sw.js` as cache-first at `v23` when it had been rewritten to network-first-for-HTML and was at `v32`, said `canonicalise()` lived in three places (it's five), and didn't mention the USDA pipeline, the normalisation workstream/CSVs, either handoff doc, or the keep-alive workflow. `.claude/skills` held only `save-conversation` — a personal cross-machine skill with `~/Documents` paths, other projects' routing tables, `gh` CLI and `present_files` references, and a push-to-main workflow, none of which apply here. `.claude/agents` didn't exist. The repo had zero runtime verification (parse-check only).

## What Was Done
- **Inventory + audit** of everything in CLAUDE.md and `.claude/`, presented as a full dry-run with proposed file contents; Saffron approved and added one request: also build the browser smoke-test workflow (previously flagged as "the missing piece").
- **Rewrote CLAUDE.md**: corrected the sw.js description (network-first, one-bump-per-PR, no bump for doc/data-only changes, never trust doc-recorded version numbers), canonicalise now documented in five places, added the USDA staples pipeline, `tools-apply-master.mjs`, the committed data CSVs ("reviewed human decisions — don't regenerate"), both handoff docs, the keep-alive workflow, the nutrition 3-step status (with the step-3-blocked-on-step-2 rule), branch/PR conventions, a concrete JS parse-check command, and slimmed the session-logging block to a pointer at the skill.
- **Rewrote `save-conversation` SKILL.md** as repo-local: one mode only (rolling log at `logs/daily-shuffle_log.md`, prepend, commit on the working branch, never main), unified template (kept `Mode:`, dropped the unused "Skills Used" section), named the 2026-07-01 §6 entry as the reference standard, added do-nots.
- **Created `ship-check` skill**: 6-step pre-commit checklist (parse check → smoke test → cache-bump decision → canonicalise sync → res.ok audit → localStorage audit) with a fixed checklist output format.
- **Created `recipe-db` skill**: Supabase schema map + propose/review/apply/verify discipline for bulk writes, encoding the locked §6 decisions and the review-CSV convention.
- **Built `scripts/smoke_test.mjs` + `smoke-test` skill**: Playwright/Chromium headless test that serves the repo over a local HTTP server, seeds `ds_recipe_cache` with 5 fixture recipes (one per meal pool), and asserts clean boot, 5 tab containers, tab switching, and that `generatePlan()` renders the fixtures into `#planOutput`. **Ran it — 5/5 green.** First run failed: fixtures lacked `cuisine`/`proteinSource`, which the recipe-card template calls `.charAt()` on unguarded; real cloud recipes always have them, so the fix was fixture-side (noted in the script and skill as a trap).
- **Deliberately created no `.claude/agents`**: built-in Explore/Plan agents already cover the only plausible use (navigating the 6,000-line index.html); a custom agent set would be bloat for a solo no-CI repo.
- **Built CLAUDE.md drift automation** (follow-up request): `scripts/claude_md_drift.mjs` mechanically diffs CLAUDE.md's claims against the repo — tabs (both directions), scripts/ files documented, root .md/.csv/.mjs files documented, every `canonicalise()` implementation named in the sync list, sw.js passthrough hosts. Verified it detects (flagged its own then-undocumented self when staged) and passes clean once documented. Wired in three places: ship-check step 7, a "Keep this file true" bullet in CLAUDE.md's Dev workflow, and a **weekly scheduled routine** (`trig_012FVP34K8kH664FDZayj6Lb`, Mondays 07:00 UTC, fresh session, push-notify): runs the script, skims the week's merged diffs and the log's top entry for judgement-level drift the script can't catch (workstream status, conventions, data model), and opens a draft PR with minimal factual edits only when something is stale — otherwise ends silently.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| CLAUDE.md | Project brief — corrected + expanded rewrite | Modified | /home/user/daily-shuffle/ |
| .claude/skills/save-conversation/SKILL.md | Session-log skill, now repo-local, single source of truth for the template | Modified | /home/user/daily-shuffle/.claude/skills/save-conversation/ |
| .claude/skills/ship-check/SKILL.md | Pre-commit checklist skill | Created | /home/user/daily-shuffle/.claude/skills/ship-check/ |
| .claude/skills/recipe-db/SKILL.md | Supabase bulk-work conventions skill | Created | /home/user/daily-shuffle/.claude/skills/recipe-db/ |
| .claude/skills/smoke-test/SKILL.md | Smoke-test runner/extender skill | Created | /home/user/daily-shuffle/.claude/skills/smoke-test/ |
| scripts/smoke_test.mjs | Headless-browser smoke test (5 checks, offline, exit-code gated) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/claude_md_drift.mjs | Mechanical CLAUDE.md drift check (5 checks, exit-code gated) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/README.md | Added smoke-test + drift-check sections at top | Modified | /home/user/daily-shuffle/scripts/ |
| (Routine, not a file) | Weekly CLAUDE.md audit trigger trig_012FVP34K8kH664FDZayj6Lb, Mon 07:00 UTC | Created | Claude Code Remote environment |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

## Decisions & Reasoning
- **Template lives in the skill, CLAUDE.md just points at it**: the two copies had already drifted (skill had `Mode:` + "Skills Used"; CLAUDE.md had neither). One source of truth; the always-loaded CLAUDE.md keeps only the trigger rule, saving context every session.
- **No version numbers in docs**: CLAUDE.md said `v23` while sw.js was at `v32` — that class of staleness is structural, so the rewrite says "read it from sw.js" instead of recording a value.
- **No custom subagents**: considered an index.html-navigator (duplicate of built-in Explore) and a pipeline-reviewer (pipelines run on Saffron's Mac, nothing for an agent to execute). Rejected both as bloat.
- **Smoke test is offline-by-design with seeded fixtures**: sandbox egress blocks Supabase (confirmed 403 this session), and the app is offline-first anyway — seeding `ds_recipe_cache` tests the real cold-cache-with-data path without any network flakiness.
- **Fixture shape mirrors real data rather than hardening the app**: the `.charAt()` crash on missing `cuisine` is only reachable with malformed cache data; fixed the fixtures and documented the field requirement instead of patching index.html in a config-only PR (no cache bump needed this way, and app hardening deserves its own change if wanted).
- **Smoke test wired into ship-check as step 2** so it runs as part of the standard pre-commit ritual, not as an optional extra.
- **Drift automation = script + routine, not a GitHub Action or hook**: an Action would need an ANTHROPIC_API_KEY secret and CI setup this repo deliberately doesn't have; a settings.json hook only fires inside sessions, which already carry CLAUDE.md + ship-check. The weekly fresh-session routine also catches drift from Saffron's own local pushes, which no in-session mechanism can. The drift script names implementation FILES rather than counts/versions ("canonicalise in FIVE places" is checked by listing, not by parsing "FIVE") so the check itself can't go stale the way the doc did.

## Current State (end of session)
All files written and committed on `claude/audit-claude-config-ef50ee`; draft PR open. Smoke test passes 5/5 against current main's app code. No app code, no data, and no Supabase state touched — `index.html` and `sw.js` unchanged (hence no cache bump).

## Next Steps
1. Merge the PR, then start the **quantity-normalisation apply session** — invoke the `recipe-db` skill; the plan is fully locked in `quantity-normalisation-plan.md` (see 2026-07-01 entry).
2. On the next `index.html` change, exercise the new `ship-check` skill end-to-end and adjust anything that reads wrong in practice.
3. Optional, Saffron's call: harden the recipe-card template against missing `cuisine`/`proteinSource` (guard the `.charAt()` calls at index.html:1953–1954 and :2089) — a real app change, needs its own PR + cache bump.

## Open Questions / Blockers
N/A — everything approved in the dry-run was applied, plus the smoke test Saffron requested.

## Environment & Config Notes
Branch `claude/audit-claude-config-ef50ee`. Smoke test dependencies: global playwright 1.56.1 at `npm root -g` and Chromium at `/opt/pw-browsers` — both preinstalled in the remote sandbox; the script resolves both itself. Confirmed sandbox egress blocks `supabase.co` (CONNECT 403), same as Apify/USDA.

## Notes & Gotchas
- **Smoke-test fixtures must carry `cuisine` and `proteinSource`** — the recipe-card template calls `.charAt()` on both unguarded. If a future field becomes load-bearing the same way, add it to `FIXTURE_RECIPES` with a comment.
- The smoke test covers boot/tabs/shuffle only — a green run does NOT prove a new feature works; drive new features directly and add a check if they're core.
- `.claude/agents` intentionally does not exist — don't "fix" that by scaffolding empty agents.
- The old personal-machine version of `save-conversation` (with `~/Documents` paths and the multi-project routing table) is gone from this repo; if it's needed elsewhere it lives in Saffron's global setup, not here.

---

# Quantity Normalisation — Ruleset Applied to 317 Recipes (step 2 apply; review CSV out, DB write pending)
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — normalisation script built + run over all 317 recipes; review CSV delivered to Saffron; **Supabase write is HELD pending her CSV spot-check** (she chose "review CSV first, then write"). Step 3 not started.

---

## Project Context
Executes the apply-step of nutrition step 2, using the ruleset locked in the two entries below (`quantity-normalisation-plan.md`, §6 decisions signed off). Step 1 (USDA staples, 167 rows) done. This session built the applier, ran it, and produced the pre-write review artifact.

## Session Goal
Build `scripts/normalise_quantities.py` encoding the plan's §3 ruleset, run it against the live `recipes` corpus, tune against real output, and produce the reviewable per-line CSV — then get sign-off before writing the new `ingredient_grams` column.

## What Was Done
1. **Measured the data**: 4050 ingredient items (4049 legacy strings / 56 structured objects / 53 nulls across the full set); 325 non-deleted recipes with ingredients, 317 with `serves` (8 skipped per §6), total `ingredient_sections` ≈ 144 KB. Section objects use key `section_title` (not `title`); structured items are `{qty,unit,name,note,group}`.
2. **Data staging trick**: `execute_sql` results >token-limit are auto-saved by the harness to `~/.claude/.../tool-results/*.txt` (MCP envelope with `<untrusted-data-…>` boundaries). Pulled the 317 recipes as `json_agg` in 2 batches (offset 0/160), extracted with a regex anchored on `\n(\[\{"data":.*\}\])\n` (the boundary tag ALSO appears in the preamble sentence — don't `find` the first one), merged to `scratchpad/recipes_dump.json`. **Python can't reach Supabase from the sandbox** (REST blocked, same as USDA) — MCP is the only channel; this file-staging is how you get bulk data to a local script.
3. **Built `scripts/normalise_quantities.py`** (stdlib, no network): flattens each item to a raw string (objects too, so parser-miss objects like `{qty:null,name:"70g …"}` get re-scanned), then §3 rules in precedence order — unicode/ascii/mixed fractions, ranges→midpoint, dual-unit metric override, imperial, `juice/zest of N fruit`, `Ncm/inch piece`, tin/can, density-class volume→g, per-piece count→g, vague defaults, then the unquantified policy (to_taste/garnish/estimated-bare-main/unresolved). Word-boundary prefix keyword matching (`\b`+term).
4. **Tuned over 5 passes** against real output, fixing concrete bugs: cherry tomato 1200→170 g; `3cm piece of ginger` 300→18 g; **`oil` matching inside "b*oil*ing"** (→ switched all keyword matching to `\b` boundaries); green/spring onion 150→15 g; `juice of ½ lemon` (embedded, not leading, number); pumpkin purée 156→250 g; tin/can sizing; `handfuls`/`Dashes` (trailing-s prefix match); `1 tb`→tbsp; berries/nuts (`pea·nuts` boundary miss) as counts/servings; black/white pepper→spice. Expanded density classes, count table, and bare-serving fallbacks accordingly.
5. **Final distribution** (3997 lines): stated 591, converted 2660, defaulted 209, to_taste 103, garnish 58, estimated 366, unresolved 10; **174/317 recipes flagged `quantities_estimated`**. The 10 unresolved are genuinely un-guessable near-zero-cal items (water-to-cover, "of choice", chicken jus).
6. **Delivered the review CSV** to Saffron and asked go/no-go. She chose **"review CSV first, then write"** → DB write held. Committed the script + README + gitignore; draft PR #36 opened.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| scripts/normalise_quantities.py | The §3 ruleset applier | Created | /home/user/daily-shuffle/scripts/ |
| scripts/README.md | Docs for the new script | Modified | /home/user/daily-shuffle/scripts/ |
| .gitignore | Ignore its generated CSV/JSON | Modified | /home/user/daily-shuffle/ |
| quantity_review.csv / ingredient_grams_updates.json | Per-line review CSV + per-recipe updates (git-ignored) | Created | session scratchpad only |

No Supabase data written. No `index.html`/`sw.js` change.

## Decisions & Reasoning
- **Script, not in-context per-line reasoning**: 3997 lines is too many to hand-reason reliably; a tested deterministic script with tuned lookup tables is reproducible and reviewable (and re-runnable after corrections). The "judgement" in the plan is encoded as keyword→class/count/serving tables.
- **Word-boundary keyword matching** after the `oil`-in-`boiling` bug — substring matching is too fragile for a 300+ keyword vocabulary. `\b`+term keeps prefix matches (`strawberr`→strawberries) while killing false hits inside longer words.
- **Held the DB write for CSV review** — Saffron's explicit choice and the plan's review-first convention; the write is reversible but review-before-live is the established pattern (pricebook/staples).

## Current State (end of session)
Script done + committed (branch `claude/daily-shuffle-qty-normalisation-d8su8h`, draft PR #36). Review CSV in Saffron's hands. `recipes` table UNCHANGED — no `ingredient_grams` column yet. Subscribed to PR #36.

## Next Steps
1. **Saffron reviews `quantity_review.csv`** (filter `qty_source=estimated` for the judgement calls; eyeball some `converted` cup/tbsp lines) and returns corrections or a green light.
2. On green light: re-run script if rules changed → `apply_migration` add `ingredient_grams` jsonb → write the 317 recipes' arrays + `review_flags += quantities_estimated` (174 recipes) → set `serves_missing` on the 8 skipped. Do it in batches; the updates JSON is the source.
3. **Then step 3** (bulk nutrition) using expanded `staple_products` + `ingredient_grams`.

## Open Questions / Blockers
- **Blocker (soft)**: awaiting Saffron's CSV spot-check before the live write. Not a technical blocker.
- The `estimated` bucket (366) is legitimately low-confidence (bare mains, ambiguous units like pack/box/shot/serve) — expected, flagged, not a bug to chase further.

## Environment & Config Notes
- Supabase `jsxcctrskkkxgdxfaduo`. Planned new column: `recipes.ingredient_grams jsonb`. `serves` present on 317/325; skip the 8.
- **Bulk-data staging pattern (reusable)**: big `execute_sql` results auto-save to `~/.claude/projects/<proj>/<session>/tool-results/*.txt`; extract the array with regex `\n(\[\{"data":.*\}\])\n` (the untrusted-data tag also appears in the preamble — anchor on the data literal, not the tag). Python has no direct Supabase access in-sandbox.

## Notes & Gotchas
- Section objects key section title as **`section_title`**, not `title`. Items are strings OR `{qty,unit,name,note,group}`; some structured items have the gram stuck in `name` with `qty:null` — the flattener re-scans the name so these still resolve.
- Gram tables live at the top of `normalise_quantities.py` and are the tuning surface — adjust there, re-run, re-diff the CSV. Don't trust substring matching if adding keywords; the matcher is `\b`-prefix.
- Rollback plan for when the write happens: `alter table recipes drop column ingredient_grams;` and strip `quantities_estimated`/`serves_missing` from `review_flags`.

---

# Quantity Normalisation — §6 Decisions Signed Off (step 2, ruleset locked)
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — the 5 open questions from the step-2 proposal are answered and locked into `quantity-normalisation-plan.md`. Ruleset is now ready to *apply* in a future session; no recipe data touched yet; step 3 still not started.

---

## Project Context
Immediate follow-up to the entry below ("Ingredient Quantity Normalisation — Ruleset & Source-of-Truth Proposal"). That proposal (PR #34) was merged, then Saffron answered the §6 sign-off questions in chat. This session records those answers durably in the plan doc.

## Session Goal
Pose the §6 open questions to Saffron and bake her answers back into `quantity-normalisation-plan.md` so the apply-session has them without re-litigating.

## What Was Done
- Posed the 5 §6 questions (4 via the question picker, garnish inline). Answers:
  1. **Source of truth** → new non-destructive `ingredient_grams` jsonb column (as recommended).
  2. **Cup basis** → **UK cup = 250 ml** (Saffron overrode my US-240 ml recommendation).
  3. **Bare mains** → default portion + `estimated` flag (as recommended).
  4. **Garnish/"to serve"** → 5 g default (as recommended).
  5. **8 no-`serves` recipes** → **skip them** (Saffron overrode my "normalise anyway"); flag `serves_missing` for a manual serves fill first.
- Updated `quantity-normalisation-plan.md`: added a "Resolved decisions" box at top; changed §3.3 base cup 240→**250 ml** and recomputed the **nine density-derived cup values** (water 250, soy 275, oil 227, syrup 350, sugar 213, paste 263, dairy 255, flour 133, cocoa 103; fallback liquid 250, fallback solid 156) — left the empirical measured cup-weights (cheese/rice/oats/leafy/berries/veg) unchanged since those are weighed, not density-derived; updated the §4 pumpkin-puree example to 255 g; §5 step 1 now says skip the 8 no-serves recipes with a `serves_missing` flag; rewrote §6 from "open questions" to "resolved decisions".

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| quantity-normalisation-plan.md | Ruleset doc, decisions now locked in | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

## Decisions & Reasoning
- **UK cup (250 ml) over US (240 ml)**: Saffron's call; she's UK-based. Only the cup differs from US (tsp/tbsp identical), and only the *density-derived* cup cells scale by 250/240 ≈ ×1.042 — the measured solid cup-weights (1 cup rice = 185 g etc.) are empirical and unaffected.
- **Skip the 8 no-serves recipes rather than normalise-then-divide-later**: Saffron preferred not to produce per-serving nutrition off a guessed serves count; cleaner to block them behind a manual serves fill (`serves_missing` flag) than to carry an estimate through step 3.

## Current State (end of session)
Plan doc fully reflects the locked decisions. `recipes`/`staple_products` unchanged. Branch `claude/daily-shuffle-qty-normalisation-d8su8h` restarted from merged main (post-#34) with the doc/log update; new draft PR to be opened (the old #34 is merged and must not be reused).

## Next Steps
1. **Apply-session** (future): add `ingredient_grams` jsonb column via `apply_migration`; run §3 over the 327 recipes (skip the 8 no-serves, flag `serves_missing`); emit the pre-write review CSV for spot-check; set `review_flags += quantities_estimated` where lines are `estimated`/`unresolved`.
2. **Then** step 3 (bulk nutrition) using expanded `staple_products` + `ingredient_grams`.

## Open Questions / Blockers
N/A — all five sign-off questions resolved.

## Environment & Config Notes
Same as the entry below. Branch `claude/daily-shuffle-qty-normalisation-d8su8h` (restarted from main after #34 merged, per the merged-PR-is-finished convention). No app-code change → no cache bump.

## Notes & Gotchas
- Only density-derived cup cells were rescaled to 250 ml; measured cup-weights were deliberately left. If a future editor "fixes" the measured rows to 250 ml by formula they'll be wrong — those are weighed values.
- The old proposal PR #34 is **merged** — do not reopen it; this follow-up is a new PR on a fresh branch off main.

---

# Ingredient Quantity Normalisation — Ruleset & Source-of-Truth Proposal (step 2, planning)
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — proposal written for review; **no recipe data touched.** Awaiting Saffron's sign-off on 5 open questions before any live write.

---

## Project Context
Step 2 of the 3-step nutrition-estimation plan. See the two 2026-07-01 entries below: "USDA Staple Lookup Built…" (step 1, complete — `staple_products` now 167 rows) and "Nutrition Estimation Feasibility…" (the 3-step plan + full background). Step 3 (bulk recipe nutrition pass) is deliberately still pending and must not run until quantities are normalised and this proposal is approved.

## Session Goal
Propose the ingredient-quantity normalisation ruleset (gram-weight defaults/conversions for vague units + a "to taste"/unquantified policy) and a quantity-source-of-truth approach, grounded in the *actual* shape of the data, for review before touching anything. Explicitly did NOT apply changes or run step 3.

## State Before This Session
Step 1 done. Quantities never normalised: `ingredient_sections` still mixes legacy plain-string lines and newer `{qty,unit,name,note,group}` objects, with many `qty:null` "to taste"/no-amount lines. No gram-normalisation had ever been attempted.

## What Was Done
Measured the data live via Supabase MCP (project `jsxcctrskkkxgdxfaduo`) rather than assuming, then wrote the proposal:
1. **Item-shape census**: 4049 legacy strings, 56 structured objects, 53 nulls (blank placeholder lines). Confirmed the `jsonb_typeof` branch is real and strings dominate.
2. **Unit-bucket distribution** across all real lines (first-match precedence): tbsp 831, tsp 734, leading-number-no-unit 601, already-metric(g/ml/l) 599, no-number-no-unit 549, cup 435, vague(pinch/dash/handful/scoop/slice/sprig/bunch) 204, clove 88, imperial 32, "to taste" 32. → ~35% already metric/trivial, ~49% deterministic conversion, ~16% the judgement tail.
3. **Sampled** the hard buckets: dual-unit lines carry an embedded gram (`1 cup (60g)`, `3 tbsp / 65ml`, `1/2 cup (150g)`) → highest-confidence signal; the no-number tail splits into bare seasonings, garnish/"to serve", and bare mains missing a qty (`Chicken breasts`, `chickpeas`).
4. **Found a reusable accelerant**: `recipe-ingredient-normalisation.final.csv` (repo root, from the 2026-06-25 stream) already holds per-line `qty,unit,ingredient,note` keyed `recipe_id|section_ord|item_ord` — parsed stated qtys but never converted to grams or filled blanks; predates recipes added since, so treat as accelerant not source of truth.
5. **Wrote `quantity-normalisation-plan.md`** (repo root): the full ruleset — density-class volume→gram table (tbsp/tsp/cup, because a tbsp of oil vs honey vs cocoa differ hugely, so a flat "1 tbsp=15g" is wrong), per-piece count→gram table, vague-measure defaults, imperial/range/fraction/dual-unit/heaped parsing, and a 4-way unquantified policy (to_taste / garnish / estimated bare-main / unresolved) each with a `qty_source` provenance flag. Recommends a **new non-destructive `ingredient_grams` jsonb column** on `recipes` (parallel array indexed by sec|item) rather than mutating `ingredient_sections` — this *changes the approach floated in the prior log* ("apply across ingredient_sections"), flagged explicitly as open-question #1.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| quantity-normalisation-plan.md | The step-2 proposal (ruleset + source-of-truth + open questions) | Created | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

No recipe/Supabase data changed. No `index.html`/`sw.js` change → no cache bump needed.

## Decisions & Reasoning
- **New `ingredient_grams` column over mutating `ingredient_sections`**: non-destructive/reversible (drop column), zero app-code risk (app reads `ingredient_sections` for display + grocery list; converting 4049 strings→objects would touch every render path for no nutrition benefit), self-describing audit (`qty_source`+`detail`), clean step-3 input. Departs from the prior log's in-place framing on purpose — raised as open Q1 for a yes/no.
- **Density-class volume table, not a flat per-spoon gram**: oil ≈14g/tbsp, honey ≈21g, cocoa ≈6g, flour ≈8g — a single default would be systematically wrong on a large share of the 2000+ tbsp/tsp/cup lines. Class chosen by keyword-matching the ingredient name (reuse `staple_products` aliases).
- **Prefer the embedded metric on dual-unit lines** (`1 cup (60g)` → 60g): highest-confidence signal, ~599 lines already have it; ignore the vague half.
- **Bare mains get a default portion + `estimated` flag (recommended) not left null**: keeps calorie totals realistic while marking low confidence via per-line `qty_source=estimated` + recipe-level `review_flags += quantities_estimated`. Left as open Q3 since it trades honesty vs completeness.
- **US cup = 240ml** (vs UK 250ml): `cup` is a US convention and this corpus's UK recipes use metric weights; ~4% effect. Open Q2.
- **Reviewable-CSV-first before any live write**, per the established pricebook/staples convention.

## Current State (end of session)
Proposal complete and committed on branch `claude/daily-shuffle-qty-normalisation-d8su8h`. `recipes` unchanged (no `ingredient_grams` column exists yet). `staple_products` unchanged (167 rows from step 1). Nothing applied. Draft PR to be opened.

## Next Steps
1. **Saffron reviews `quantity-normalisation-plan.md`** and answers the 5 open questions (esp. Q1 source-of-truth column, Q3 bare-main portioning). Red-line the §3 conversion tables.
2. On approval: `apply_migration` to add `ingredient_grams` jsonb to `recipes`; run the §3 rules (deterministic parts mechanical, judgement parts Claude-reasoned per line) over all 327 recipes via Supabase MCP; emit a per-line review CSV before the live write; set `review_flags += quantities_estimated` where needed.
3. **Then** step 3 (bulk nutrition) using expanded `staple_products` + `ingredient_grams`.

## Open Questions / Blockers
The 5 sign-off questions in §6 of `quantity-normalisation-plan.md`: (1) new column vs in-place; (2) US vs UK cup; (3) bare-main portioning aggressiveness; (4) garnish 5g default vs exclude; (5) handling the 8 no-`serves` recipes. All block execution but not the proposal. Recommendations given for each.

## Environment & Config Notes
- Repo `saffronlm-cmyk/daily-shuffle`, branch `claude/daily-shuffle-qty-normalisation-d8su8h` off latest `main` (PR #33 merged). cwd `/home/user/daily-shuffle`.
- Supabase project `jsxcctrskkkxgdxfaduo`: `recipes` (327 non-deleted; `serves` set on 319/327; `ingredient_sections` jsonb two-shaped; `review_flags` array exists; no gram column yet). Supabase MCP reads work fine from this sandbox (USDA/Apify egress still blocked, but irrelevant here — no external calls needed for step 2).

## Notes & Gotchas
- **Unicode-fraction gotcha**: a `\m[0-9]` regex does NOT match `½/¼/¾/⅓/⅔/⅛`, so lines like `½ tsp baking soda` leak into "no-number" buckets. The proposal's parser normalises unicode fractions first; any future SQL bucketing must include the fraction chars (as the §1 unit-distribution query does).
- **`ingredient_sections` also contains 53 `null` items** (blank placeholder rows, mostly recovered-but-empty sections) — skip these, they carry no ingredient.
- One structured object in the wild has a parser miss: `{"qty":null,"name":"70g vegan chocolate protein powder"}` — the gram is stuck in the name. The §3 parser should re-extract leading metric from names, not just trust the `qty` field.
- Don't run step 3 until quantities are approved+applied — the whole point of step 2's ordering.

# USDA Staple Lookup Built + 122 Generic Staples Loaded to Supabase
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** Complete — step 1 of the 3-step nutrition plan done end-to-end (script built, run by Saffron locally, reviewed, applied to `staple_products`). Steps 2 (quantity normalisation) and 3 (bulk recipe nutrition pass) still pending.

---

## Project Context
Direct continuation of the 2026-07-01 "Nutrition Estimation Feasibility — Research & Planning" entry (immediately below). That session produced a 3-step plan: (1) expand `staple_products` via a local USDA lookup script; (2) normalise ingredient quantities; (3) bulk-repopulate recipe nutrition. This session executed step 1 in full.

## Session Goal
Build `scripts/usda_staples.py` (Next Steps #1 from the prior entry), have Saffron run it locally against USDA FoodData Central, review/fix matches over several iterations, and apply the confirmed generic-staple macros into the bundled Supabase `staple_products` table.

## State Before This Session
Planning done, nothing built. `staple_products` had 45 rows, all Saffron's branded/specific products (plus a few she'd since added as "(generic)" — see Gotchas), no generic pantry basics like salt/oil/garlic. Saffron held a USDA FDC API key locally.

## What Was Done
1. **Regenerated the candidate list**: re-ran the ingredient-frequency SQL (in the prior entry) via Supabase MCP → 209 names ≥4 recipes. Hand-deduped to **`scripts/staple_candidates.csv`** (~135 canonical names): merged regex artifacts / plurals / near-synonyms (e.g. `arlic cloves`→garlic), dropped junk (`water`, `oil`, `of salt`), and added `force-include` core items (potato, butter, cheddar, beef mince, lentils, black beans, bread, pasta, natural yoghurt). Columns: `name,category,recipe_count,source,merged_from`.
2. **Built `scripts/usda_staples.py`** (stdlib-only, build-only, mirrors `price_pricebook.py`): searches FDC `Foundation,SR Legacy`, extracts per-100g cal/protein/carbs/fat/fibre/sugar, writes a reviewable CSV with match score + confidence flag. Modes: `--dry-run`, `--probe`, `--sample`, `--in/--out`.
3. **Iterated over ~5 rounds of Saffron running it locally** (sandbox is gateway-blocked from `api.nal.usda.gov`, so she runs it and pastes results back — same pattern as Apify). Fixes made in response to real output:
   - **Foundation energy bug**: Foundation foods store Energy under nutrient number **957/958** (Atwater), not 208 → calories came back blank for ~20 items. Fixed `extract_nutrients` to resolve 208/957/958 (KCAL only, priority-ordered).
   - **Wrong-form matches**: word-overlap scoring rubber-stamped wrong forms (avocado→"Oil, avocado", carrot→dehydrated, milk→"Crackers, milk", etc.). Added ~45 `TERM_OVERRIDES` steering to the right whole/raw/cooked entry or a documented proxy.
   - **Override scoring**: `match_score` now scores against the override term (not `max(name,term)`) when a name has an override — a bare name that fully matches several forms saturated at 1.0 and couldn't distinguish them (coconut cream sweetened vs raw).
   - **Detail-endpoint 404s**: FDC `/food/{fdcId}` 404s on some entries (egg, milk, cheddar, tuna, dill, dijon) — now non-fatal, falls back to nutrients embedded in the `/foods/search` payload.
   - **`REJECT_SUBSTRINGS`** (puff/fries/tots/tater) so raw sweet potato beats "Sweet Potato puffs".
   - Per Saffron's calls: beans/grains → **cooked** forms (rice/pasta/chickpeas/lentils/black beans); sweetcorn → whole kernel; coconut cream → unsweetened/raw; oats stay dry.
4. **Applied to Supabase** (this channel is NOT sandbox-blocked): assembled final rows from the three report CSVs (main + `staple_report_cooked.csv` + `staple_report_retry.csv`, retry/cooked winning), via a local builder (`scratchpad/build_staples_sql.py`). Inserted **122 rows** into `staple_products` (serving 100 g, aliases from cleaned `merged_from`, `flags={usda_seed}`, provenance in `notes`). Table now 45→**167 rows**, all seeded rows have calories.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| scripts/usda_staples.py | USDA FDC lookup script | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates.csv | ~135 deduped candidate names (committed input) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates_cooked.csv | 5-row subset (beans/grains → cooked) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/staple_candidates_retry.csv | 11-row subset (404 recoveries + wrong-form fixes) | Created | /home/user/daily-shuffle/scripts/ |
| scripts/README.md | Docs for the new pipeline | Modified | /home/user/daily-shuffle/scripts/ |
| .gitignore | Ignore `scripts/staple_report*.csv` | Modified | /home/user/daily-shuffle/ |
| `staple_products` (Supabase) | +122 generic-staple rows, tagged `usda_seed` | Modified | project jsxcctrskkkxgdxfaduo |

Report CSVs (`staple_report*.csv`) are git-ignored and live only on Saffron's machine; the data was pasted into this session and is captured in the applied rows.

## Decisions & Reasoning
- **Skipped 7 items Saffron already has as generics** (fish sauce, sriracha, mayonnaise, egg, blueberries, raspberries, almond milk) rather than duplicate — avoids matcher ambiguity, doesn't overwrite her curated values. Where she only had a *branded* version (almond butter/Legend, dark chocolate/Lidl, peanut butter/Pip&Nut, protein powder/Free Soul, tinned salmon), kept the generic as **additive** so bare recipe terms are grounded.
- **Skipped 6 no-USDA-generic items for hand-fill**: nutritional yeast, coconut aminos, gochujang, chilli crisp, thai red curry paste, rice paper.
- **serving 100 g for all** (USDA basis), including liquids — reference macros for grounding, not a serving suggestion.
- **`flags={usda_seed}` + FDC id in `notes`** so the whole batch is identifiable and reversible (`delete ... where 'usda_seed' = any(flags)`).
- **Proxies documented in-code** where USDA lacks a generic: coconut sugar→brown sugar, rice vinegar→distilled vinegar, gochugaru→cayenne, chilli oil→sesame oil, vanilla paste→vanilla extract, dark chocolate→"SPECIAL DARK bar".

## Current State (end of session)
Step 1 complete. `staple_products` = 167 rows (45 original + 122 seeded). The in-app `fetchMacroEstimate` reads this table live and alias-aware, so it benefits immediately with zero code changes. Branch `claude/focused-darwin-enipb5`, draft PR #33 open (scripts + docs; the DB change is not in git). No app code (`index.html`/`sw.js`) touched — no cache bump needed.

## Next Steps
1. **Hand-fill the 6 skipped items** + blank `missing:` cells (milk sugar ≈5g lactose; cheddar/tuna/dijon sugar ≈0; some Foundation produce missing fibre/sugar) in `staple_products` whenever convenient — Saffron said she'll do this as needed.
2. **Step 2 (separate session): ingredient quantity normalisation** — gram-weight defaults for vague units ("1 tbsp", "1 medium avocado") and a policy for "to taste"; apply across `ingredient_sections` for all 327 recipes (branch on `jsonb_typeof` — legacy string vs structured object shapes).
3. **Step 3: bulk Claude Code pass** over all 327 recipes using the expanded `staple_products` + normalised quantities to (re)populate nutrition columns, with chain-of-thought + self-consistency + `review_flags`.
4. Merge PR #33 when happy (no CI in this repo).

## Open Questions / Blockers
- Whether the in-app matcher prefers the new generic over an existing branded row for a bare term (e.g. "peanut butter") wasn't verified against `fetchMacroEstimate`'s exact logic — expected to be fine (closest-canonical match), but worth confirming if estimates look off.
- Carried over, unresolved: chicken thighs/tomato-paste-style Foundation rows have `fibre_g`/`sugar_g` null (legitimately ~0 for meat; left null not 0).

## Environment & Config Notes
- Supabase project `jsxcctrskkkxgdxfaduo`; table `staple_products` (PK on `id` uuid — **no unique constraint on `name`**, so dedupe is manual). Seeded rows tagged `flags @> {usda_seed}`.
- `api.nal.usda.gov` blocked at the sandbox egress gateway (same as `api.apify.com`) — `usda_staples.py` must run on Saffron's machine with `USDA_FDC_API_KEY` exported per shell. Supabase MCP is NOT blocked.
- USDA quirks encoded in the script: Foundation energy = nutrient 957/958; `/food/{fdcId}` 404s on some entries; search payload carries nutrients as a fallback.

## Notes & Gotchas
- **`staple_products` already had a few generics** beyond the "all branded" snapshot in the prior entry (Fish sauce/Sriracha/Mayonnaise/Eggs/Blueberries/Raspberries "(generic)", Unsweetened almond milk, Chilli crisp oil) — those were the 7 skipped. Re-check existing rows before any future bulk staple insert; don't trust the older "no generics" claim.
- **Aliases were cleaned** from `merged_from` (dropped regex artifacts, my annotation parentheticals, and "juice of…" fragments; fixed `arlic→garlic`, `reen→green`, etc.). The raw `merged_from` column still contains the artifacts — don't load it verbatim.
- **`canonicalise` singular/plural quirk**: words ending vowel+"es"/"s" (e.g. "potatoes", "tomatoes") don't reduce to singular, so plural search terms can dock a point off the match score (cosmetic — sweet potato flagged `review_match` at 0.75 despite a correct 86-kcal match). Prefer singular in overrides.
- To roll back this batch: `delete from public.staple_products where 'usda_seed' = any(flags);`

# Nutrition Estimation Feasibility — Research & Planning
**Date:** 2026-07-01
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — planning complete, nothing implemented yet; next session executes step 1 of a 3-step sequence

---

## Project Context
See 2026-06-25 ("Ingredient Normalisation…") and 2026-06-29 ("Recipe Parser Overhaul…") entries for architecture background. This session opened a new work stream: whether/how to calculate and persist accurate nutritional info (calories/macros) for the recipe library, and how to raise the accuracy of AI-estimated nutrition generally. Purely research + planning — no code was written or executed this session.

## Session Goal
Assess feasibility and realistic accuracy of estimating recipe nutrition and saving it to the bundled Supabase project, then turn that into a concrete, sequenced implementation plan Saffron can execute across sessions.

## State Before This Session
Unknown to Saffron going in (surfaced this session): the `recipes` table already has `calories`/`protein_g`/`carbs_g`/`fat_g`/`fibre_g`/`sugar_g`/`gi_estimate` columns, ~97% populated — but a live query showed many of those existing values are themselves flagged `review_flags` like `nutrition_not_stated`, `nutrition_incomplete`, `calories_approximate`, meaning a lot of "existing" data is already a prior estimate, not verified truth. An in-app AI estimator already exists (see below) but has a persistence gap nobody had noticed.

## What Was Done
1. **Live Supabase investigation** (project `jsxcctrskkkxgdxfaduo`, via Supabase MCP — this channel is NOT blocked by the sandbox egress policy, unlike raw internet calls, see Environment notes): confirmed schema, counted 335 total recipes / 327 non-deleted, 327 with `calories` set, only 8 with zero nutrition (2 of those have no ingredients at all). Sampled `review_flags` distribution — ~90+ recipes carry a nutrition-uncertainty flag despite having numbers.
2. **Code investigation** (via a research subagent, not exploration I duplicated): found the existing in-app estimator — `fetchMacroEstimate()` / `estimateNutritionWithAI()` in `index.html` (~lines 3206–3337). It calls Claude Haiku (`claude-haiku-4-5-20251001`), grounds the prompt against the user's `staple_products` table (exact macros preferred over guesses), divides by servings client-side. **Gap found: it only saves to `localStorage` (`ds_nutrition` via `saveNutrition()`) and never PATCHes back to the Supabase `recipes` row** — `patchRecipeToLibrary()` (the function that does write to Supabase) doesn't touch the macro columns at all. So AI estimates don't survive a cache rebuild or sync across devices.
3. **Diagnosed why Haiku's estimates are weak**: prompt (`index.html:3224-3236`) demands raw JSON immediately with `max_tokens: 256` — no chain-of-thought/per-ingredient breakdown before the final number, which is the single biggest accuracy lever missing. Only 45 `staple_products` rows exist to ground against. `ingredient_sections` (jsonb) mixes two shapes — legacy plain-text strings (`"2 whole chickens"`) and newer structured objects (`{qty, unit, name, note, group}`, only present in recipes added after the 2026-06-29 parser overhaul) — and many structured `qty` fields are explicitly `null` for "to taste"/no-amount items, so even a perfect ingredient-macro lookup can't fix an unknown quantity.
4. **Checked git/session-log history** to answer "did the ingredient normalisation work already cover quantities?" — No. The 2026-06-25 entry's `ingredient-master.csv` pipeline normalised ingredient *naming* for price-matching only (e.g. "garlic clove(s)" variants → one canonical name); it explicitly left 430 lines across 36 recipes null rather than inventing quantities. The 2026-06-29 parser split *already-stated* qty/unit/name apart for new recipes going forward, but never retroactively applied to the existing 327, and never fills in a quantity when the recipe never gave one. Quantity normalisation (vague units like "1 tbsp"/"to taste" → gram-weight estimates) has never been attempted — confirmed as a genuinely open gap, not a re-run of prior work.
5. **Ran an ingredient-frequency analysis** across all 4,104 ingredient lines (SQL below) to scope a staple-expansion target: 209 unique ingredient names appear in ≥4 recipes (covering ~59% of all lines); 457 names at ≥2 recipes (~73%); 1,080 names are singleton (appear in exactly 1 recipe, long tail not worth systematic pre-loading). Cross-checked against the current 45 `staple_products` rows — they're almost entirely Saffron's specific branded products (Legend almond butter, Pip & Nut peanut butter, etc.), not one generic pantry basic (salt, olive oil, garlic, oats, honey, eggs, milk…) is covered despite those being the highest-frequency ingredients in the library.
6. **Investigated existing Edamam integration** (`legacy/discover.js`) as a possible ready-made nutrition source: it only calls Edamam's Recipe Search API v2, which returns nutrition for *existing public recipes matched by search* — it can't compute nutrition for arbitrary custom ingredient text, so it's the wrong product for this need. Edamam's separate Nutrition Analysis API (feed in a title + ingredient lines, get computed nutrition) is the right shape but is a different product needing separate registration; free tier is only 400 requests/month. Not pursued further once USDA was chosen.
7. **Chose and vetted USDA FoodData Central** as the nutrition-data source for generic/commodity ingredients: free signup (`fdc.nal.usda.gov/api-key-signup`, name+email only), 1,000 req/hr once registered. Saffron signed up and holds a key locally (not shared with or stored by Claude Code).
8. **Ruled out both alternative delivery paths, empirically, not by assumption**:
   - *Live in-app feature*: Saffron tested `fetch('https://api.nal.usda.gov/...')` directly from her own browser console — it throws a CORS error. Confirmed non-viable without a backend proxy, which this app doesn't have.
   - *Calling USDA directly from this Claude Code session*: attempted via both `curl` and the WebFetch tool — both got a **403 from the sandbox's own egress gateway** before ever reaching USDA (`connect_rejected`, "policy denial" per `$HTTPS_PROXY/__agentproxy/status`), i.e. the exact same restriction that already blocks `api.apify.com` for the price-book pipeline (see 2026-06-25 Apify entry). So USDA calls can only happen from a script Saffron runs locally — mirroring the existing `price_pricebook.py`/`csv_to_seed.py` pattern exactly.
9. **Landed on a 3-step sequence** (Saffron's own framing, confirmed this session): (1) expand `staple_products` via a local USDA lookup script; (2) a separate future session to normalise ingredient quantities; (3) a Claude-Code bulk pass to (re)populate recipe nutrition using both of the above as inputs. Confirmed the *order* matters: the bulk pass's accuracy ceiling is capped by unknown quantities regardless of ingredient-level macro quality, so quantity normalisation should land before the bulk pass, not after or in parallel.

## Artifacts Produced / Modified
None. This was a pure research/planning session — no files in the repo were created or changed except this log entry. The ingredient-frequency query and its output (below) exist only in this log; no CSV or script was saved.

**Reusable SQL** (ingredient-frequency scan, run against Supabase project `jsxcctrskkkxgdxfaduo` via the Supabase MCP `execute_sql` tool) — re-run this rather than re-deriving it by hand:
```sql
with sections as (
  select r.id, jsonb_array_elements(r.ingredient_sections) as sect
  from public.recipes r
  where r.import_status <> 'deleted' and r.ingredient_sections is not null
),
items as (
  select id, jsonb_array_elements(sect->'ingredients') as item
  from sections
),
raw as (
  select id,
    case when jsonb_typeof(item) = 'string' then trim(both '"' from item::text)
         else item->>'name' end as raw_name
  from items
),
clean1 as (
  select id, regexp_replace(raw_name, '\(.*?\)', '', 'g') as t
  from raw where raw_name is not null
),
clean2 as (
  select id,
    lower(trim(regexp_replace(t,
      '^[0-9¼½¾⅓⅔⅛/.\s–-]*\s*(g|kg|ml|l|tsp|tbsp|tbsps|teaspoons?|tablespoons?|cups?|oz|lb|lbs|cloves?|whole|large|medium|small|slices?|sprigs?|handfuls?|pinch(es)?|bunch(es)?|packs?|cans?|tins?)?\s*',
      '', 'i'))) as t2
  from clean1
),
clean3 as (
  select id, split_part(t2, ',', 1) as name
  from clean2
)
select name, count(*) as n, count(distinct id) as recipe_count
from clean3
where name is not null and length(name) > 2
group by name
order by n desc;
```
Top hits (partial, illustrative — see Notes & Gotchas for known regex artifacts): salt (67 recipes), olive oil (57), maple syrup (58), soy sauce (48), baking powder (54), honey (38), garlic cloves (~50 combined across mangled variants), eggs (36), cinnamon (33), vanilla extract (36), spring onions (30), cucumber (31), baking soda (30), coconut oil (27), cocoa powder (26), avocado (26), red onion (25), sesame oil/seeds (~49 combined), chia seeds (24), oats/oat flour (~56 combined), milk/"milk of choice" (~36 combined).

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This log entry (Rolling Log + GitHub Push mode) |

## Decisions & Reasoning
- **Prioritise grounding-data expansion (staple_products) before touching the in-app prompt/model.** Expanding staples removes guessing entirely for the ingredients it covers — a strictly-better, no-downside win — whereas prompt/model changes only make the *guessing* better. Sequenced first.
- **USDA FoodData Central over Edamam Nutrition Analysis API for the staple expansion.** Edamam's matching product is the right shape (NLP ingredient-line → nutrition) but free tier caps at 400 req/month and needs separate app registration under Saffron's account (unconfirmed whether she already has access). USDA is free, instant signup, higher rate limit, and better suited to *generic per-ingredient* lookups (which is what staple expansion actually needs) rather than whole-recipe NLP parsing.
- **Local build-only script, not an in-app feature, for the USDA calls** — decided only after empirically ruling out the alternative twice: Saffron confirmed CORS failure from her own browser, and I confirmed this Claude Code sandbox is gateway-blocked from `api.nal.usda.gov` (same as `api.apify.com`). Not an assumption — both were tested. Mirrors the exact `price_pricebook.py` pattern already established and proven for Apify.
- **Target the ≥4-recipe-occurrence ingredient tier (~209 names, ~59% line coverage) for the staple expansion, not the full long tail.** USDA lookups are free/cheap so cost isn't the constraint — the constraint is review effort (each match needs a sanity check, per the Apify pipeline's "wrong form" lesson e.g. cayenne→hot sauce) and diminishing returns (1,080 singleton-recipe ingredients each only help one recipe). Agreed to also force-include core protein/carb/dairy items (chicken breast, rice, potatoes, etc.) even if just under the frequency cutoff, since they swing calorie totals far more than a correctly-priced spice does.
- **Prefer USDA `dataType=Foundation,SR Legacy` over branded entries when the script is built** — generic/unbranded reference data avoids the same class of "right words, wrong product form" mismatch that bit the Apify price matcher.
- **Reviewable CSV output before writing to `staple_products`, not auto-apply** — consistent with the project's established convention (`pricebook.csv`/`price_report.md`) of never letting an automated match write directly to live data unreviewed.
- **Quantity normalisation sequenced BEFORE the bulk nutrition pass, and parked as its own separate session** rather than folded into this stream. Reasoning: it's a large enough problem (deciding gram-weight defaults for every vague/"to taste" ingredient line across the whole corpus) to deserve its own planning session, and doing it first means the bulk pass only needs to run once at full quality rather than twice.
- **The eventual bulk pass will be Claude Code reasoning directly, not a nested Anthropic API call.** Because a future session has direct Supabase read/write access (proven this session), it can match against `staple_products` itself, apply chain-of-thought per recipe, run a self-consistency double-check (re-derive, flag >20% disagreement), and write `review_flags` for low-confidence recipes — capabilities the in-app Haiku call structurally can't have (single constrained JSON-only prompt, no multi-pass, no direct DB access).

## Current State (end of session)
No implementation. `staple_products` still has 45 rows (all branded, no generic staples). `recipes` nutrition columns unchanged (327/335 populated, many flagged as prior estimates). Ingredient quantities unchanged (still `null` for "to taste"/no-amount lines). Saffron holds a USDA FDC API key locally — not committed or referenced anywhere in the repo. No new branch was created this session (pure investigation, no code changes to stage).

## Next Steps
1. **New session — build `scripts/usda_staples.py`** (stdlib-only Python, build-only like `price_pricebook.py`): input the ~209-ingredient-name list (regenerate via the SQL above, plus the agreed core-protein/carb/dairy additions — no frozen file exists yet, see Open Questions). For each name, call FDC `/foods/search?dataType=Foundation,SR%20Legacy` then `/food/{fdcId}` for the best match; output a review CSV (`name, matched_description, fdc_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g per 100g, confidence_flag`).
2. Saffron runs it locally: `export USDA_FDC_API_KEY=...` then `python3 scripts/usda_staples.py` (same run pattern as the Apify script — re-export each terminal session, never persisted to a file).
3. Saffron reviews/corrects the output CSV (catch wrong-form matches per the Apify lesson) and shares it back.
4. A Claude Code session applies the confirmed rows into `staple_products` directly via the Supabase MCP `execute_sql`/insert tools (project `jsxcctrskkkxgdxfaduo`) — no second script needed, this channel isn't blocked by the sandbox egress policy.
5. **Separate future session: plan + execute ingredient quantity normalisation** — design gram-weight defaults/conversion rules for vague units ("1 tbsp", "1 medium avocado") and a policy for genuinely-unquantifiable "to taste" items, then apply across `ingredient_sections` for all 327 recipes (both the legacy plain-string shape and the newer structured shape — see Notes & Gotchas).
6. **Then: bulk Claude Code pass** over all 327 recipes using the expanded `staple_products` + normalised quantities to (re)populate `calories/protein_g/carbs_g/fat_g/fibre_g/sugar_g`, with per-recipe chain-of-thought reasoning and a self-consistency double-check, writing `review_flags` (reuse existing vocabulary — see Notes & Gotchas) for low-confidence recipes.
7. **Lower priority / optional**: apply the same chain-of-thought + model-upgrade (Haiku → Sonnet) improvements to the in-app `fetchMacroEstimate`/`estimateNutritionWithAI` (`index.html:3206-3337`), and fix the persistence gap (add a Supabase PATCH of the macro columns, mirroring `patchRecipeToLibrary`) so future in-app "Re-estimate" clicks stop being localStorage-only.

## Open Questions / Blockers
- **No frozen ingredient list yet** — the ≥4-recipe-occurrence threshold (~209 names) plus "add core protein/carb/dairy items" guidance was agreed verbally/in this log, but nobody has written the literal final list to a file. The next session should either re-run the SQL above or explicitly confirm the categorical additions with Saffron before running the USDA script, to avoid scope drift.
- Whether Saffron's existing Edamam account (`ds_edamam_id`/`ds_edamam_key`) has separate access to the Edamam Nutrition Analysis API was never checked — moot now that USDA was chosen, but worth knowing if USDA coverage turns out to have gaps (e.g. some prepared/composite foods USDA doesn't model well).
- Carried over from 2026-06-25, still unresolved and unrelated to this stream: orange juice→"Orange" rollup correctness, and whether `Garlic Clove`/`Garlic` should merge to one variant.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`, no feature branch created this session (investigation only).
- Supabase project `jsxcctrskkkxgdxfaduo` ("saffronlilith's Project"). Tables relevant to this stream: `recipes` (335 rows; `calories/protein_g/carbs_g/fat_g/fibre_g/sugar_g/gi_estimate` columns already exist, no migration needed) and `staple_products` (45 rows: `name, aliases[], serving_qty, serving_unit, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, gi_estimate, flags[], notes`).
- **This cloud/remote Claude Code environment cannot reach `api.nal.usda.gov` or `api.apify.com`** — both confirmed via gateway-level 403 (`connect_rejected`, policy denial) at `$HTTPS_PROXY/__agentproxy/status`, before the request ever leaves the sandbox. Any script hitting either of these APIs must be built here but run on Saffron's own machine. Supabase access via the MCP tools is a separate channel and is NOT subject to this restriction — confirmed working throughout this session (schema reads, frequency queries, all succeeded).
- USDA FoodData Central: free signup at `fdc.nal.usda.gov/api-key-signup`; 1,000 req/hr with a registered key (30/hr, 50/day on the public `DEMO_KEY`). Saffron has a key; it is not stored in this repo or shared with Claude Code.
- Edamam credentials (`ds_edamam_id`/`ds_edamam_key`, used by the legacy Discover tab) are for the Recipe Search API v2 only — confirmed via `legacy/discover.js` — not usable for arbitrary-ingredient nutrition analysis without separate registration for the Nutrition Analysis API product.

## Notes & Gotchas
- **The ingredient-frequency regex has known artifacts**: it sometimes eats a leading "g" from words starting with g when preceded by a number, because it pattern-matches "g" as a unit abbreviation (e.g. "3 garlic cloves" → "arlic cloves", "green onions" → "reen onions"). True unique-ingredient counts are somewhat lower than the raw 209/457 figures once these are manually merged — dedupe by eye when building the final candidate list, don't trust the raw grouped names verbatim.
- **`ingredient_sections` jsonb has two shapes in the wild**: legacy plain strings (`"2 whole chickens"`) and newer structured objects (`{qty, unit, name, note, group}` — only present in recipes added after the 2026-06-29 parser overhaul). Any script/query touching this must branch on `jsonb_typeof(item)`.
- **`qty: null` in the structured shape is not a data bug** — it reflects recipes that genuinely never specified an amount ("salt, to taste", bare "olive oil"). This is exactly the quantity-normalisation gap; don't treat it as something to "fix" by re-parsing, it needs new logic (gram-weight defaults/conversion rules).
- **`review_flags` already has an informal vocabulary in use**: `nutrition_not_stated`, `nutrition_incomplete`, `calories_approximate`, `serves_estimated`, `method_inferred`, etc. Reuse or closely match these when the bulk pass flags low-confidence recipes rather than inventing a new taxonomy.
- **The in-app estimator already reads live from `staple_products`** (`fetchMacroEstimate`, `index.html:3206`, alias-aware match) — expanding that table benefits the in-app "Re-estimate" button immediately with zero code changes, since no new wiring is needed for it to pick up new staples.
- This session made heavy, correct use of the Supabase MCP tools directly (not raw `curl`/`fetch`) for all live-data investigation — continue that pattern; it's the only channel proven to reach this project's Supabase instance from this sandbox.

---

# Recipe Parser Overhaul + Persistent Locked Plan + Drink Tracking
**Date:** 2026-06-29
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Status:** Complete — implemented, verified, pushed; draft PR #24 open (no CI in this repo)

---

## Project Context
Single-file PWA (`index.html`, ~5,900 lines, no build step) — see the 2026-06-25 entry for the
broader normalisation/price-book stream and architecture. This session is a separate UX/parsing
pass driven by a `/goal` task across three tabs (Shuffle, Tracker, Add Recipe).

## Session Goal
Three asks: (1) make the shuffled meal plan persist + lockable ("set in stone"); (2) add drinks/coffee
tracking to the Tracker; (3) overhaul Add Recipe AI parsing — separate qty/ingredient/prep, parse macros
in the same call, and resolve the "Key ingredients to buy" field's role vs the grocery list.

## State Before This Session
- `currentPlan` was in-memory only (lost on reload). Calendar already rendered in `renderPlanOutput`.
- Tracker `TRK_MEALS = [breakfast,snack,lunch,dinner,dessert]`; no drinks bucket.
- Recipe parser (`parseWithAI`) returned ingredients as `{group, item}` (one mashed string incl. qty+prep).
  No macros in the parse — separate `estimateNutritionWithAI` second step. `prefillForm` dumped flattened
  items into `f-ingredients` ("Key ingredients to buy") and left the real Ingredients textarea EMPTY.
- **Key finding:** `groceryItems` / the `f-ingredients` field is STORED BUT NEVER READ. The grocery list
  (`_groceryAggregate`) is built entirely from `RECIPE_FULL_DATA[id].ingredients` (full list, summed).
  So the user's hypothesis was exactly right — the field was vestigial and only risked confusing costs.

## What Was Done
- **Parser (`parseWithAI`)**: ingredient schema → `{group, qty, unit, item, prep}` with explicit split rules
  + examples; added `nutrition {kcal,protein,carbs,fat}` (per-serving estimate). `prefillForm` now rebuilds
  readable grouped lines ("qty unit item, prep") into `f-ingredients-full` (the real source of truth) and
  fills method/tips/storage/macros. Stopped concatenating tips/storage into Notes (they have own fields now).
- **Removed the "Key ingredients to buy" field** (`#f-ingredients`) from the form; dropped its refs in
  `addRecipe` (groceryItems now `{}`), `prefillForm`, `clearForm`. Relabelled Ingredients textarea to say it
  builds the grocery list. Fixed a latent bug in `estimateNutritionWithAI` (`i.item` map) to handle the
  structured `{qty,unit,name}` shape.
- **Plan persistence + lock**: added `savePlan()`/`revivePlan()` (ds_current_plan; ISO dates + recipe id/name
  snapshots, rehydrated to live recipe refs or a stub), `planLocked` (ds_plan_locked) + `togglePlanLock()`,
  a lock bar in `renderPlanOutput`, guards in `respinDay`/`openPicker`, reshuffle disabled while locked,
  lock reset on fresh generate (both manual + AI), `revivePlan()` wired into DOMContentLoaded. CSS for the bar.
- **Tracker drinks**: added `'drinks'` to `TRK_MEALS` + a "🥤 Drinks & coffee" chooser tile with one-tap
  presets (`TRK_DRINK_PRESETS`) and a custom-drink form (`trkOpenDrinks`/`trkAddDrinkPreset`/`trkSubmitDrink`).
- Bumped `sw.js` CACHE v24 → v25.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|------------|--------|----------|
| index.html | All three features | Modified | /home/user/daily-shuffle/ |
| sw.js | Cache bump v24→v25 | Modified | /home/user/daily-shuffle/ |
| logs/daily-shuffle_log.md | This entry | Modified | /home/user/daily-shuffle/logs/ |

## Decisions & Reasoning
- **Removed the key-ingredients field rather than keeping it**: it was provably dead code (never read), and
  the grocery list is already the sum of full ingredients — keeping it only invited the confusion the user
  flagged. Single source of truth = the Ingredients textarea.
- **AI splits fields, but save path still re-parses the rebuilt textarea**: keeps ONE storage code path
  (manual `parseQty` → `{qty,unit,name,note}`) instead of forking on AI-vs-manual. parseQty + `_stripPrep`
  already separate qty and strip prep for the grocery key, so "200g chicken thighs, sliced" → grocery key
  "chicken thighs". Lower risk than rewriting `addRecipe`'s storage.
- **Lock via handler guards, not per-button markup**: the calendar generates respin/pick buttons in many
  places; guarding `respinDay`/`openPicker` (+ disabling reshuffle) is far less invasive than conditionalising
  every button, and can't be bypassed.
- **revivePlan stores name snapshots**: so a deleted / not-yet-synced recipe still shows a label instead of
  "—"; live recipe is preferred when present.

## Current State (end of session)
All implemented, committed (branch `claude/recipe-parsing-ingredients-1ta5nr`), pushed. Draft PR #24 open.
Verified clean on the first pass — see Next Steps for the verification method. Subscribed to PR #24 activity;
no CI in this repo (`get_status` total_count 0); one-shot self check-in scheduled ~1h out.

## Next Steps
1. User reviews PR #24; merge when happy (repo merges freely, no CI).
2. After deploy, hard-refresh twice for the v25 cache to take (known PWA gotcha).
3. Optional follow-ups: parser could store qty/unit/prep structurally end-to-end (skip the textarea re-parse);
   drinks presets could be user-editable; consider a "water total" summary in the tracker.

## Open Questions / Blockers
N/A — all asks implemented with documented defaults. The user phrased some asks as questions; decisions above
are reversible if they disagree.

## Environment & Config Notes
Branch `claude/recipe-parsing-ingredients-1ta5nr`, cwd /home/user/daily-shuffle. No CI. Verify method:
`new Function()` over each `<script>` block (3 blocks, 0 failures) + headless Playwright smoke
(executablePath /opt/pw-browsers/chromium). Supabase recipe-library fetch fails in sandbox (network blocked) —
pre-existing, unrelated.

## Notes & Gotchas
- `groceryItems` on recipe objects is now always `{}` for new recipes; old recipes keep theirs but it's still
  never read — safe.
- Adding to `TRK_MEALS` is the supported way to add a tracker bucket; it drives both rendering and the meal
  `<option>` lists. No schema change needed (food_log keys by meal_id string).
- Bump `sw.js` CACHE on any further change or the PWA serves stale HTML.

---

# Ingredient Normalisation, Consolidation & Variant-Level Price Book
**Date:** 2026-06-25 (session spanned 2026-06-06 → 2026-06-25)
**Project:** Daily Shuffle — recipe/meal-planning PWA
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress — Phase 1 (naming/normalisation) complete; Phase 2 (apply to app) pending

**Branch / merge status:** All artifacts below live on branch `claude/recipe-ingredient-prices-RYSob`, which is **not merged** to `main` (its `index.html` predates main's nutrition-tracker work, so it conflicts; only this log entry was brought to `main`). NOTE: `main` already has the **Apify price-book pipeline** that *consumes* `pricebook.csv` — see the "Apify price-book pipeline" entry below; that is the Phase-3 auto-pricing this entry refers to as future work. `main` holds an older 988-row `pricebook.csv`; this branch produced the cleaner 812-row version.

---

## Project Context
Daily Shuffle is a single-file PWA (`index.html` ~250 KB + `legacy/` stashed modules) for shuffling
recipes into meal plans with a grocery list and a cost/price book. Recipes live in Supabase
(`recipes.ingredient_sections`, free-text). The price book lives in browser `localStorage`
(`ds_pricebook`) and syncs to Supabase `user_library`. Goal of this work stream: turn the messy,
free-text recipe ingredients into a clean normalised vocabulary so each ingredient can be priced once
and recipe/plan/grocery costs compute automatically. First entry in this log — full roadmap also lives
in `HANDOFF.md` at repo root (the living roadmap; this log is the session record).

## Session Goal
Scope missing ingredient prices → normalise the recipe ingredient wording → consolidate
like/comparable variants → produce a variant-level price book the user can fill in → set up the
machinery (CSVs + in-app importers) to apply it all later.

## State Before This Session
Nothing existed for this stream. Price book was a 38-row seed in `index.html`. Recipe ingredients were
raw free-text with no normalisation, no consolidation, no per-ingredient pricing. No roadmap doc.

## What Was Done
A long, iterative build, roughly in order:
1. **Scoped** the architecture: recipes in Supabase (project `jsxcctrskkkxgdxfaduo`), 305 ready recipes /
   3,915 ingredient lines (3,485 real, **430 null** across 36 recipes). Found the engine fns
   (`canonicalise`, `parseQty`, `_toBase`, `classifyAisle`, `lookupPriceBook`, `savePriceBook`,
   `computeRecipeCost`, `_groceryAggregate`) and the unused `priceBook[].aliases` hook.
2. **Missing-prices sheet** (615 unpriced ingredients) → **recipe normalisation worksheet** (3,915 lines
   parsed to qty/unit/ingredient/note).
3. Built **two in-app importers** in `index.html` (committed, NOT deployed): "Import ingredient CSV"
   (`importRecipeIngredientsCsv`) and "Import price CSV" (`importPriceBookCsv`).
4. **Consolidation**: built a rules-engine clusterer; iterated through several rounds of the user's
   specific decisions to merge/keep-distinct comparable variants; produced a reviewable
   consolidation worksheet and a comprehensive **category → product → variant** master list.
5. **Re-modelled** after the user edited the master: confirmed the tier semantics (see Decisions), split
   the "compound" problem into true ingredient-splits vs prep/medium-to-note, produced a reconciled
   **split-plan** (28 splits), applied splits + pepper normalisation.
6. **Full master-driven regeneration** (`tools-apply-master.mjs`): the user's curated master became the
   single source of truth; generated the final recipe worksheet (names from master) + variant-level
   price book.
7. **Fixed a matcher gap** the user flagged: exact-canon matching only covered 92% of lines; switched to
   `canon(cleanRaw(name))` + UK/US spelling normalise (yoghurt↔yogurt) → **99%**. Exported the residual
   32 wordings for fold-in.
8. **Tidied** the repo to a self-contained pipeline; **promoted the edited master into the repo**;
   wrote/realigned `HANDOFF.md` as the project roadmap (none existed); saved this session log.

Things tried and corrected: initially had **product/variant roles backwards** (assumed product = price
unit) — the user's edits proved variant = price unit, product = family; re-modelled accordingly.
Initially conflated ingredient-splits with prep/medium separation — the user caught it; separated them.

## Artifacts Produced / Modified
Branch: `claude/recipe-ingredient-prices-RYSob`. Repo root unless noted.

| File | What it is | Status | 
|------|-----------|--------|
| `ingredient-master.csv` | **Naming source of truth** — user-curated `category/product/product change/variant/variant change/…`. Promoted from upload into repo. | Created |
| `split-plan.csv` | 28 confirmed compound splits + renames (input) | Created |
| `recipe-ingredient-normalisation.csv` | Original per-line parse from Supabase (input; source of `original_line`) | Created |
| `tools-apply-master.mjs` | **Generator** — `node tools-apply-master.mjs` → the two outputs. Matches on `canon(cleanRaw(name))`+spelling-normalise | Created |
| `recipe-ingredient-normalisation.final.csv` | **Output** — recipes with `ingredient` = master `variant change`; splits baked in; ~99% mapped (`review='unmatched'` flags misses) | Created |
| `pricebook.csv` | **Output / fill-in sheet** — one row per variant (price unit): `Ingredient, Product, Category, Pack size, Pack unit, Pack price, Store, Aliases, occurrences`; ~811 variants, usage-sorted | Created |
| `unmatched-ingredients.csv` | ~32 residual recipe wordings to fold into the master | Created |
| `HANDOFF.md` | The project roadmap for this stream (Phases 0–4, data model, file inventory) | Created |
| `logs/daily-shuffle_log.md` | This session log | Created |
| `index.html` | Added the two importers (Settings → Recipe Library / Price Book) | Modified |
| `docs/SESSION-LOG.md` | Improvised raw-ish transcript before the skill was available | **Deleted** (superseded by this structured log) |
| `missing-ingredient-prices.csv`, `pricebook-aliases.csv`, `ingredient-consolidation.csv`, `ingredient-master`(auto baseline)`, `recipe-…consolidated.csv`, `compound-split-candidates.csv`, `tools-cluster-ingredients.mjs`, `tools-apply-consolidation.mjs` | Superseded generations + tools | **Deleted** (in git history) |

## Skills Used
| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This handoff log (Rolling Log + GitHub Push mode, full template) |

## Decisions & Reasoning
- **Data model — variant = price unit + recipe name; product = family/grouping only; category = aisle.**
  Confirmed from the user's master edits (almond/soya/dairy milk all → product "Milk" but priced
  separately as variants). Product is organisation, *not* a shared price. (I had it backwards first;
  the edits corrected me.)
- **Apply to both price book + recipes, moderate grouping, reviewable-CSV-first.** Chosen via
  AskUserQuestion. Non-destructive: the master keeps the original `variant` and adds `*_change`
  columns, so the mapping is auditable/re-runnable and traceable back to recipes.
- **Aliases attach to the variant, not the product**, and **recipes are rewritten to the variant**, so
  the grocery list groups naturally without code; `product` is carried into the app only to *group*
  the grocery list within an aisle. Leverages the pre-existing-but-unused `priceBook[].aliases`.
- **Splits happen at recipe-line grain (qty is per occurrence); name changes are 1→1 via the master;
  prep/medium descriptors (in brine, drained, to taste) move to the note — NOT a split.** The user
  flagged that splitting-ingredients vs separating-prep are different operations; kept them separate.
- **Specific consolidation rules** (locked): `A or B`→first+note · only `white sugar`→Sugar · flavoured
  yoghurts distinct · bare defaults (onion→Yellow Onion, flour→Plain Flour, butter→Butter,
  cabbage→White Cabbage, oil→Vegetable Oil, yog(h)urt→Plain Yoghurt) · citrus juice/zest/whole→fruit ·
  light olive oil→Olive Oil · light/dark soy & Light Sour Cream distinct · white pepper distinct ·
  cracked/ground/black→Black Pepper · UK spellings · `dairy free milk` intentional · nut butters ≠
  Butter · named oils ≠ Vegetable Oil · jasmine/basmati rice protected.
- **Matcher: `canon(cleanRaw(name))` + yoghurt↔yogurt normalise, not exact canon.** Exact-canon left
  qty/measure cruft ("juice of 1 lime", "sheets rice paper", "½ cups bean sprouts") and the UK/US
  yoghurt spelling unmatched → only 92%. The cleaned key (same cleaning the master keys were built
  with) → 99%, and dropped price variants 987→811.
- **Master promoted into the repo + superseded files removed.** Makes the pipeline self-contained and
  not dependent on the ephemeral upload path; reduces confusion. History preserves the removed tools.
- **HANDOFF.md is the roadmap** because no project-wide phasing doc existed; `legacy/README.md` is a
  separate parallel track (stashed Track/Pantry/Wellness modules to re-graft later).

## Current State (end of session)
Phase 1 done: recipe ingredient names normalised in `recipe-ingredient-normalisation.final.csv`
(~99% mapped to the master; **computed in the CSV, NOT yet written to live recipes**), 28 splits
applied, variant-level `pricebook.csv` scaffolded (empty prices), residual 32 in
`unmatched-ingredients.csv`. Importers exist on the branch but the branch is **not deployed**. Nothing
has been written to the live Supabase recipes or the live price book yet.

## Next Steps
1. **User fills `pricebook.csv`** top-down (usage-sorted; first ~100 cover most recipes); tidy rough
   Product labels (e.g. `Maple Syrup → "Syrup"`).
2. Optionally **fold `unmatched-ingredients.csv` (32 rows)** into `ingredient-master.csv`, then re-run
   `node tools-apply-master.mjs`.
3. **Phase 2 — apply to the app** (next session): (a) extend `importPriceBookCsv` to read **Aliases** +
   **Product** columns and allow alias-only rows; (b) add a `product` field to price entries and group
   the grocery list **by product within aisle**; (c) tighten the greedy `lookupPriceBook` substring
   fallback (egg↔eggplant) now aliases exist; (d) **PR to deploy** the branch; (e) import
   `recipe-ingredient-normalisation.final.csv` + filled `pricebook.csv`; (f) handle the `-2/-3` split
   row_key ordering in the importer.
4. **Re-enter the 430 null lines** (36 recipes) from source.
5. **Phase 3 — auto-pricing** (Supabase Edge Function or local scraper, keyed on the variant vocab;
   manual-override flag). **Phase 4 — cost features** (recipe/plan cost surfacing, shop-by-product
   grocery, per-100g, budget-aware planning, price history, store comparison) — see HANDOFF.md §5.

## Open Questions / Blockers
- Orange juice: rolled into `Orange` (fruit) — fine if squeezed, wrong if a carton; user to confirm.
- `Garlic Clove` vs `Garlic` still separate variants — merge by setting `variant change = Garlic`?
- Where the "dairy-free sub OK" style notes should surface (recipe note vs price-book note).
- Not blocking: waiting on the user to fill prices to validate the whole model end-to-end.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`, branch `claude/recipe-ingredient-prices-RYSob` (work NOT on
  `main`; not deployed). Cloud/remote Claude Code env with a **network allowlist** (direct Supabase
  REST was blocked; used the Supabase MCP instead).
- Supabase project `jsxcctrskkkxgdxfaduo` ("saffronlilith's Project"). Tables: `recipes`
  (`ingredient_sections` JSONB, `import_status='ready'`), `user_library` (row `id='default'`, holds the
  synced price book blob; `priceBook` field currently empty).
- App secrets already in `index.html`: `RECIPE_LIB_URL` + anon key (`RECIPE_LIB_KEY`). localStorage keys:
  `ds_pricebook`, `ds_recipe_cache`, `ds_overrides`, `ds_custom_recipes`.
- Pipeline: `node tools-apply-master.mjs` reads `ingredient-master.csv` + `split-plan.csv` +
  `recipe-ingredient-normalisation.csv` → writes the two output CSVs. Node 22; scripts are ESM `.mjs`.
- In-app importer entry points (index.html): `importRecipeIngredientsCsv`, `importPriceBookCsv`,
  `patchRecipeToLibrary` (pushes recipe edits to cloud), `lookupPriceBook` (~line 2750),
  `savePriceBook` (~2558).

## Notes & Gotchas
- **Recipe ingredients store medium/prep inline** ("tuna in brine", "1 large carrot, diced") — the
  parser moves these to the note; don't treat them as splits.
- **UK vs US spelling**: master uses "yoghurt"; recipes mix "yogurt" — the matcher normalises
  yoghurt↔yogurt. Any new matching logic must keep this.
- **430 null recipe lines** have no text at all (lost on import) — they can't be normalised, only
  re-entered from the original recipes.
- **Split rows use `row_key` suffixes `-2/-3`** — the importer currently sorts by numeric section/line;
  it must be taught to order these (Phase 2).
- **`.numbers` files can't be parsed** here (Apple proprietary) — always ask for CSV export.
- The `present_files`/file-delivery to the user worked throughout via the file-send tool; CSVs were the
  exchange format.

---

# Apify price-book pipeline — build, fix, and merge
**Date:** 2026-06-25
**Project:** Daily Shuffle
**Mode:** Rolling Log + GitHub Push
**Status:** In Progress (pipeline code merged; actual price fill still pending on Saffron's machine)

---

## Project Context
Daily Shuffle is a static, single-file PWA (`index.html`) — a GF/DF nutrition
planner with a macro tracker, AI meal generation, recipe discovery, and a
localStorage-backed **price book** (`ds_pricebook`) used to cost recipes. This
session built the tooling to populate that price book with real UK supermarket
prices instead of hand-entered guesses. First entry in this log — no prior
entries to cross-reference.

## Session Goal
Build (not run) two dependency-free Python scripts: one to fill `pricebook.csv`
with real UK prices via an Apify scraper, and one to regenerate the app's
`seedPriceBook()` from the filled CSV. Saffron runs the actual scrape herself on
her Mac with her own Apify token (the cloud sandbox cannot reach
`api.apify.com`). Mid-session the goal expanded to fixing systematic mismatches
where spices/nuts were being priced as liquids.

## State Before This Session
The original pipeline (PR #7) had already been merged to `main` on 2026-06-24 at
commit `9b26458`, but it had three problems discovered in real test runs:
1. Wrong Apify actor input schema (guessed `searchQuery`/`maxItems`).
2. Tesco/Sainsbury's actors blocked by anti-bot; only ASDA worked.
3. Matching ignored the CSV's Category/Product/variant structure, so a one-word
   product search (e.g. "cayenne") matched the wrong *form* (hot sauce).

## What Was Done
- **Fixed the Apify integration** (commit `a69c376`): corrected actor input to
  `{"queries":[term], "maxResultsPerQuery":N}`; mapped the real ASDA output
  fields; reduced to **ASDA-only** after confirming Tesco/Sainsbury's free
  `illehius` actors return 403/dead-proxy. Cheapest-across-stores logic was kept
  intact so working actors can be dropped in later with no code change.
- **Made matching category- and unit-aware** (commit `1990aff`) after the first
  full run (189/208 priced) showed mismatches: Cayenne→hot sauce 354ml,
  Hazelnut→nut milk 1000ml, Lime→lime juice, Vanilla→2L drink, Baking
  Soda→liquid 75ml. Added `allowed_units(category, product)` which restricts the
  acceptable base units `{g, ml, each}` and rejects wrong-form result names,
  driven by the CSV `Category` plus word heuristics (`_SOLID_CATS`,
  `_PRODUCE_CATS`, `_LIQUID_WORDS`, `_SOLID_WORDS`, `_BAD_FORM_WORDS`), plus
  `UNIT_OVERRIDES` and an expanded `TERM_OVERRIDES`. Validated every known bad
  case flips correct while legit liquids (soy sauce, milk) still pass.
- **Fixed an own-words rejection bug**: "Bicarbonate of **Soda**" was tripping
  the "soda" bad-form word. Fix: `reject_words -= set(canonicalise(product).split())`.
- **Wrote `handoff.md`** (commit `ba0852d`) capturing full pipeline state.
- **Opened draft PR #13**, Saffron marked it ready, and it **merged to `main`**.
  (PR #7's branch had advanced past its merge point, so the post-merge fixes
  needed their own PR — #13.)
- Helped Saffron debug runtime issues on her machine: literal placeholder token
  → 401; running from the wrong directory → `fatal: not a git repository` (must
  `cd` into the repo first); token not persisting → re-`export` each session.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|-----------|--------|----------|
| scripts/price_pricebook.py | Fill pipeline; ASDA-only + v2 category-aware matching | Modified | repo root /scripts/ |
| scripts/csv_to_seed.py | Regenerates app's `seedPriceBook()` from filled CSV | Unchanged this session | /scripts/ |
| scripts/README.md | Novice run guide | Created earlier (PR #7) | /scripts/ |
| handoff.md | Pipeline resumption notes | Created | repo root |
| logs/daily-shuffle_log.md | This conversation log | Created | repo root /logs/ |
| pricebook.csv | Source ingredient list (input) | Unchanged | repo root |
| .gitignore | Ignores generated outputs | Modified earlier | repo root |

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | This log entry (Rolling Log + GitHub Push mode) |

## Decisions & Reasoning
- **ASDA-only, not three-store comparison**: Tesco and Sainsbury's free
  `illehius` actors are blocked by anti-bot (HTTP 403 / dead proxy) and return
  nothing. ASDA is the only one that gets through. Kept the cheapest-across-
  stores code so working actors can be added later with zero refactor.
- **Reject mismatches → leave blank (no caching)**: Better an unpriced product
  than a confidently-wrong, wrong-form price. Consequence: the unmatched count
  may *rise* vs the naive v1 run; those land in `price_report.md`. No caching, so
  each run re-scrapes (acceptable at this scale/cost).
- **Build-only, Saffron runs it**: the cloud sandbox's egress allowlist blocks
  `api.apify.com`, and the scrape spends real pay-per-result money on her token.
  So the scripts are designed to run on her Mac; nothing is executed from here.
- **Scope = products with occurrences ≥ 3** (~208): pricing one-off ingredients
  isn't worth the query cost.
- **Category-aware filtering over a bigger match threshold**: the real failures
  were wrong *form* (right words, wrong product type), which a score threshold
  can't catch — only unit/category constraints can.
- **Separate PR (#13) for post-merge fixes**: PR #7 was already merged at an
  older commit; reopening it wasn't possible, so the fixes got a clean new PR.

## Current State (end of session)
PR #13 is **merged into `main`**. `main` now contains: the ASDA-only Apify
integration, v2 category-aware matching, and `handoff.md`. CI: none configured
on this repo. **Critically, the app's prices are unchanged** — `pricebook.csv`
is still unfilled and `index.html`'s `seedPriceBook()` is untouched. The
pipeline is *ready to run* but has not been run end-to-end against live data.

## Next Steps
1. On Saffron's Mac: `cd` into the repo (where `pricebook.csv` lives — verify
   `git status` works), then `git pull`.
2. `export APIFY_TOKEN=apify_api_...` (real token from console.apify.com →
   Settings → Integrations; must re-export each terminal session).
3. `python3 scripts/price_pricebook.py` (full run). Paste back the summary line
   (`Priced X/208 …`) and `cat price_report.md`.
4. Verify the previously-mismatched items (Vanilla, Cayenne, Hazelnut, Lime,
   Baking Soda) are now correctly priced or cleanly blank — and watch for
   over-rejection (a genuinely liquid pantry item forced to grams by a bad CSV
   Category). Add `TERM_OVERRIDES`/`UNIT_OVERRIDES` entries for any stragglers.
5. Once the fill looks clean: `python3 scripts/csv_to_seed.py --in
   pricebook.filled.csv` (preview), then `--apply` to patch `index.html`
   (writes `index.html.bak`). Review the diff before committing.

## Open Questions / Blockers
- **Blocker (external):** the full scrape can only run on Saffron's machine with
  her token — sandbox egress blocks `api.apify.com`. Nothing else proceeds until
  she runs it and shares the output.
- **Open:** will v2 over-reject any legitimate liquids whose CSV Category is
  wrong? Only the post-run `price_report.md` will reveal this.

## Environment & Config Notes
- Repo: `saffronlm-cmyk/daily-shuffle`. Dev branch this session:
  `claude/gifted-mendel-2cq60n`. Base: `main`.
- Apify endpoint: `run-sync-get-dataset-items`. Actor: `illehius~asda-scraper`.
  Input `{"queries":[term],"maxResultsPerQuery":N}`. ASDA output fields:
  `name`, `price`, `unitSize`, `unitPrice`, `unitPriceMeasure`, `productUrl`.
- Secret (name only): `APIFY_TOKEN` — never persisted, re-exported per session.
- Python: stdlib only (urllib, csv, json, argparse, re). No `pip install`.
- App seed flag bumps `ds_pb_seeded_v2` → `ds_pb_seeded_v3` so new prices load.
- Cloud sandbox is ephemeral: anything not committed/pushed is lost.

## Notes & Gotchas
- `canonicalise()` is duplicated in `price_pricebook.py`, `csv_to_seed.py`, AND
  `index.html` — all three MUST stay in sync or keys/aliases won't match.
- The own-words rejection bug (product rejected for containing its own name,
  e.g. "soda") is subtle — any new bad-form word that overlaps a real product
  name will resurface it. Fix pattern: subtract the product's own words.
- `maxResultsPerQuery` MUST be set or the actor returns `[]`.
- Use `--probe TERM` to confirm actor field names before a big run; use
  `--dry-run` to preview the query list and cost with no token/spend.
- Generated files (`pricebook.filled.csv`, `price_report.md`,
  `scripts/seed_snippet.js`, `index.html.bak`) are git-ignored.
- `handoff.md` at repo root is the quick-start companion to this log.

---

# Tracker: cross-device sync fix, saved meals, TDEE/deficit, skill install
**Date:** 2026-06-25
**Project:** Daily Shuffle
**Mode:** Rolling Log + GitHub Push
**Status:** Complete

---

## Project Context
Daily Shuffle is a personal PWA (progressive web app) shipped as a single `index.html` plus a `sw.js` service worker, in the GitHub repo `saffronlm-cmyk/daily-shuffle`. It includes a **Tracker** tab — a MyFitnessPal-style food/macro tracker tailored for a coeliac (gluten-free) and dairy-free user with PCOS-aware flags. The tracker persists to a Supabase project and is intended to work across devices (phone + laptop) as an installed PWA.

This is the first entry in this rolling log, so it captures the working context in full.

## Session Goal
Several threads in one session:
1. Fix the Tracker not loading seeded staples / recipes.
2. Diagnose and fix tracking not persisting across sessions/devices.
3. Add a **bulk paste** importer for staple products.
4. Design + build **saved meals** (reusable multi-product meal compositions).
5. Add **TDEE logging** and correct the deficit math at the top of the tracker.
6. Install the **save-conversation** skill into the repo.

## State Before This Session
- The Tracker UI, Supabase persistence wiring, staples manager, and AI quick-add already existed (built in prior work — see task history: migration for `staple_products`/`food_log`/`day_meta` + RLS applied, 25 staples seeded).
- Bug: seeded staples and the recipe picker weren't appearing in the app.

## What Was Done
Shipped as five PRs, all merged to `main`:

- **PR #9 — creds fix.** Root cause of staples/recipes not loading: the tracker's REST calls used the user's *optional personal* Supabase credentials (`supabaseUrl`/`supabaseKey` from Settings → Cloud Sync), which were empty. The tracker tables actually live in the **bundled** project referenced by the hardcoded `RECIPE_LIB_URL`/`RECIPE_LIB_KEY` (`index.html:1102-1103`). Added `TRK_SB_URL`/`TRK_SB_KEY` constants (`index.html` ~4765) that prefer the bundled project and fall back to personal creds. Repointed all 9 tracker REST call sites. The separate `user_library` cloud-sync path was left untouched.

- **Bulk paste importer** (folded into the #9 branch). New "📋 Bulk paste a list" button in the Staples manager: paste freeform product text → Claude (haiku) parses into structured `staple_products` rows → review/edit/drop → batch insert in one REST call (`trkUpsertStaplesBatch`). Reuses the quick-add Anthropic pattern.

- **PR #10 — surface sync failures.** The food_log/day_meta write helpers (`trkPushEntry`, `trkPushDeleteEntry`, `trkSaveMeta`) ignored the HTTP response, so a rejected write was invisible — data looked saved but only lived in the per-device `localStorage` mirror. This is *why* logging never persisted before the creds fix. Now each checks `res.ok` and toasts a ⚠ warning on failure. Verified the backend end-to-end: impersonated the `anon` role and inserted into both `food_log` and `day_meta` successfully (then cleaned up the test rows); schema matches the app payload field-for-field; RLS is wide open (`anon ALL` with `true`).

- **PR #11 — saved meals + entry quantity editing.** New `saved_meals` table. A saved meal stores `name`, optional `meal_type`, and an `items` array. Each item is **product-level and linked**: `source_type` + `source_id` link back to the originating staple (so the meal auto-updates if the staple's nutrition changes), plus `per_unit` macros + `qty` + `unit` so non-staple/AI items still rescale. Save from a meal card (💾 save as meal) or from the AI quick-add confirm screen. Apply via a new 🍱 Saved meals tile in the add chooser; each item drops in as its own entry, staple-linked items recomputed from current staple nutrition. Manager to rename/delete. Also added an ✎ entry editor that rescales macros when you change title/quantity (makes "alter quantities after applying a meal" real). Writes back via the existing `id`-keyed upsert.

- **PR #12 — TDEE + deficit.** New nullable `tdee` column on `day_meta` and a TDEE input on the exercise card (Apple Watch end-of-day total burn). When TDEE is set: header shows **Deficit = TDEE − Food** (flips to "Surplus" with over-colour when food > burn); exercise is treated as already inside TDEE and *not* added separately (no double-count); Goal is excluded from the equation, shown only as faint reference and still driving macro target bars. When no TDEE: deficit line reads "— log TDEE" rather than a misleading number.

- **PR #15 — save-conversation skill.** Installed `.claude/skills/save-conversation/SKILL.md` (this skill) from an uploaded `.skill` bundle.

## Artifacts Produced / Modified

| File | What it is | Status | Location |
|------|-----------|--------|----------|
| index.html | The entire app (UI + tracker logic). Creds fix, bulk import, sync-failure handling, saved meals, entry editing, TDEE/deficit. | Modified | `/daily-shuffle/index.html` |
| sw.js | Service worker. Cache version bumped repeatedly; now `daily-shuffle-v23`. | Modified | `/daily-shuffle/sw.js` |
| .claude/skills/save-conversation/SKILL.md | The save-conversation skill definition. | Created | `/daily-shuffle/.claude/skills/save-conversation/` |
| logs/daily-shuffle_log.md | This rolling log. | Created | `/daily-shuffle/logs/` |
| Supabase: saved_meals table | New table for saved meals. | Created (migration `create_saved_meals`) | project `jsxcctrskkkxgdxfaduo` |
| Supabase: day_meta.tdee column | Nullable numeric for per-day TDEE. | Created (migration `add_tdee_to_day_meta`) | project `jsxcctrskkkxgdxfaduo` |

## Skills Used

| Skill | What it contributed |
|-------|-------------------|
| save-conversation | Produced this handoff log entry (first run, immediately after the skill was installed). |

## Decisions & Reasoning
- **Tracker points at the bundled Supabase project, not personal creds**: personal creds are empty for most users, so the tracker silently fell back to localStorage-only. The recipe library already used the hardcoded bundled project; the tracker tables live there too. Fallback to personal creds retained for anyone who sets them.
- **Cross-device sync uses a single shared anon-key dataset keyed by date, no per-user auth**: for a personal single-user app this is what makes cross-device "just work" with zero setup. Trade-off: anyone running the app sees the same data. Documented future path: add a passphrase or Supabase Auth and scope rows by `user_id`. Not built — deferred until/unless Saffron wants privacy/multi-user.
- **Saved meals are linked + product-level, not a flat macro snapshot**: Saffron wants to reuse the same meal across days *and* tweak quantities, and have edits to a staple's nutrition flow through. So items carry `source_id` (staple link) + `per_unit` macros + `qty`. A "flat macro blob" is just the degenerate one-item manual case — falls out of the same model.
- **Deficit = TDEE − Food, with Goal excluded and exercise folded into TDEE**: Apple Watch EOD total burn already includes active/workout energy, so adding logged exercise on top would double-count. Goal stays out of the deficit equation (Saffron's explicit call) but still drives macro targets.
- **No-TDEE days show "— log TDEE" rather than a computed number (option a)**: `exercise − food` isn't a real expenditure and would read as a phantom deficit. Honest blank until the day's burn is entered.
- **Surface write failures via res.ok check**: silent failures previously masked the entire persistence problem; never again.
- **Saved-meal naming via browser `prompt()`**: quick and reliable in the PWA; flagged as easy to swap for an in-modal field later.

## Current State (end of session)
All five PRs merged to `main`. The live app at cache `v23` has: working cross-device persistence, bulk staple import, saved meals with linked items + quantity editing, and TDEE-based deficit. Both Supabase migrations (`saved_meals`, `day_meta.tdee`) are applied. The save-conversation skill is in the repo and available to future Cloud sessions.

## Next Steps
1. **Saffron to load v23** — reopen the PWA twice (or hard-refresh) so the service worker updates; verify staples list, saved meals, and TDEE/deficit all behave.
2. If saved-meal naming feels clunky on mobile, replace the `prompt()` calls (`trkSaveMealFromSlot`, `trkSaveMealFromQa`, `trkRenameSavedMeal`) with an in-modal text field.
3. Optional: if privacy/multi-user is ever wanted, add a passphrase or Supabase Auth and scope `food_log`/`day_meta`/`saved_meals`/`staple_products` by `user_id` (currently global).
4. Optional: quick-add staple linking matches by name/alias only (`trkFindStapleId`); meals saved from a meal card carry exact `source_id`. Could improve quick-add fidelity if needed.

## Open Questions / Blockers
None outstanding. Privacy/multi-user is the main deferred design question, awaiting Saffron's call.

## Environment & Config Notes
- **Repo:** `saffronlm-cmyk/daily-shuffle`. Mandated dev branch for Cloud sessions: `claude/keen-wright-0ldzxz` (reset to `origin/main` per PR; all work via draft PRs, never pushed to `main` directly).
- **App shape:** single `index.html` + `sw.js`. No build step. JS lives in `<script>` blocks; validate by evaluating each block with `new Function(...)`.
- **Supabase project:** `jsxcctrskkkxgdxfaduo` (`https://jsxcctrskkkxgdxfaduo.supabase.co`). Anon key hardcoded as `RECIPE_LIB_KEY` (`index.html:1102-1103`); tracker uses `TRK_SB_URL`/`TRK_SB_KEY` (~`index.html:4765`).
- **Tracker tables:** `recipes`, `staple_products` (25 seeded), `food_log` (PK `id` text), `day_meta` (PK `date_key` text, now has `tdee`), `saved_meals` (PK `id` text). All have open `anon ALL` RLS. Writes use `Prefer: resolution=merge-duplicates` so re-POSTing a row by PK upserts.
- **Service worker:** bump `CACHE` in `sw.js` on every shippable change (currently `daily-shuffle-v23`) or the PWA serves stale cached HTML.
- **AI features:** call Anthropic directly from the browser with the user's `ds_api_key` (localStorage), model `claude-haiku-4-5-20251001`, header `anthropic-dangerous-direct-browser-access: true`.
- **Proxy gotcha:** the agent environment's HTTPS proxy blocks direct `curl` to `*.supabase.co`; validate REST behaviour via the Supabase MCP (e.g. `set local role anon;` to test RLS) rather than curl.

## Notes & Gotchas
- **PWA caching is the #1 "it didn't work" cause.** After any merge, Saffron must reload twice / hard-refresh for the new `sw.js` cache version to take effect. If a fix "isn't showing," check the cache version first.
- **Repo has no CI** (`get_status` → `total_count: 0`) and no required checks, so PRs merge freely once opened.
- **Same dev branch reused across PRs.** Because every PR uses `claude/keen-wright-0ldzxz`, build sequential PRs one at a time: reset the branch to `origin/main` only *after* the previous PR merges, or they collide.
- **Write helpers are now fail-loud** — if a sync ever breaks, expect a ⚠ toast, not silent data loss.
- **Don't double-count exercise on TDEE days** — this invariant is baked into the deficit math; preserve it if the header is ever refactored.

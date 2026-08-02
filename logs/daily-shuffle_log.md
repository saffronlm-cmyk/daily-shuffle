# Daily Shuffle — Conversation Log

Rolling log of Claude sessions on the Daily Shuffle project. Newest entry at the top.

---

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
- **Macros are an AI estimate** (flagged in `notes`, same as the sibling): per serve
  cal 590 / protein 46 / carbs 47 / fat 13 / fibre 9 / sugar 15. Derived by hand-summing
  ingredient macros (chicken mince 5% ≈ 172 kcal·20 g P/100 g dominates; konjac ≈ 0;
  glass noodles + brown sugar + sweet chilli drive carbs/sugar) and dividing by 5. Rough
  — not from the nutrition pipeline (step 3 is still blocked).
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

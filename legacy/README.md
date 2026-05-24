# Legacy modules

These files are verbatim lifts from `index.html` (commit `e4f8a13` and earlier) of
features that were stashed during the Daily Shuffle foundations restructure.
They are NOT loaded by the live app — they live here so they can be re-grafted
once the foundations (Shuffle / Recipes / Grocery / Add Recipe) are stable.

Each module has up to three sibling files:

| File              | Content                                                |
|-------------------|--------------------------------------------------------|
| `*.partial.html`  | The `<div id="tab-…">` block (or modal markup).        |
| `*.css`           | All CSS rules that lived inside `<style>` for the tab. |
| `*.js`            | All JavaScript that powered the tab.                   |

## Modules

### `track.*` — Daily Food Log
Logged meals across breakfast / snack / lunch / dinner / dessert with macro
totals + targets bars.
- Source lines in old `index.html`: HTML 1103–1107 · CSS 451–491, 522, 551–552 · JS 1598–1857
- localStorage keys owned: `ds_food_log`, `ds_targets`
- Settings rows that came with it: Daily Macro Targets (kcal / protein / carbs / fat)
- Depends on: `pantry.*` (the picker can pick pantry items), `macro-calc.*`
  (settings opens it via the ⚙ button).

### `pantry.*` — Branded Pantry Items
Saved branded products with per-serving macros for quick logging.
- Source lines: HTML 1109–1112 · CSS 493–521 · JS 1858–2178
- localStorage key owned: `ds_pantry`
- Depends on: AI parse helper (`switchPantryAiTab`, `parsePantryWithAI`) which
  reuses the Claude key set in Settings.

### `discover.*` — Edamam Recipe Search
Web recipe search via Edamam, with "Add to Library" handoff to Add Recipe tab.
- Source lines: HTML 1114–1127 · CSS 555–582 · JS 2206–2326
- localStorage keys owned: `ds_edamam_id`, `ds_edamam_key`
- Settings rows that came with it: Edamam Recipe Search (App ID + App Key)

### `wellness.*` — Supplements + Reddit Community
Daily supplement tracker with streaks, plus pinned Reddit posts from r/PCOS &
r/WomensHealth.
- Source lines: HTML 1129–1184 · CSS 585–642 (supp-* and reddit-*) · JS 1581–1596, 4435–4642
- localStorage keys owned: `ds_supplements`, `ds_supp_log`, `ds_saved_posts`

### `macro-calc.*` — Mifflin-St Jeor Calculator
Modal that calculates daily macro targets from age / sex / weight / height /
activity / goal.
- Source lines: HTML 4714–4774 · CSS 525–549 · JS 4644–4710
- Depends on: `track.*` (writes into the Track tab's `targets` object).

### `breakfast-rotate.partial.html` (Phase 3, not Phase 1)
The original "Rotate / Same every day" select for the breakfast slot, removed
when the Shuffle tab was simplified to auto-rotate based on day count.

## Re-grafting checklist

When ready to bring a module back:
1. Re-add the `<nav>` button in `index.html` and a matching `switchTab()` case.
2. Re-add the tab's `<div id="tab-…">` block from `*.partial.html` into `<main>`.
3. Re-add the CSS rules from `*.css` inside the existing `<style>` block.
4. Re-add the JS from `*.js` inside the existing `<script>` block.
5. If the module owns localStorage keys, re-add the load-on-boot lines and the
   sync `getLibraryPayload()` / `loadFromSupabase()` entries.
6. If the module added Settings rows, re-add them inside `#settingsOverlay`.
7. Bump `sw.js` cache version so installed PWAs pick up the change.

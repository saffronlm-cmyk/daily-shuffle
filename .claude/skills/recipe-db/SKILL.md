---
name: recipe-db
description: |
  Schema map and safety conventions for bulk data work against Daily Shuffle's bundled
  Supabase project (jsxcctrskkkxgdxfaduo). Use whenever reading or writing the recipes,
  staple_products, food_log, day_meta, saved_meals, or user_library tables via the
  Supabase MCP tools — e.g. "apply the quantity normalisation", "update the recipes
  table", "load the staples", "run a migration", "bulk update nutrition", or any
  session applying reviewed CSV rows to the database.
---

# recipe-db

## Purpose

The bundled Supabase project is the app's real data store — it backs the live PWA with
open anon RLS and no backups beyond what's committed to this repo. Bulk writes are
therefore done with a propose → review → apply → verify discipline, never in one shot.

## Schema map

Project: `jsxcctrskkkxgdxfaduo` (hardcoded in `index.html` as `RECIPE_LIB_URL`).

| Table | What it holds | Keying / notes |
|---|---|---|
| `recipes` | Recipe library (~327 rows; `import_status='ready'` ≈ 305) | `ingredient_sections` jsonb (free text); `review_flags`; `ingredient_grams` jsonb planned by step 2 (not yet created) |
| `staple_products` | Generic ingredient macros grounding AI estimates (~167 rows) | per-100 g macros, expanded via usda_staples.py |
| `food_log`, `day_meta`, `saved_meals` | Tracker state | date/id-keyed, upserted with `Prefer: resolution=merge-duplicates` |
| `user_library` | Cross-device sync blob (price book etc.) | row `id='default'`; belongs to the personal-creds path — rarely touched |

All tables: open `anon ALL` RLS, no `user_id` scoping — single-user app.

## Rules of engagement

1. **Non-destructive by default.** New derived data goes in a NEW column (e.g.
   `ingredient_grams` jsonb), never by overwriting the source column
   (`ingredient_sections` is the raw truth — read-only in practice).
2. **Pre-write review CSV.** Any bulk write (>~10 rows) is first emitted as a CSV for
   Saffron to spot-check, and applied only after her OK. This is how every prior bulk
   op in this repo was done — keep it.
3. **Count before and after.** Before writing: `select count(*)` of the rows you expect
   to touch, and state the number. After: verify the same count changed and report it.
4. **Respect locked decisions.** `quantity-normalisation-plan.md` §6 decisions are
   signed off (UK 250 ml cup; skip the 8 no-`serves` recipes with `serves_missing`;
   5 g garnish default; `ingredient_grams` as source of truth). Apply them; do not
   reopen them.
5. **Flag, don't guess.** Uncertain rows get a `review_flags` value
   (`quantities_estimated`, `serves_missing`, …) rather than a silently-invented value.
6. **Schema changes via `apply_migration`**, data via `execute_sql` — and run
   `list_tables` first rather than trusting this doc's row counts.
7. Step ordering is hard: **no bulk nutrition write (step 3) until `ingredient_grams`
   (step 2) is applied.**

## Output format for a bulk operation

Report in four stages, each confirmed before the next:

```
1. PLAN    — tables/columns touched, row count expected, migration needed y/n
2. REVIEW  — path of the emitted review CSV + the 3–5 rows most worth eyeballing
3. APPLY   — SQL/migration run, rows affected
4. VERIFY  — post-write counts + spot-check of 2–3 rows read back
```

## Example

Applying quantity normalisation: (1) PLAN — add `ingredient_grams` jsonb via migration;
~297 recipes in scope (305 ready minus 8 `serves_missing`); (2) REVIEW — emit
`qty-normalisation-review.csv`, flag the pumpkin-puree row (density-derived, 255 g) for
eyeballing; (3) APPLY after OK; (4) VERIFY — 297 rows have non-null `ingredient_grams`,
8 rows carry `serves_missing`, read back 3 recipes and sanity-check grams.

## Do-nots

- Do NOT overwrite or "clean up" `ingredient_sections` — it is the raw source of truth.
- Do NOT bulk-write without the review-CSV step, even when confident.
- Do NOT run DELETEs or destructive UPDATEs without a preceding count and explicit OK.
- Do NOT touch `user_library` unless the task is explicitly about personal cloud sync.
- Do NOT re-ask questions the plan doc already answers.
- Do NOT modify RLS/auth in passing — multi-user is a deliberately deferred decision.

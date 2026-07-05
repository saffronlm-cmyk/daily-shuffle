# Daily Shuffle

A personal meal-planning PWA (Progressive Web App) — shuffle a meal plan, manage recipes,
build a grocery list, and track food/macros. Ships as a static site with **no build step**.
Single user (Saffron), no auth, deployed as static files.

## Architecture

- **`index.html`** — the entire app. All markup, `<style>` CSS, and JS (three `<script>`
  blocks) live in this one file (~6,000+ lines, ~350 KB). No bundler/transpiler; edit it
  directly. Validate before committing (see Dev workflow).
- **`sw.js`** — service worker. **Network-first for the HTML document** (a deploy shows up
  on the next open — this fixed the old "hard-refresh twice" problem), cache-first for
  static assets, straight passthrough (never cached) for `api.anthropic.com` /
  `supabase.co` / `edamam.com`. **Bump the `CACHE` constant on every shippable app-code
  change** — one bump per PR. Doc-only, data-only, or `scripts/`-only changes do **not**
  need a bump. Always read the current version from `sw.js` itself; never trust a version
  number written in a doc.
- **`manifest.json`** — PWA manifest (icons, theme, standalone display).
- **`legacy/`** — verbatim-lifted tabs stashed during the foundations restructure
  (Track/Food Log, Pantry, Discover/Edamam, Wellness, Macro Calculator). Not loaded by the
  live app. See `legacy/README.md` for source line refs and the re-grafting checklist.
- **`scripts/`** — two standalone Python 3 pipelines (stdlib only, no `pip install`),
  plus the Node smoke test (below):
  - **Price-book**: `price_pricebook.py` (CSV → Apify scrape → filled CSV) →
    `csv_to_seed.py` (patches `seedPriceBook()` in `index.html`). Input: `pricebook.csv`.
  - **Nutrition staples**: `usda_staples.py` (`staple_candidates*.csv` → USDA FDC →
    `staple_report.csv`, reviewed then applied to Supabase `staple_products` via MCP).
  - Both are **build-only, run locally by Saffron** — the sandbox egress gateway blocks
    `api.apify.com` and `api.nal.usda.gov` (confirmed 403 `connect_rejected`). Never run
    them from an agent session; she runs them on her Mac and pastes results back.
  - See `scripts/README.md` for flags (`--dry-run`, `--probe`, `--sample`) and gotchas.
  - **`smoke_test.mjs`** — headless-browser smoke test (Playwright/Chromium, runs fine
    in the sandbox, fully offline). `node scripts/smoke_test.mjs`. See the `smoke-test`
    skill.
- **`tools-apply-master.mjs`** — one-off Node tool from the ingredient-normalisation
  stream. Carries a frozen "app-verbatim" copy of `canonicalise()` — see the sync warning
  in Dev workflow.
- **Committed data CSVs (root)** — inputs/outputs of the data workstreams:
  `pricebook.csv`, `pricebook.variants.csv`, `ingredient-master.csv`,
  `recipe-ingredient-normalisation.csv` / `.final.csv`, `split-plan.csv`,
  `unmatched-ingredients.csv`, `null-lines-reentry.csv`. These encode reviewed human
  decisions — never regenerate, reorder, or "clean up" one without being asked.
- **Planning / handoff docs** — read before touching the related area:
  - `logs/daily-shuffle_log.md` — rolling session log, newest first. **Read the top entry
    at the start of every session** — it says exactly where things stand.
  - `quantity-normalisation-plan.md` — approved ruleset for ingredient-quantity
    normalisation (nutrition step 2). Decisions are locked (UK 250 ml cup, skip the 8
    no-`serves` recipes, etc.) — apply it, don't re-litigate it.
  - `HANDOFF.md` — roadmap for the ingredient → price book → cost feature stream.
  - `handoff.md` — resume point for the Apify price-book pipeline. (Yes, two different
    handoff files differing only by case — don't confuse them.)
- **`.github/workflows/supabase-keepalive.yml`** — daily ping so the free-tier Supabase
  project doesn't auto-pause. Schedule triggers only fire from `main`, so it must stay
  on `main`. The inlined anon key is already public in `index.html` — not a leak.

## Tabs (current, in `index.html`)

`tab-recipes`, `tab-plan` (Shuffle), `tab-grocery`, `tab-add` (Add Recipe), `tab-tracker`
(Tracker — food/macro log). Tabs removed during the foundations restructure live in `legacy/`.

## Data & sync

- **Local persistence**: most state lives in `localStorage` under `ds_*` keys (e.g.
  `ds_pricebook`, `ds_custom_recipes`, `ds_hidden_recipes`, `ds_grocery`, `ds_favourites`,
  `ds_recipe_cache` for the offline-first recipe library cache, `ds_trk_*` for the
  tracker). Check existing key names before adding new state.
- **Bundled Supabase project** (`jsxcctrskkkxgdxfaduo`, hardcoded as
  `RECIPE_LIB_URL`/`RECIPE_LIB_KEY` in `index.html`): backs the recipe library **and** the
  Tracker (`recipes`, `staple_products` (~167 rows after the USDA expansion), `food_log`,
  `day_meta`, `saved_meals`, all PK-keyed with open `anon ALL` RLS, upserted via
  `Prefer: resolution=merge-duplicates`). The Tracker's `TRK_SB_URL`/`TRK_SB_KEY` prefer
  this bundled project and fall back to personal creds.
- **Personal Supabase creds** (`ds_supabase_url`/`ds_supabase_key`, Settings → Cloud
  Sync): optional, used only by the separate `user_library` cross-device sync path.
  Most sessions can assume they are NOT set.
- **No per-user auth** — single-user app; writes use a shared anon key keyed by date/id.
  Multi-user/privacy is deferred (see log).
- **Write helpers must check `res.ok`** and surface a ⚠ toast on failure — a past bug
  silently dropped tracker writes. Don't regress this; apply the same rule to any new
  fetch-write you add.
- Supabase MCP tools are available in agent sessions for direct table work (bulk data
  application, migrations). App-facing writes still go through the REST helpers in
  `index.html`.

## Active workstream: nutrition estimation (3 steps)

1. **Staple macros** (done) — `staple_products` expanded to ~167 rows via
   `usda_staples.py` + manual review.
2. **Quantity normalisation** (approved, **not applied**) — ruleset in
   `quantity-normalisation-plan.md`. Applying it means: new non-destructive
   `ingredient_grams` jsonb column on `recipes`, skip the 8 no-`serves` recipes
   (flag `serves_missing`), emit a pre-write review CSV first.
3. **Bulk nutrition re-population** (blocked) — **must not run until step 2 is applied.**

## AI features

In-browser calls direct to `https://api.anthropic.com/v1/messages` using the user's own
key (`ds_api_key` in `localStorage`, set via Settings), model `claude-haiku-4-5-20251001`,
header `anthropic-dangerous-direct-browser-access: true`. Used for: pantry item parsing,
recipe quick-add, bulk staple paste import, tracker AI quick-add.

## Dev workflow

- No CI checks, no test suite — PRs merge freely once opened. The only automated workflow
  is the Supabase keep-alive.
- **Branches/PRs**: work on `claude/*` branches, open a draft PR. A **merged PR is
  finished** — for follow-ups, restart the branch from latest `main`
  (`git fetch origin main && git checkout -B <branch> origin/main`); never stack commits
  on merged history.
- **Validate JS before committing any `index.html` change** (no linter exists to catch
  syntax errors):

  ```bash
  node -e '
  const html = require("fs").readFileSync("index.html","utf8");
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i) => {
    try { new Function(m[1]); console.log("script block", i+1, "OK"); }
    catch (e) { console.error("script block", i+1, "FAILED:", e.message); process.exitCode = 1; }
  });'
  ```

- **Smoke-test UI changes**: `node scripts/smoke_test.mjs` — boots the app in headless
  Chromium (offline, fixture recipes) and checks clean boot, tab switching, and shuffle.
  This is the only runtime check the repo has; the parse check above cannot catch a
  broken button or tab. See the `smoke-test` skill.
- **`canonicalise()` exists in FIVE places** — the app (`index.html`),
  `scripts/price_pricebook.py`, `scripts/csv_to_seed.py`, `scripts/usda_staples.py`
  (same key logic), and `tools-apply-master.mjs` (frozen snapshot). If you change the
  app's copy, update the scripts' copies to match or price-book/staple keys stop
  matching; the `tools-apply-master.mjs` copy is a historical snapshot — leave it.
- Before shipping any `index.html` change, run the **`ship-check`** skill (JS parse check,
  smoke test, cache-bump decision, canonicalise sync, `res.ok` audit).
- For any bulk read/write against the Supabase tables, use the **`recipe-db`** skill —
  it holds the schema map and the non-destructive-write conventions.
- Generated/local-only files are gitignored: `pricebook.filled.csv`, `price_report.md`,
  `scripts/seed_snippet.js`, `scripts/staple_report*.csv`, `index.html.bak`.

---

## Session Logging (always on)

Log file: `logs/daily-shuffle_log.md` — rolling log, newest entry at top, committed and
pushed on the session's working branch.

At the end of **every** session — or whenever asked ("save this conversation", "log this
session", "capture this", "save notes from this", "create a conversation log") — invoke
the **`save-conversation`** skill and follow it exactly. Do not skip this, even for short
sessions. The skill owns the entry template and the prepend/commit workflow — it is the
single source of truth for the log format.

The standard: a future Claude session with zero memory of this conversation must be able
to pick up and continue without asking for re-explanation. Err on the side of more
detail, not less.

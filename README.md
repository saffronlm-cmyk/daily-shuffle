# Daily Shuffle

A personal meal-planning app. Shuffle a week of meals, keep a recipe library, turn the plan into a grocery list, and log what you actually ate against your macros.

It's a Progressive Web App that ships as plain static files: no build step, no bundler, no framework. Open `index.html` and it runs; add it to a phone's home screen and it behaves like an installed app, offline included.

## What it does

| Tab | Purpose |
|---|---|
| **Recipes** | Browse, search and edit the recipe library, with per-serving macros |
| **Shuffle** | Generate a meal plan, either by shuffling or with AI, and send it to the Tracker |
| **Grocery** | Build a shopping list from the plan, costed against a UK supermarket price book |
| **Add Recipe** | Enter a recipe by hand, or paste text / a screenshot and let AI parse it |
| **Tracker** | Daily food and macro log, with TDEE, step count and quick-add from free text |

Tabs retired during the foundations restructure (Pantry, Discover, Wellness, Macro Calculator, the old Food Log) are kept in [`legacy/`](legacy/README.md). They're not loaded by the live app.

## Running it

There's nothing to install. Serve the folder over HTTP, since service workers won't register from `file://`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

To deploy, upload the repo root to any static host. `index.html`, `sw.js`, `manifest.json` and the two icons are all the live app needs.

### Optional setup (in the app's Settings)

- **Anthropic API key** - enables the AI features (recipe parsing, macro estimates, AI meal plans, Tracker quick-add). Calls go straight from the browser to the Anthropic API using your own key, which is stored only in `localStorage`.
- **Personal Supabase credentials** - enables cross-device sync of your own library. Not needed for normal use.

## How it's built

- **`index.html`** holds the entire app: markup, CSS and JavaScript in one file. Edit it directly.
- **`sw.js`** is the service worker. HTML is network-first, so a deploy shows up on the next open; static assets are cache-first; API calls are never cached.
- **Data** lives in `localStorage` (`ds_*` keys), with the recipe library and Tracker backed by a bundled Supabase project. It's a single-user app with no authentication.
- **`scripts/`** holds the supporting pipelines: price-book scraping, USDA nutrition staples, ingredient-quantity normalisation, and the test tooling. See [`scripts/README.md`](scripts/README.md).
- **Root CSVs** are reviewed working data for those pipelines. Treat them as records of decisions, not disposable output.

## Development

There's no CI and no test suite, so these two checks are the safety net. Run both before committing any change to `index.html`.

```bash
# 1. Every <script> block parses
node -e '
const html = require("fs").readFileSync("index.html","utf8");
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i) => {
  try { new Function(m[1]); console.log("script block", i+1, "OK"); }
  catch (e) { console.error("script block", i+1, "FAILED:", e.message); process.exitCode = 1; }
});'

# 2. The app boots, tabs switch and shuffle works (headless Chromium, offline)
node scripts/smoke_test.mjs
```

Two conventions matter on every shippable change:

- **Bump the `CACHE` constant in `sw.js`**, once per PR, or installed copies may keep serving the old version.
- **Any new write to Supabase must check `res.ok`** and show a ⚠ toast on failure, so a failed save is never silent.

## Further reading

| Document | Covers |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | The full technical reference: architecture, data model, conventions, active workstreams |
| [`logs/daily-shuffle_log.md`](logs/daily-shuffle_log.md) | Session-by-session history, newest first. Start here to see where things stand |
| [`BRAND.md`](BRAND.md) | Colour tokens, type, components. Read before any visual work |
| [`MONETIZATION.md`](MONETIZATION.md) | Monetisation and rollout roadmap |
| [`quantity-normalisation-plan.md`](quantity-normalisation-plan.md) | Approved rules for normalising ingredient quantities |
| [`pricebook-audit.md`](pricebook-audit.md) | Audit of the price book and the open pricing-unit decision |
| [`handoff.md`](handoff.md) | Price-book pipeline resume point and the cost-aware features vision |

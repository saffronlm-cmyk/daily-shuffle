---
name: ship-check
description: |
  Pre-ship checklist for Daily Shuffle app changes. Run BEFORE committing any change to
  index.html or sw.js — when about to commit, push, open a PR, or when Saffron says
  "ship it", "deploy this", "is this ready", "bump the cache", or reports "my fix isn't
  showing" / "the app is showing the old version". Covers: JS parse validation, the
  browser smoke test, the cache-bump decision, canonicalise() sync, and the
  res.ok/toast audit for new writes.
---

# ship-check

## Purpose

There is no CI, no linter, no test suite. This checklist is the only gate between an
edit and a broken deployed PWA. Run it in full before every commit that touches
`index.html` or `sw.js`.

## Process

**1. JS parse check** — every `<script>` block in `index.html` must parse:

```bash
node -e '
const html = require("fs").readFileSync("index.html","utf8");
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i) => {
  try { new Function(m[1]); console.log("script block", i+1, "OK"); }
  catch (e) { console.error("script block", i+1, "FAILED:", e.message); process.exitCode = 1; }
});'
```

A FAILED block is a hard stop — fix it before anything else. (`new Function` catches
syntax errors only, not runtime errors — that's what step 2 is for.)

**2. Browser smoke test** — `node scripts/smoke_test.mjs` (see the `smoke-test` skill).
Boots the app headless and checks clean boot, all five tabs, and shuffle. Required for
any change that touches UI, boot code, or tab logic; skip (mark ➖) only for changes
that provably can't affect runtime (e.g. a CSS-comment tweak). Any ❌ from the smoke
test is a hard stop.

**3. Cache-bump decision** — read the current `CACHE` constant from `sw.js` (never from
a doc), then:
- App-code change in `index.html` or `sw.js` → bump the version suffix by 1
  (e.g. `daily-shuffle-v32` → `daily-shuffle-v33`). **One bump per PR**, even if the PR
  has many commits — check whether this branch already bumped it.
- Docs, `logs/`, `scripts/`, or CSV-only change → **no bump.**

**4. canonicalise() sync** — if the diff touches `canonicalise()` (or its `_STOP` list /
suffix rules) in `index.html`, the same change must land in
`scripts/price_pricebook.py`, `scripts/csv_to_seed.py`, and `scripts/usda_staples.py`,
or price-book/staple keys silently stop matching. `tools-apply-master.mjs` holds a
frozen historical snapshot — leave it alone.

**5. Write-failure audit** — if the diff adds or modifies any `fetch` that WRITES
(Supabase upserts, `user_library` sync), confirm it checks `res.ok` and surfaces a
⚠ toast on failure. Silent write-drops are a regression of a known past bug.

**6. localStorage audit** — any new persisted state uses a `ds_`-prefixed key, and the
key doesn't collide with an existing one (grep `index.html` and `legacy/` — legacy
modules own keys like `ds_food_log`, `ds_pantry` that will come back).

**7. CLAUDE.md drift** — `node scripts/claude_md_drift.mjs` catches the mechanical
cases (new tab, new script, new root data file, canonicalise copies, sw.js hosts).
Beyond that, ask: does this diff change any fact CLAUDE.md states (architecture,
data model, conventions, workstream status)? If yes, update CLAUDE.md in the same PR.

## Output format

Report the result as a checklist before committing:

```
ship-check
✅ JS parse: 3/3 script blocks OK
✅ Smoke test: 5/5 checks passed
✅ Cache: bumped daily-shuffle-v32 → v33 (app-code change)
➖ canonicalise: not touched
✅ Writes: new saveDayMeta() checks res.ok, toasts on failure
➖ localStorage: no new keys
✅ CLAUDE.md: drift check clean, no stated facts changed
→ clear to commit
```

Any ❌ line = do not commit; fix and re-run.

## Example

Diff adds a "copy grocery list" button (markup + one function, no fetch, no storage):
step 1 runs and passes, step 2 runs and passes, step 3 bumps the cache (app-code
change — yes, even for a small button), steps 4–6 are ➖, step 7's script is clean and
no CLAUDE.md fact changed. Report the checklist, commit with the bump included.

## Do-nots

- Do NOT skip the cache bump because the change "is tiny" — size is irrelevant;
  shippable app-code means bump.
- Do NOT bump the cache for doc/data/scripts-only changes — pointless churn.
- Do NOT bump twice in one PR.
- Do NOT restructure sw.js's fetch strategy as a side effect — network-first-for-HTML
  is a deliberate fix; changing it is its own decision, not a drive-by.
- Do NOT claim the change "works" beyond what was verified — say what ran (parse,
  smoke test) and what the smoke test doesn't cover (the specific new feature, unless
  a check was added for it).
- Do NOT run the scripts/ Python pipelines as part of shipping — they're local-only
  (sandbox egress blocks Apify/USDA). The smoke test is the exception: it's offline
  and sandbox-safe.

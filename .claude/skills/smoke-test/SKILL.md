---
name: smoke-test
description: |
  Run Daily Shuffle's headless-browser smoke test (scripts/smoke_test.mjs) to verify
  the app actually boots and works — not just parses. Use when Saffron says "run the
  smoke test", "does the app still work", "test the app", "check nothing broke", after
  any index.html change that touches UI/boot/tab/shuffle code, and as step 2 of the
  ship-check skill. Works fully offline in the sandbox (Supabase is unreachable and
  not needed — fixture recipes are seeded into localStorage).
---

# smoke-test

## Purpose

The parse check (`new Function`) proves the JS is syntactically valid; it cannot catch
a button wired to a missing function, a broken tab switch, or a boot-time crash. This
skill runs the real app in headless Chromium and exercises the "must never break"
flows.

## What it covers

`scripts/smoke_test.mjs` serves the repo over a local HTTP server, seeds
`ds_recipe_cache` with five fixture recipes (one per meal pool — the app is
offline-first, so this is exactly the cold-cache-with-data state), and asserts:

1. **Boot** — page loads with zero uncaught JS errors.
2. **Tabs present** — all five `tab-*` containers exist.
3. **Tab switching** — clicking each nav button activates its tab.
4. **Shuffle** — `generatePlan()` renders a plan containing the fixture recipes into
   `#planOutput`, with no "no recipes" alert.
5. **No interaction errors** — the flows above raised no uncaught JS errors.

## Process

1. Run it:

   ```bash
   node scripts/smoke_test.mjs
   ```

   Exit 0 = all green. Uses the globally installed Playwright + the sandbox's
   preinstalled Chromium — no `npm install`, no network.

2. On a ❌: reproduce the failing assertion manually (Playwright inline, or read the
   error message — it includes the uncaught exception or the alert text), fix the app
   code, re-run until 5/5.
3. If a new feature adds a flow worth protecting forever (a new tab, a new core
   button), add a check to `scripts/smoke_test.mjs` in the same style: interact via
   `page.evaluate`/`page.click`, assert on DOM state, `check(name, ok, detail)`.

## Output format

Relay the script's own checklist verbatim, plus a one-line verdict:

```
✅ boot: page loads without uncaught JS errors
✅ tabs: all 5 tab containers present — 5/5
✅ tabs: switching activates each tab — 5/5
✅ shuffle: generatePlan renders a plan from seeded recipes
✅ interactions: no uncaught JS errors during tab/shuffle flows

smoke test: 5/5 checks passed
```

If anything failed, name the failing check, the underlying error, and what you're doing
about it — never summarise a failure away as "mostly passing".

## Example

After adding a "copy grocery list" button: run the test → `boot` fails with
`copyGroceryList is not defined` (the onclick points at a function that was renamed).
Fix the onclick, re-run, 5/5, report the checklist, proceed to ship-check step 3.

## Do-nots

- Do NOT interpret a green smoke test as proof a NEW feature works — it covers boot,
  tabs, and shuffle. Verify new features by driving them directly (and consider adding
  a check).
- Do NOT weaken or delete an existing check to get to green — fix the app instead. If
  a check is genuinely obsolete (e.g. a tab was intentionally removed), say so
  explicitly and change it as part of that feature's diff.
- Do NOT point the test at the live deployed app or real Supabase — it runs against
  the local working tree with fixtures, by design.
- Do NOT `npm install` playwright locally or run `playwright install` — the global
  module and `/opt/pw-browsers` Chromium are already there; the script finds both.
- Do NOT let fixture recipes drift from the real `ds_recipe_cache` shape — if the app
  starts requiring a new field (like `cuisine`/`proteinSource`, which the card
  template calls `.charAt()` on), add it to the fixtures with a comment saying why.

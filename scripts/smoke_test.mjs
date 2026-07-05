// Daily Shuffle — browser smoke test
//
// Boots the real app in headless Chromium and exercises the "must never break"
// flows: clean boot, all five tabs switch, and Shuffle produces a plan.
// Fully offline — Supabase/Anthropic are unreachable from agent sandboxes, so
// the test seeds ds_recipe_cache with fixture recipes before the page loads
// (same key the app's offline-first boot reads).
//
// Run:  node scripts/smoke_test.mjs
// Uses the globally installed playwright (falls back to `npm root -g`).
// Exit code 0 = all checks passed; 1 = a check failed (details on stdout).

import { createRequire } from 'module';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  const globalRoot = execSync('npm root -g').toString().trim();
  ({ chromium } = require(path.join(globalRoot, 'playwright')));
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };

// Minimal recipes the plan generator needs: one per pool it checks
// (breakfast, lunch, dinner, snack). Shape mirrors ds_recipe_cache entries —
// cuisine/proteinSource are required too: the recipe-card template calls
// .charAt() on them unguarded, and real cloud recipes always have them.
const FIXTURE_RECIPES = [
  { id: 'smoke-bf', name: 'Smoke Test Porridge', mealTypes: ['breakfast'], servings: 2, cuisine: 'british', proteinSource: 'dairy' },
  { id: 'smoke-lu', name: 'Smoke Test Salad', mealTypes: ['lunch'], servings: 2, cuisine: 'british', proteinSource: 'chicken' },
  { id: 'smoke-d1', name: 'Smoke Test Curry', mealTypes: ['dinner'], servings: 4, cuisine: 'indian', proteinSource: 'chicken' },
  { id: 'smoke-d2', name: 'Smoke Test Stir-fry', mealTypes: ['dinner'], servings: 2, cuisine: 'asian', proteinSource: 'beef' },
  { id: 'smoke-sn', name: 'Smoke Test Flapjack', mealTypes: ['snack'], servings: 4, cuisine: 'british', proteinSource: 'dairy' },
];

const TABS = ['plan', 'recipes', 'grocery', 'tracker', 'add'];

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// Tiny static server for the repo root (service worker needs http, not file://)
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const context = await browser.newContext();

// Seed the offline recipe cache before any page script runs
await context.addInitScript((recipes) => {
  localStorage.setItem('ds_recipe_cache', JSON.stringify(recipes));
}, FIXTURE_RECIPES);

const page = await context.newPage();
const pageErrors = [];
const dialogs = [];
page.on('pageerror', e => pageErrors.push(e.message));
page.on('dialog', d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });

try {
  // 1. Boot
  await page.goto(`${base}/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500); // let boot-time scripts settle
  check('boot: page loads without uncaught JS errors',
    pageErrors.length === 0, pageErrors.join(' | '));

  // 2. All five tab containers exist
  const tabCount = await page.evaluate(
    (tabs) => tabs.filter(t => document.getElementById('tab-' + t)).length, TABS);
  check(`tabs: all ${TABS.length} tab containers present`, tabCount === TABS.length,
    `${tabCount}/${TABS.length}`);

  // 3. Tab switching — every nav destination activates
  let switched = 0;
  for (const tab of TABS) {
    const active = await page.evaluate((t) => {
      const btn = [...document.querySelectorAll('nav button')]
        .find(b => (b.getAttribute('onclick') || '').includes(`'${t}'`));
      if (btn) btn.click(); else window.switchTab(t, null);
      return document.getElementById('tab-' + t).classList.contains('active');
    }, tab);
    if (active) switched++;
  }
  check('tabs: switching activates each tab', switched === TABS.length,
    `${switched}/${TABS.length}`);

  // 4. Shuffle produces a plan (no alert = pools were non-empty)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('nav button')]
      .find(b => (b.getAttribute('onclick') || '').includes("'plan'"));
    btn && btn.click();
  });
  const dialogsBefore = dialogs.length;
  await page.click('button.btn-generate');
  await page.waitForTimeout(500);
  const planHtml = await page.evaluate(() =>
    (document.getElementById('planOutput')?.innerHTML || '').trim());
  const planHasFixture = planHtml.includes('Smoke Test');
  check('shuffle: generatePlan renders a plan from seeded recipes',
    planHasFixture && dialogs.length === dialogsBefore,
    dialogs.length > dialogsBefore ? `alert: ${dialogs[dialogs.length - 1]}`
      : (planHasFixture ? '' : 'planOutput has no fixture recipe'));

  // 5. No JS errors triggered by any of the interactions above
  check('interactions: no uncaught JS errors during tab/shuffle flows',
    pageErrors.length === 0, pageErrors.join(' | '));
} catch (e) {
  check('smoke test ran to completion', false, e.message);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
console.log(failed.length === 0
  ? `\nsmoke test: ${results.length}/${results.length} checks passed`
  : `\nsmoke test: ${failed.length} FAILED`);
process.exit(failed.length === 0 ? 0 : 1);

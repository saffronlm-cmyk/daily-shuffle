// Daily Shuffle — CLAUDE.md drift check
//
// Mechanically compares facts CLAUDE.md states against the repo, so the doc
// can't silently rot the way it did before (it once described sw.js as
// cache-first at v23 while the file was network-first at v32).
//
// Checks (mechanical only — the weekly routine + ship-check cover judgement calls):
//   1. Tabs: every id="tab-*" in index.html is named in CLAUDE.md, and every
//      tab-* CLAUDE.md names still exists in index.html.
//   2. scripts/ files: every tracked file in scripts/ is mentioned in
//      scripts/README.md or CLAUDE.md.
//   3. Root files: every tracked .md/.csv/.mjs at the repo root is mentioned
//      in CLAUDE.md.
//   4. canonicalise(): every tracked code file implementing it is named in
//      CLAUDE.md (the "keep in sync" list).
//   5. sw.js passthrough hosts: every url.includes('...') host is named in
//      CLAUDE.md.
//
// Run:  node scripts/claude_md_drift.mjs
// Exit 0 = no drift detected; 1 = drift (details on stdout).

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'scripts/README.md'), 'utf8');
const tracked = execSync('git ls-files', { cwd: ROOT }).toString().trim().split('\n');

const problems = [];
const ok = (msg) => console.log(`✅ ${msg}`);
const bad = (msg) => { problems.push(msg); console.log(`⚠️  ${msg}`); };

// "Mentioned" is a heuristic: exact basename, or (for suffixed names like
// recipe-ingredient-normalisation.final.csv) a long-enough stem CLAUDE.md uses.
const mentioned = (file, text) => {
  const base = path.basename(file);
  const stem = base.split('.')[0];
  return text.includes(base) || (stem.length >= 6 && text.includes(stem));
};

// 1. Tabs — both directions
const appTabs = [...new Set([...html.matchAll(/id="tab-([a-z0-9-]+)"/g)].map(m => m[1]))];
const docTabs = [...new Set([...md.matchAll(/`tab-([a-z0-9-]+)`/g)].map(m => m[1]))];
const tabsMissingFromDoc = appTabs.filter(t => !docTabs.includes(t));
const tabsGoneFromApp = docTabs.filter(t => !appTabs.includes(t));
if (tabsMissingFromDoc.length) bad(`tabs in app but not CLAUDE.md: ${tabsMissingFromDoc.map(t => 'tab-' + t).join(', ')}`);
if (tabsGoneFromApp.length) bad(`tabs in CLAUDE.md but gone from app: ${tabsGoneFromApp.map(t => 'tab-' + t).join(', ')}`);
if (!tabsMissingFromDoc.length && !tabsGoneFromApp.length) ok(`tabs: ${appTabs.length} in app, all documented`);

// 2. scripts/ files
const scriptFiles = tracked.filter(f => f.startsWith('scripts/') && !f.endsWith('README.md'));
const unmentionedScripts = scriptFiles.filter(f => !mentioned(f, readme) && !mentioned(f, md));
if (unmentionedScripts.length) bad(`scripts/ files not mentioned in scripts/README.md or CLAUDE.md: ${unmentionedScripts.join(', ')}`);
else ok(`scripts/: ${scriptFiles.length} files, all documented`);

// 3. Root .md/.csv/.mjs files
const rootFiles = tracked.filter(f => !f.includes('/') && /\.(md|csv|mjs)$/.test(f) && f !== 'CLAUDE.md');
const unmentionedRoot = rootFiles.filter(f => !mentioned(f, md));
if (unmentionedRoot.length) bad(`root files not mentioned in CLAUDE.md: ${unmentionedRoot.join(', ')}`);
else ok(`root files: ${rootFiles.length} data/doc files, all documented`);

// 4. canonicalise() implementations (code files only; docs/logs/this script excluded)
const canonFiles = tracked.filter(f =>
  /\.(html|py|mjs|js)$/.test(f) &&
  !f.startsWith('logs/') && !f.startsWith('legacy/') &&
  f !== 'scripts/claude_md_drift.mjs' &&
  /canonicalise|function canon\s*\(|def canonicalise/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
const unmentionedCanon = canonFiles.filter(f => !mentioned(f, md));
if (unmentionedCanon.length) bad(`files implementing canonicalise() but not in CLAUDE.md's sync list: ${unmentionedCanon.join(', ')}`);
else ok(`canonicalise: ${canonFiles.length} implementations, all listed in CLAUDE.md`);

// 5. sw.js API passthrough hosts
const swHosts = [...sw.matchAll(/url\.includes\('([^']+)'\)/g)].map(m => m[1]);
const unmentionedHosts = swHosts.filter(h => !md.includes(h));
if (unmentionedHosts.length) bad(`sw.js passthrough hosts not in CLAUDE.md: ${unmentionedHosts.join(', ')}`);
else ok(`sw.js: ${swHosts.length} passthrough hosts, all documented`);

console.log(problems.length === 0
  ? '\nclaude-md-drift: no drift detected'
  : `\nclaude-md-drift: ${problems.length} issue(s) — update CLAUDE.md (or scripts/README.md) in this PR, or state why not`);
process.exit(problems.length === 0 ? 0 : 1);

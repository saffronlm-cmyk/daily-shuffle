# Daily Shuffle — Monetization & Rollout Roadmap

**Owner:** Saffron · **Written:** 2026-07-05 · **Horizon:** ~6 months (through ~Dec 2026)
**Status:** Phase 0 not started. See the Status Tracker at the bottom for live state.

This document is the single source of truth for taking Daily Shuffle from a personal
tool to something people pay for. It was designed to be executed one task at a time by
a simpler AI session with no memory of how it was written. Do not re-derive strategy;
execute it, and record evidence.

---

## 0. How to run this plan (instructions for the operating AI)

1. **One task at a time.** Read the Status Tracker, find the first task that is not
   `done`, and work only on that task unless Saffron says otherwise.
2. **A task is done only when every acceptance criterion is met.** "I wrote a draft"
   is not done if the criterion says "posted and received ≥N replies". If a criterion
   can't be met, mark the task `blocked` with a one-line reason and move to the next
   non-dependent task.
3. **Never skip a gate.** Gates A and B are decision points with pre-committed
   thresholds. Do not start any Phase 2 engineering task (especially auth) before
   Gate B is recorded as passed, even if it "seems obvious".
4. **Do not build multi-tenant auth in Phases 0–1. Ever.** The entire point of this
   plan is to get paid evidence before paying that cost.
5. **Update the Status Tracker in this file** (status, date, one-line evidence/link)
   in the same commit as the work, on a `claude/*` branch with a draft PR, per repo
   convention. Doc-only changes need no sw.js cache bump.
6. **Protect production data.** The live app's Supabase project
   (`jsxcctrskkkxgdxfaduo`) holds Saffron's real food log and recipes. No demo,
   pilot, or test may read or write it. Tasks that touch this get explicit criteria.
7. **Scripts are deliverables.** Saffron does outreach only if it's fully scripted.
   Any task involving contacting humans must produce the exact message text /
   call agenda for her to use verbatim.
8. **Escalate to Saffron** (don't decide alone): anything involving money leaving her
   account, any pricing shown publicly, any message sent under her name, legal/privacy
   text, and both gate decisions.
9. **Log sessions** via the `save-conversation` skill as usual.

---

## 1. Ground truth (locked — do not contradict)

- Static PWA, one `index.html`, no build step, no CI. SW cache constant must be bumped
  per shippable app change; installed PWAs need a reload (sometimes two) to update.
- One shared Supabase project, **open anon key, no per-user auth** — every install
  reads/writes the same rows. Fatal for multi-tenant consumer; must be scoped around.
- AI features are **BYOK** (user's own Anthropic key in localStorage, Haiku 4.5,
  direct-from-browser). Zero cost to Saffron today; real friction for normal users.
- Zero outside users, zero revenue, zero validated demand. Audience and pricing are
  open questions this plan is designed to answer, not assume.
- The app's own AI prompts already target a **coeliac (gluten-free) + dairy-free,
  budget-conscious** user. Candidate wedge, not a decision.
- Shelved features that could become paid differentiators: recipe-discovery search,
  supplements/wellness tracker, Mifflin-St Jeor macro calculator. All unbuilt.
- **Saffron's answers (2026-07-05):**
  - Capacity: **5–10 hrs/week** (plan sized to ~2 tasks/week).
  - Success bar: **£100–300/mo side income** within ~6 months.
  - Assets: she **is the target user** (coeliac/DF, in those communities) **and has
    warm intros to dietitians/coaches**.
  - Outreach: **OK if fully scripted** — every human contact needs verbatim scripts.

**Working assumptions (overridable by Saffron, state them if they matter):**
- Primary market is the **UK** (the app's price book and units are UK-based).
- Cash budget ≈ **£0–30/month until first revenue**; free tiers preferred.
- No medical claims, ever ("built by a coeliac, for coeliacs" is fine; "manages
  coeliac disease" is not).

---

## 2. Strategy

**The single most important outcome:** by the end of Phase 1 (~week 10), have **at
least 2 people paying real money for Daily Shuffle, acquired without building
multi-tenant auth**. Everything before that is in service of it; everything after
depends on what those payers teach us. The 6-month north star is £100–300/mo
recurring, which concretely means either **4–10 B2B tenants at ~£25–35/mo** or
**~30–100 consumers at ~£3/mo** — keep both numbers in mind whenever weighing effort.

**The core strategic insight:** the app's biggest weakness — one shared Supabase
project with an open anon key — is fatal for a multi-tenant consumer product but
*nearly irrelevant* for **single-tenant-per-customer deploys**. The app is a static
site with no build step: a new "instance" is a repo fork on free static hosting plus
a fresh Supabase project with the same 5 tables. Each customer (e.g. a dietitian's
practice) gets their own isolated copy — real data isolation, zero auth code. That
means we can **charge money before writing a line of auth**, and only pay the
multi-tenant engineering cost if the evidence says the consumer path is the winner.

**Why B2B-via-dietitians is the favoured (not pre-decided) wedge:**
- The success bar is £100–300/mo. Three to six dietitian/coach tenants gets there;
  the consumer path needs 30–100 paying strangers plus an auth build first.
- Saffron has warm intros to dietitians — the scarcest asset (distribution) exists.
- Single-tenant deploys fit B2B naturally and dodge the auth blocker entirely.
- The GF/DF specialisation is a genuine differentiator for dietitians who see
  coeliac/intolerance clients.

**Why we still test the niche-consumer angle in Phase 0:** Saffron is herself the
target user and lives in those communities; a waitlist test is nearly free; and if
consumer demand is unexpectedly strong it changes Phase 2. The broad-consumer angle
is tested only passively (via the same landing page) — it has the worst
effort-to-evidence ratio and the strongest incumbents, so we don't spend interview
hours on it.

**Sequencing principle:** *evidence → money → engineering.* Phase 0 buys evidence
with hours, not code. Phase 1 converts evidence to money using concierge
single-tenant deploys. Phase 2 spends engineering only on the branch that money
validated. Phase 3 makes acquisition repeatable.

---

## 3. Decision gates (pre-committed — evaluate honestly, record in the tracker)

### Gate A — end of Phase 0 (~week 4): pick the wedge
Evaluate each track against its threshold. **If both pass, B2B goes first** (fewer
customers to the success bar, no auth needed). If neither passes, run the "no signal"
step. Record the decision, the counts, and links to evidence in the Status Tracker.

| Track | PASS threshold |
|---|---|
| **B2B (dietitians/coaches)** | ≥1 practitioner verbally agrees to a **paid** pilot (any price ≥£15/mo or ≥£40 one-off), OR ≥2 say "yes, if you add X" where X is <2 weeks of work |
| **Niche consumer (GF/DF budget)** | ≥25 waitlist signups from GF/DF-identifying people AND ≥5 of them reply to the follow-up saying they'd pay ≥£3/mo (or ≥£20 one-off) |
| **No signal** | Neither threshold met after all Phase 0 tasks done well → do NOT quietly keep building. Present Saffron three options: (a) one more 3-week cycle with a changed pitch (say what changes), (b) reposition (e.g. FODMAP, allergy-parents), (c) park it as a personal tool + portfolio piece. |

### Gate B — end of Phase 1 (~week 10): productise or recycle
- **PASS:** ≥£50/mo committed recurring revenue OR ≥2 customers who have actually
  paid (not promised). → proceed to the matching Phase 2 branch.
- **FAIL:** pilots stalled or refunded → run one structured retro (what did they say
  no to: price, product, or trust?), feed it back into a single repeat of the
  relevant Phase 0/1 tasks, or recommend parking. Never silently restart Phase 1.

---

## 4. Phase 0 — Evidence before engineering (Weeks 1–4)

**Goal:** decide the wedge (Gate A) using real conversations and signups, with zero
product engineering beyond a safe demo.
**Effort:** 8 tasks ≈ 2/week at 5–10 hrs/week.

---

**TASK 0.1 — Wedge hypotheses & thresholds on paper** *(~2 hrs)*
Write `research/wedges.md` with, for each of the three wedges (niche GF/DF consumer,
broad consumer, B2B dietitian white-label): target person (one sentence), their
current painful workaround, the one-line offer, a price hypothesis, and the Gate A
threshold copied from this file.
- ✅ All three wedges have all five fields filled with specifics (names of competitor
  products as the "current workaround", actual £ numbers), no placeholders.
- ✅ Thresholds match Gate A verbatim (no quiet weakening).
- ✅ Committed to the repo under `research/`.

**TASK 0.2 — Safe demo instance** *(~4 hrs, depends: none)*
Stand up a public demo of the current app that cannot touch production data. Approach:
new branch or fork deployed to free static hosting (GitHub Pages), with the Supabase
constants (`RECIPE_LIB_URL`/`RECIPE_LIB_KEY`, tracker creds) pointed at a **throwaway
demo Supabase project** (or cloud sync fully disabled and the app running purely on a
seeded `ds_recipe_cache` in localStorage — whichever is less work; the smoke test
already proves the app boots fine from cache alone). Seed ~15–20 GF/DF recipes.
Hide or clearly label the BYOK AI features ("demo: AI features need your own key").
- ✅ Demo URL loads in an incognito window; shuffle, grocery list, and tabs work.
- ✅ Browser network tab shows **zero requests to `jsxcctrskkkxgdxfaduo`** during a
  full click-through. This is the criterion that protects Saffron's real data.
- ✅ No personal data visible (her food log, custom recipes, personal notes).
- ✅ Ran `ship-check` on any `index.html` changes made for the demo build (on the
  demo branch — do not merge demo constants to `main`).
- ✅ Demo URL recorded in the Status Tracker.

**TASK 0.3 — Demo video + screenshot pack** *(~2 hrs, depends: 0.2)*
A 60–90 second screen recording of the demo: shuffle a week → see the grocery list
with costs → log a meal in the tracker. Plus 4–6 clean screenshots.
- ✅ Video under 90s, no dead air, opens on the shuffle (the "wow" moment), captions
  or voiceover naming the GF/DF angle in the first 10 seconds.
- ✅ Uploaded somewhere linkable (unlisted YouTube is fine); link in the tracker.
- ✅ Screenshots stored in `research/assets/`.

**TASK 0.4 — Landing page + waitlist with a price question** *(~4 hrs, depends: 0.3)*
One-page site (Carrd free tier or a GitHub Pages page — keep it £0) headlined for the
GF/DF wedge (e.g. "Gluten-free, dairy-free meal plans that respect your food budget"),
embedding the video, with a signup form (Tally free tier) that captures: email,
segment ("I'm GF/DF myself" / "I'm a dietitian/nutritionist/coach" / "neither"), and
a price-sensitivity question ("What would this be worth to you monthly? £0 / £2–3 /
£4–6 / £7+"). The segment question is how one page tests all three wedges at once.
- ✅ Page live at a shareable URL; form tested end-to-end with a dummy signup that
  arrives in the response sheet.
- ✅ Copy makes no medical claims; footer says who built it and why (founder story,
  2 sentences).
- ✅ Saffron has approved the copy before it's shared anywhere (escalation rule 8).
- ✅ URL + response-sheet link in the tracker.

**TASK 0.5 — 5 GF/DF problem interviews (fully scripted)** *(~5 hrs, depends: 0.1; can overlap 0.2–0.4)*
Deliverables first, then Saffron executes: (a) a recruiting post for the communities
she's already in (Reddit r/Celiac, r/glutenfree, Coeliac UK forum, relevant Facebook
groups — adapted per venue's self-promo rules, this is "asking for research chat",
not selling); (b) a DM script; (c) a 7-question interview script (current planning
method, weekly food spend, hardest part, what they've tried and abandoned, reaction
to demo video, "would you pay, and what number feels fair?", "who else should I talk
to?"); (d) a notes template.
- ✅ All four script artifacts committed under `research/scripts/` before any outreach.
- ✅ 5 interviews completed (chat-based counts; calls not required for this track).
- ✅ Notes for each in `research/interviews/`, template fully filled, with a verbatim
  quote for the biggest pain and a recorded price reaction.

**TASK 0.6 — 3 dietitian/coach conversations (warm intros, fully scripted)** *(~5 hrs, depends: 0.1, 0.3)*
Deliverables: (a) intro-request text Saffron sends to her contacts; (b) the email to
the practitioner (short, video link, one ask: 20 minutes); (c) a 20-minute call
agenda (their client volume, what they currently hand clients for meal planning,
what it costs them, where clients fall down, show the demo, the money question:
"if your clients could use this under your branding, what would that be worth per
month?"); (d) notes template.
- ✅ Scripts committed under `research/scripts/` before outreach.
- ✅ ≥3 conversations completed with practitioners who have real paying clients.
- ✅ Notes capture: client volume, current tooling, stated willingness to pay (a
  number or an explicit no), and their top objection.
- ✅ Each conversation ends with the pilot teaser asked and the answer recorded —
  this is the direct input to Gate A's B2B threshold.

**TASK 0.7 — Competitor & pricing teardown** *(~3 hrs, parallel-safe)*
One page, `research/competitors.md`. Consumer side: Mealime, Plan to Eat, Samsung
Food, eMeals, and any GF-specific planners found. B2B side: That Clean Life, Living
Plate Rx, Meallogix, and whatever dietitians in 0.6 actually name. For each: current
price (verify on their site — do not trust memory), GF/DF handling, budget/cost
features (Daily Shuffle's cost-aware grocery list is rare — confirm), and the gap.
- ✅ ≥8 competitors with verified current pricing (link + date checked).
- ✅ A "so what" paragraph: where Daily Shuffle is genuinely different, and the
  price corridor the market supports for consumer and for B2B.

**TASK 0.8 — Gate A decision memo** *(~2 hrs, depends: all above)*
`research/gate-a.md`: the counts vs. each threshold, links to evidence, the decision
per the gate rules, and the 3 concrete implications for Phase 1 (who the first
customers are, the opening price, the offer wording).
- ✅ Every threshold evaluated with actual numbers; no "vibes".
- ✅ Decision reviewed and confirmed by Saffron (escalation rule 8).
- ✅ Status Tracker updated with the outcome; Phase 1 path (A or B) selected.

---

## 5. Phase 1 — First paying customers, no auth (Weeks 5–10)

**Goal:** Gate B — ≥2 real payers or ≥£50/mo committed, via concierge single-tenant
deploys. Run **Path A (B2B)** unless Gate A said consumer-only, in which case run
**Path B**.

### Path A — B2B concierge pilots (expected path)

**TASK 1.1 — Single-tenant deploy runbook** *(~5 hrs)*
Write `ops/tenant-runbook.md` + do a full dry run by creating a "test tenant".
Contents: fork/branch the repo → new free Supabase project → apply the schema (use
the `recipe-db` skill's schema map to produce a single SQL file for the 5 tables,
committed as `ops/tenant-schema.sql`) → swap the Supabase constants in `index.html`
→ seed the GF/DF recipe set → deploy to free static hosting on a tenant subdomain/
path → per-tenant keep-alive (each free Supabase project pauses after ~1 week idle;
replicate the existing keep-alive workflow into the tenant repo's `main`) → PWA
install instructions for the customer, including the "close and reopen to update,
sometimes twice" reality, written honestly.
- ✅ Runbook executed start-to-finish once; test tenant works in incognito; total
  time recorded (target: under 2 hours by the second run).
- ✅ `ops/tenant-schema.sql` produces all 5 tables on a blank project without edits.
- ✅ Verified-and-recorded: current Supabase free-tier limits (projects per org,
  pause policy). **Known cost cliff to write down:** free tier allows ~2 active
  projects; around tenant #3, expect a Supabase Pro upgrade (~$25/mo) — this is a
  planned cost triggered only by revenue-producing tenants, which is exactly when
  it's affordable. Verify current pricing; don't trust this paragraph's numbers.
- ✅ Test tenant makes zero requests to the production project.

**TASK 1.2 — Per-tenant AI key with a hard cap** *(~2 hrs, depends: 1.1)*
Decision (already made — implement, don't reopen): pilot users do **not** BYOK.
Saffron creates, per tenant, a separate **Workspace** in the Anthropic Console with
a **monthly spend limit of $5** and one API key in it, seeded into that tenant's
deploy the same way her own key is stored today. Exposure analysis to include in the
runbook: the key is visible to that tenant's users in principle; the workspace cap
bounds worst-case abuse at $5/mo; rotation steps if misused. Real cost math: Haiku
4.5 is $1/MTok in, $5/MTok out; a recipe-parse call is ~1.5k in / 500 out ≈ **$0.004**;
a heavy user doing 100 AI actions/month costs ≈ **$0.50**. The cap is 10× headroom.
- ✅ Runbook section written with console click-path, cap verified on a real test
  workspace, rotation procedure included.
- ✅ Cost table above reproduced in the runbook with a "verify pricing at
  platform.claude.com/docs/en/pricing" note.

**TASK 1.3 — Pilot offer + one-page agreement** *(~3 hrs, depends: 0.8)*
`sales/pilot-offer.md`: the offer (e.g. "your own branded meal-planning app for your
GF/DF clients"), pilot terms — 6 weeks, **£40 setup + £20/mo** as the opening
position (adjust from 0.6/0.7 evidence; never open below £15/mo — anchoring low is
unrecoverable), what's included (setup, seeded recipes, email support, one tweak
round), what's not (custom features), data ownership (their tenant's data is theirs;
export on request), cancellation (any time, no refund of setup). Plus a plain-English
one-page agreement covering the same + a no-medical-claims clause + GDPR basics
(Saffron is a data processor for the tenant's client data; keep it simple, it's a
pilot).
- ✅ Saffron approved price and terms.
- ✅ A Stripe account exists and a Payment Link for the setup fee + a subscription
  Payment Link exist and have been test-checked (Stripe test mode).
- ✅ Agreement is one page, readable by a non-lawyer, and stored in `sales/`.

**TASK 1.4 — Close 1–2 pilots** *(1–2 wks elapsed, depends: 1.3; scripted)*
Deliverables: follow-up email to every practitioner from 0.6 who didn't say no
(reference their own words from the notes), an objection-handling crib sheet (price,
"my clients aren't techy", "I already use X"), and the close sequence (send offer →
book 15-min walkthrough → send payment links).
- ✅ Every warm lead contacted with the script; outcomes logged in `sales/pipeline.md`.
- ✅ **Money received** from ≥1 tenant (Stripe payout counts; promises don't).
- ✅ If all leads decline: record each stated reason verbatim and stop — that's Gate
  B input, not a prompt to discount to zero.

**TASK 1.5 — Onboard each tenant** *(~3 hrs per tenant, depends: 1.1, 1.2, 1.4)*
Run the runbook for the paying tenant; 30-minute scripted onboarding call (walkthrough,
install the PWA on their phone together, set expectations on updates); handover sheet
(their URL, how clients install it, how to reach Saffron, what "beta" means).
- ✅ Tenant live within 5 working days of payment.
- ✅ Onboarding call done; handover sheet sent.
- ✅ Tenant's first real client action (a shuffle or a logged meal in *their*
  project's tables) observed within week 1 — if not, that's a red flag to chase, not
  ignore.

**TASK 1.6 — Weekly pilot feedback loop** *(~1 hr/wk ongoing)*
A scripted weekly check-in message per tenant; a `sales/feedback-log.md` capturing
issues tagged `blocker` / `friction` / `wish`. Only `blocker`s get fixed during the
pilot (via normal ship-check flow, cherry-picked to tenant deploys); everything else
queues for Phase 2.
- ✅ Check-in sent every week per tenant, response (or silence) logged.
- ✅ Zero non-blocker engineering during Phase 1 (this criterion exists to protect
  Saffron's 5–10 hours).

**TASK 1.7 — Gate B memo** *(~1 hr, week 10)*
`sales/gate-b.md`: revenue committed, payers count, churn signals, what tenants
actually use (which tabs/tables see writes), decision per Gate B rules.
- ✅ Numbers, links, decision, Saffron sign-off; tracker updated.

### Path B — Consumer founding-member beta (only if Gate A says so)
Same shape, adapted: a 10–15 person closed beta on **one** dedicated beta deploy
(demo-style, localStorage-first, cloud sync off — per-user isolation for free because
data never leaves the device), recruited from the waitlist, charged a **£15
founding-member one-off** (Stripe Payment Link) *before* access — payment is the
evidence. Weekly scripted check-ins; the known cost is that cross-device sync and
"my data in the cloud" are absent, which is precisely the demand signal for the
Phase 2 auth build. Gate B threshold unchanged (≥£50 collected or ≥2... for this
path read: ≥10 paid founding members ≈ £150, or fewer with strong retention).

---

## 6. Phase 2 — Productise the winning path (Weeks 11–16)

**Goal:** turn concierge pilots into a repeatable product on ONE branch. The other
branch is explicitly parked (write that in the tracker).

### Branch A — B2B white-label (if Gate B passed on Path A)
The engineering here is packaging, not auth. Multi-tenant auth stays unbuilt.

- **2A.1 Tenant config block** *(~4 hrs)* — a single `TENANT` constant near the top
  of `index.html` (name, accent colour, logo/emoji, Supabase URL/key, AI key), so a
  tenant deploy is a config diff, not a scatter of edits. Full ship-check; cache bump.
  ✅ Diff between two tenant deploys touches only the config block.
- **2A.2 Provisioning script** *(~5 hrs)* — `scripts/new_tenant.mjs` (Node, stdlib):
  takes a config JSON, produces a ready-to-deploy tenant branch/folder + prints the
  manual steps remaining (Supabase project creation, key creation). Target: fresh
  tenant in <1 hr. ✅ Used for the next real tenant end-to-end; runbook updated.
- **2A.3 Update/maintenance policy** *(~2 hrs)* — how fixes propagate to N tenants
  (a `tenant-base` branch; tenants rebase from it; ship-check once, deploy N times),
  documented + rehearsed on the test tenant. ✅ One fix shipped to all live tenants
  in <30 min using the procedure.
- **2A.4 Price ladder + second-wave sales** *(ongoing)* — raise to the evidence-backed
  price for new tenants (target corridor £25–40/mo), referral ask script for existing
  tenants ("who do you know…", incentive: a free month), pipeline in
  `sales/pipeline.md`. ✅ ≥5 new practitioners pitched; ladder written down.
- **2A.5 Paid-tier differentiators (only on pull)** — resurrect a `legacy/` feature
  (wellness tracker or macro calculator per `legacy/README.md` re-graft checklist)
  **only when ≥2 paying tenants ask for the same thing**; it ships as a
  higher-tier feature (+£10/mo), not free. ✅ Trigger condition recorded before any
  re-graft work starts.

**Math check:** 4 tenants × £30/mo = £120/mo → success bar reached at the low end;
8 × £35 = £280 → high end. Supabase Pro (~$25/mo) is the main cost against it.

### Branch B — Consumer multi-tenant (if Gate B passed on Path B)
This is where the auth cost is finally paid, justified by collected money. Budget
honestly: **~30–50 hours ≈ 4–6 weeks of total capacity** — near-exclusive focus.

- **2B.1 Auth spike** *(~4 hrs)* — Supabase Auth magic-link in a throwaway copy;
  document how session state coexists with the no-build single-file architecture.
  ✅ Working login on a test deploy; write-up of the chosen approach.
- **2B.2 Schema migration** *(~10 hrs)* — `user_id` column + per-user RLS on the
  user-data tables (`food_log`, `day_meta`, `saved_meals`, custom recipes;
  `recipes`/`staple_products` stay shared-read). Non-destructive, reviewed via the
  `recipe-db` skill conventions; Saffron's data migrated to her own account.
  ✅ Two test accounts cannot see each other's rows (tested via REST with anon key).
- **2B.3 App plumbing** *(~15 hrs)* — login UI, authed fetch helpers (every write
  still checks `res.ok` + ⚠ toast, per repo rule), migration path from local
  `ds_*` data. Ship-check per change. ✅ Beta users on one shared deploy, each seeing
  only their data.
- **2B.4 Hosted AI key via proxy** *(~8 hrs)* — Supabase Edge Function that holds
  Saffron's Anthropic key server-side, requires an authed user, enforces a per-user
  daily call cap, and forwards to the Messages API. Free tier stays BYOK; paid tier
  gets the proxy. (sw.js note: add the functions host to the never-cache passthrough
  list and update CLAUDE.md, per drift rules.) ✅ Key absent from client code; cap
  demonstrated by hitting it.
- **2B.5 Billing** *(~3 hrs)* — Stripe Payment Links + a manual weekly entitlement
  check (a `paid_users` table) — no webhook engineering until >20 payers.
  ✅ A real payment results in a working paid account within 48 h.

---

## 7. Phase 3 — Repeatable acquisition & steady state (Months 4–6)

**Goal:** the winning branch grows without heroics, and the numbers are watched.

- **3.1 One acquisition channel, done properly** — B2B: monthly outreach batch
  (10 practitioners, scripted) + referral loop. Consumer: one genuinely useful
  GF/DF-budget artifact per month posted where Saffron already has standing
  (e.g. "a coeliac week of meals under £25, with the actual price book"), each
  linking the landing page. ✅ criterion: channel executed ≥2 consecutive months;
  cost per signup/lead known.
- **3.2 Monthly numbers ritual** *(30 min/mo, AI-driven)* — MRR, payers, churn,
  Supabase + Anthropic costs, hours spent; appended to `sales/metrics.md`; flag if
  trajectory misses £100/mo by month 5. ✅ Three consecutive monthly entries exist.
- **3.3 Minimal legal/privacy hardening** — privacy policy + terms page on the
  landing site (template-based, plain English), GDPR data-export/delete procedure
  written into the runbook. Escalate to a human professional only if a tenant with
  >50 clients or any complaint appears. ✅ Pages live; procedure tested once.
- **3.4 Price review at month 5** — against realised willingness-to-pay; grandfather
  pilots; new-customer price set for the £300/mo path. ✅ Decision memo + Saffron
  sign-off.
- **3.5 Second-branch decision** — only now, with the first branch at ≥£100/mo, may
  the parked branch (usually consumer/auth) be re-evaluated. ✅ Explicit go/no-go memo.

---

## 8. Monetization model comparison (decided per-wedge at Gate A/B, not before)

| Model | Fit for B2B wedge | Fit for niche consumer | Verdict |
|---|---|---|---|
| **Flat subscription** | ✅ Per-practice £25–40/mo: predictable, covers Saffron's ops time, matches how practitioners buy tools (they resell value to clients) | ✅ £3–4/mo or £25–30/yr — but only viable *after* the auth build; annual reduces churn admin | **Default for both wedges** |
| **One-time purchase** | ❌ Misprices ongoing hosting/support; no reason to keep tenants updated | ⚠️ Viable **only** for the localStorage-only, BYOK flavour (no server cost to Saffron): £15–25 founding/lifetime. Good for Phase 1 Path B evidence; weak long-term | Use as the Phase 1 consumer instrument, not the end state |
| **Usage-based / AI credits** | ❌ Practitioners hate unpredictable bills | ❌ The metered thing (AI calls) costs ~$0.004 a call — metering pennies adds friction and engineering with no upside | **Rejected** — record here so the day-to-day AI doesn't reopen it |

**Freemium boundary (when relevant, Phase 2B+):** free = local-only planning +
BYOK AI; paid = cloud sync across devices + hosted AI + (later) the resurrected
legacy features. The free tier is the current app, which costs Saffron nothing — a
rare clean freemium line; don't blur it.

---

## 9. AI cost model — BYOK vs hosted vs hybrid (the real numbers)

Model in use: `claude-haiku-4-5` at **$1 / MTok input, $5 / MTok output** (verify at
platform.claude.com/docs/en/pricing before quoting externally).

| Feature call | ~tokens in/out | ~cost |
|---|---|---|
| Recipe quick-add parse | 1.5k / 500 | $0.004 |
| Pantry item parse | 300 / 100 | $0.001 |
| Bulk staple paste | 4k / 2k | $0.014 |
| Tracker AI quick-add | 500 / 200 | $0.0015 |

A *heavy* user (100 AI actions/month) ≈ **$0.50/mo**. 100 such users ≈ $50/mo —
against £300/mo revenue that's fine. **Cost is not the blocker and never was.**

The real constraint is architectural: a static page cannot hold a secret, so "hosted
key" requires a server proxy, and a proxy without auth is an open faucet. Hence the
staged policy (already decided — the operating AI should implement, not re-debate):

1. **Now / Phase 0:** BYOK stays; demo hides AI features.
2. **Phase 1 (single-tenant pilots):** per-tenant Anthropic workspace key with a **$5
   hard monthly cap** baked into the deploy (Task 1.2). Exposure is bounded and
   tenant-local; UX is zero-friction for non-technical clients.
3. **Phase 2B (consumer, only if that branch wins):** Supabase Edge Function proxy,
   authed users, per-user daily caps (Task 2B.4).
4. **End state:** hybrid — free tier BYOK, paid tier hosted.

---

## 10. Inputs Saffron needs to have ready

| Input | Needed by | Notes |
|---|---|---|
| Anthropic Console access (workspaces + spend limits) | Task 1.2 | She already has an account (own key in app) |
| Stripe account (individual/sole-trader is fine) | Task 1.3 | Payment Links only; no code |
| Carrd (free) or GitHub Pages for landing page; Tally (free) for forms | Task 0.4 | £0 |
| Throwaway Supabase project for the demo | Task 0.2 | Free tier |
| List of dietitian/coach contacts + who intros whom | Task 0.6 | The single highest-leverage asset she has |
| 2-sentence founder story (her coeliac/DF reality) | Tasks 0.3/0.4 | Authenticity is the marketing |
| Decision: real name or brand name publicly | Task 0.4 | Either works; pick once |

---

## 11. Risks & bottlenecks (with the honest mitigations)

1. **Solo capacity (the #1 risk).** 5–10 hrs/wk disappears fast. Mitigations baked
   in: WIP limit of one task, Phase 1 bans non-blocker engineering, phases sized to
   2 tasks/week, and the weekly rhythm below. If two consecutive weeks produce zero
   task progress, the operating AI should say so plainly and propose cutting scope,
   not add cheerleading.
2. **Demo/pilot leaking into production data.** Open anon key means one wrong constant
   writes to Saffron's real food log. Mitigation: explicit network-tab criteria in
   0.2 and 1.1; never merge tenant/demo constants to `main`.
3. **Per-tenant key abuse.** Bounded to $5/tenant/mo by workspace caps; rotation
   documented. Accepted residual risk for pilot scale.
4. **Supabase free-tier cliffs.** Projects pause when idle (keep-alive per tenant)
   and free projects per org are limited (~2) → Pro upgrade ~$25/mo around tenant #3.
   Planned cost, revenue-triggered. Verify current limits at Task 1.1.
5. **PWA update friction.** Customers will report "the fix isn't there" because the
   installed app needs a reopen (sometimes twice). Mitigation: it's in the onboarding
   handover sheet in writing; sw.js is already network-first-for-HTML which makes
   this a reopen problem, not a reinstall problem.
6. **No CI + customers.** A broken ship now breaks paying tenants. Mitigation:
   `ship-check` (parse check + headless smoke test) is mandatory before any deploy
   to any tenant; the 2A.3 propagation procedure runs it once per fix.
7. **Medical-adjacent marketing.** Coeliac is a diagnosis. Never claim treatment or
   management; the app plans meals. Practitioner tenants carry their own professional
   responsibility — the agreement says so.
8. **GDPR / other people's data.** Single-tenant isolation is a genuinely good story
   (each practice's data in its own project). Keep the promise: export/delete on
   request (3.3), no cross-tenant analytics.
9. **Motivation cliff after a Gate A "no signal".** The gate's three-option structure
   exists so a weak result produces a decision, not a slow fade.
10. **API cost exposure moving off BYOK.** See §9 — bounded by caps at every stage;
    the unbounded configuration (hosted key, no auth, no cap) is forbidden by design.

---

## 12. Weekly rhythm (fits inside 5–10 hrs)

- **Monday (20 min, with the AI):** paste the driver prompt below. Output: the ONE
  main task this week + the standing outreach follow-ups.
- **Deep block (2.5–4 hrs, her best evening/weekend slot):** the main task.
- **Light block (1–2 hrs, midweek):** sends, follow-ups, replies — the scripted
  human stuff only she can do.
- **Friday (15 min, with the AI):** update tracker + metrics; log the session
  (`save-conversation`); decide nothing on Fridays.

**The literal Monday driver prompt (paste verbatim to the day-to-day AI):**

> Read MONETIZATION.md in the daily-shuffle repo, especially §0 (operating rules)
> and the Status Tracker. Tell me: (1) the current phase and the single task I
> should work on this week, with its acceptance criteria; (2) any scripted
> outreach/follow-ups due this week, with the exact text ready to send; (3) whether
> any gate is due, and if so, the evidence collected vs. thresholds; (4) anything
> blocked and what would unblock it. Then prepare whatever artifacts the task needs
> from you. Do not start any other task. Do not build auth. Do not reopen decisions
> marked as made.

---

## 13. Status Tracker (the operating AI updates this — nothing else edits state)

| Task | Status | Date | Evidence / link |
|---|---|---|---|
| 0.1 Wedge hypotheses | todo | | |
| 0.2 Safe demo instance | todo | | |
| 0.3 Demo video + screenshots | todo | | |
| 0.4 Landing page + waitlist | todo | | |
| 0.5 GF/DF interviews ×5 | todo | | |
| 0.6 Dietitian conversations ×3 | todo | | |
| 0.7 Competitor teardown | todo | | |
| 0.8 **GATE A memo** | todo | | |
| 1.1 Tenant runbook + test tenant | todo | | |
| 1.2 Per-tenant capped AI key | todo | | |
| 1.3 Pilot offer + agreement + Stripe | todo | | |
| 1.4 Close 1–2 pilots | todo | | |
| 1.5 Onboard tenants | todo | | |
| 1.6 Weekly feedback loop | todo | | |
| 1.7 **GATE B memo** | todo | | |
| Phase 2 branch selected | — | | (A = B2B white-label / B = consumer auth) |
| 2.x tasks | — | | (activate after Gate B) |
| 3.x tasks | — | | (activate in month 4) |

**Statuses:** `todo` / `in-progress` / `blocked: <reason>` / `done` / `skipped: <who decided>`.

**Decisions already made (do not reopen without Saffron explicitly asking):**
usage-based pricing rejected (§8); pilots use capped per-tenant keys, not BYOK (§9);
auth is gated behind Gate B (§0.4); B2B goes first if both Gate A tracks pass (§3).

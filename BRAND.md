# Daily Shuffle — Brand Guidelines

A buildable token system + component spec for Daily Shuffle. Two color zones drawn from
**one palette file**: a calm **functional layer** (everyday, number-dense screens) and a
richer **editorial layer** (splash, onboarding, recap, cross-promo). Typography and
photography carry the mood across both — that connective thread holds regardless of which
zone a screen sits in.

> **The bridge, stated once and referenced throughout:** one shared cream (`#E0D6B8`)
> underlies both layers, and oxblood earns exactly two small functional jobs
> (heart-fill, streak). Every color decision below is traceable to either the functional
> base or the editorial layer.

---

## 1. Palette

### 1a. Functional layer (calm base)

Warm cream background, taupe-brown accent, deep espresso text. Kept calm on purpose:
saturated backgrounds fight legibility on number-dense screens and compete with the
warm-toned food photography (tomatoes, eggs, salmon already read red/orange).

| Token | Hex | Role |
|---|---|---|
| `--fn-bg` | `#E0D6B8` | App background cream — **shared root swatch** (see bridge) |
| `--fn-surface` | `#EDE6D2` | Card / raised surface (one step lighter than bg) |
| `--fn-accent` | `#8A7A66` | Taupe-brown — default-theme accent |
| `--fn-text` | `#3B2E28` | Deep espresso — primary text |
| `--fn-text-muted` | `#6B5D53` | Secondary / label text |
| `--fn-border` | `#D2C6A8` | Hairline dividers |
| `--cta` | `#1C1815` | Near-black — primary button pill (both zones) |
| `--cta-text` | `#F3ECD8` | Text on the near-black pill |

**Alt themes — accent-only swap, neutral base unchanged:**

| Theme | `--fn-accent` override | Register |
|---|---|---|
| default | `#8A7A66` | Taupe-brown |
| cafe | `#9C7E86` | Dusty mauve |
| coastal | `#5A6B7E` | Slate blue / navy |

Only `--fn-accent` changes per theme. `--fn-bg`, `--fn-surface`, `--fn-text`,
`--fn-border`, and the CTA pill stay fixed — that shared neutral base is what keeps the
three themes reading as one app.

### 1b. Editorial layer (richer register)

Deliberately higher-contrast than the functional layer — meant to feel different, the way
a book cover feels different from its interior pages. Oxblood + shared cream + optional
gold.

| Token | Hex | Role |
|---|---|---|
| `--ed-cream` | `#E0D6B8` | **Identical to `--fn-bg`** — the bridge swatch, one file |
| `--ed-oxblood-deep` | `#59171B` | **Large editorial surfaces** — splash, onboarding, recap backgrounds. The deeper, quieter tone avoids visual fatigue over a big area |
| `--ed-oxblood-bright` | `#800000` | **Small functional jobs** — heart-fill, streak. Brighter/more saturated so it reads clearly at icon size, where `#59171B` can look muddy |
| `--ed-gold` | `#B8842C` | Mustard/gold accent (kickers, rules, small marks) |
| `--ed-text` | `#3B2E28` | Same espresso as `--fn-text` — carries across zones |

> **Oxblood split — the deliberate call.** The two oxbloods are not "primary vs.
> alternate." They are **size-matched**: bright `#800000` is reserved for tiny elements
> that must resolve at a glance (a heart icon, a streak marker); deep `#59171B` is
> reserved for large fills where a brighter red would fatigue the eye. Never swap them —
> using deep oxblood at icon size reads muddy, using bright oxblood on a full splash reads
> loud.

### 1c. The bridge (non-negotiable — what makes this one brand, not two)

| Rule | Concrete decision |
|---|---|
| **1. Shared cream** | `--fn-bg` **===** `--ed-cream` = `#E0D6B8`. Single source token; both layers reference the same swatch, provably from one file. |
| **2. Oxblood's functional jobs** | Exactly two, both low-frequency + positive: **(a)** favourited-recipe heart-fill state, **(b)** streak/milestone moments. Both use bright `#800000` (icon-scale). Nothing else in the functional layer is oxblood. |
| **Oxblood explicitly NOT used for** | **Active tab indicators** (too high-frequency — would make oxblood the everyday color instead of the special one) and **"over macro goal" warnings** (coding "over goal" in a corrective red moralizes food intake rather than neutrally tracking it — avoided on principle). |
| **3. Typography + photography** | The strongest connective thread — same Inter/Fraunces pairing and same warm-moody photo direction on every screen, editorial or functional. |

---

## 2. Typography

Evidenced across every reference image, independent of palette: Inter for chrome/data, a
thin quiet display serif for editorial headlines, tracked-out caps for kickers.

| Token | Typeface | Why |
|---|---|---|
| `--font-ui` | **Inter** | Daily Shuffle's existing face. Nav, labels, buttons, macro numbers. Unchanged. |
| `--font-display` | **Fraunces** (light/thin, Soft optical) | Chosen for a mobile PWA specifically: its optical-size axis is built for the small-to-display range, so it holds up where Cormorant turns fragile below ~24px on a phone. Variable font = one file covers the whole display range. Keeps the soft/warm quality without tipping into "generic serif" the way Spectral risks. |
| `--font-kicker` | Inter, `0.14em` tracking, uppercase | Small tracked-out all-caps ("SUMMER · BREAKFAST" style) for kickers, nav items, section labels. No extra font. |

### Type scale

| Token | Size / weight / face | Used on |
|---|---|---|
| `--t-display-xl` | 40 / 300 / Fraunces | Splash, onboarding, empty-state & weekly-recap headlines |
| `--t-display-l` | 28 / 300 / Fraunces | Recipe-detail title, editorial section headers |
| `--t-kicker` | 12 / 600 / Inter caps, `0.14em` | Kickers, nav labels, section labels |
| `--t-body` | 16 / 400 / Inter | Body copy, descriptions |
| `--t-data-xl` | 32 / 600 / Inter | Macro numbers, large % readouts |
| `--t-label` | 13 / 500 / Inter | Card labels, chips, catalogue rows |
| `--t-archive` | 14 / 300 / Fraunces | The archival numbering marks (§6) |

---

## 3. Shape & spacing

| Token | Value | Notes |
|---|---|---|
| `--radius-card` | `20px` | Soft rounded cards throughout |
| `--radius-sm` | `12px` | Inputs, small tiles, thumbnails |
| `--radius-pill` | `999px` | CTAs, filter chips, tab bar |
| `--border-hairline` | `1px solid var(--fn-border)` | Dividers, catalogue rows |
| `--glass-blur` | `backdrop-filter: blur(16px)` | + 60% cream (functional) or oxblood (editorial) tint |
| `--glass-tint-fn` | `rgba(224,214,184,0.6)` | Functional glass fill |
| `--glass-tint-ed` | `rgba(89,23,27,0.55)` | Editorial glass fill |
| `--shadow-card` | `0 8px 24px rgba(59,46,40,0.12)` | Near-3D, dimensional lift — not flat |

**Spacing scale (8px base):** `4 · 8 · 12 · 16 · 24 · 32 · 48`. Editorial and
content-heavy screens (recipe detail, meal-plan calendar, food diary) lean on `24 / 32 /
48` for generous, Kinfolk-style whitespace and an asymmetric magazine grid rather than a
rigid uniform one.

**Glass treatment (cross-palette).** Glass-blur cards keep the **photo contained, not
blurred across the whole card** — a near-3D, dimensional, realistic quality, not flat.
Confirmed to work in both the taupe/calm register and the oxblood register, so it is a
style choice, not zone-specific.

---

## 4. Component specs

Each covers layout behavior, active/inactive states, and where glass-blur vs. flat
applies. **CTA convention holds everywhere:** primary buttons are near-black pills
(`--cta`); the accent color (taupe / mauve / slate / oxblood by zone) lives in toggles,
tags, and progress/status states, never as a primary-button fill.

### 4.1 Recipe card grid
- **Layout:** asymmetric magazine grid (varied card sizes), not a uniform grid. Contained-photo glass card; recipe archive number (`No. 001`, §6) set top-corner over the glass.
- **States:** favourited → heart fills bright oxblood `#800000`; unfavourited → hairline outline heart.
- **Treatment:** **glass** card, contained photo, `--shadow-card` lift.

### 4.2 Recipe detail
- **Layout:** full-bleed hero photo → circular glass icon buttons floating over it (back / favourite / more) → card overlay below with title, time, short description, price / cals → black pill CTA.
- **States:** favourite active → bright oxblood heart-fill; inactive → outline.
- **Treatment:** floating icon buttons **glass** (`--glass-tint-fn`); overlay content card flat `--fn-surface`.

### 4.3 Meal-plan calendar *(content-heavy → editorial treatment)*
- **Layout:** asymmetric/magazine treatment — days as varied-size cells with generous whitespace, not a rigid 7×N grid.
- **States:** selected day → `--fn-accent` ring; today → gold hairline. **Not** oxblood.
- **Treatment:** flat surfaces; photography where a day has a planned meal.

### 4.4 Grocery list
- **Layout:** rounded search bar → horizontal category **image** cards → pill ingredient chips → catalogue list rows (thumbnail + name + price).
- **States:** checked chip → `--fn-accent` fill; unchecked → hairline outline.
- **Treatment:** category image cards **glass** (contained photo); catalogue rows flat with hairline dividers.

### 4.5 Macro tracker
- **Layout:** equal-width cells side by side — nutrient name + large % + label.
- **States:** at/under goal and **over goal both render neutral** (`--fn-accent` ring, `--fn-text` number) — over-goal is **never** oxblood or corrective red (bridge rule 2).
- **Treatment:** flat cards.

### 4.6 Nutrition dashboard
- **Layout:** stat cards with progress rings and mini line graphs.
- **States:** ring fill → `--fn-accent`; a **milestone hit** → brief bright-oxblood pulse on the ring (oxblood's streak/milestone job).
- **Treatment:** flat cards, `--shadow-card` lift.

### 4.7 Food diary *(content-heavy → editorial treatment)*
- **Layout:** editorial/asymmetric, whitespace-heavy; each entry carries a quiet archive counter (`Fig. 01`, §6).
- **States:** entries flat rows; long-press/edit → `--fn-accent`.
- **Treatment:** flat; photography optional per logged meal.

### 4.8 Filter chips
- **Layout:** `rounded-full` pills, used for both categories and active tags.
- **States:** active → `--fn-accent` fill, `--cta-text`-style light label; inactive → hairline outline on cream.
- **Treatment:** flat.

### 4.9 Bottom-sheet filter
- **Layout:** rounded-top sheet, grouped chip rows, black pill "Apply" CTA at the foot.
- **States:** selected chips as 4.8 active.
- **Treatment:** flat sheet over a **glass** scrim (`--glass-tint-fn`).

### 4.10 Tab bar
- **Layout:** solid dark pill; optional raised circular FAB at center.
- **States:** active tab → cream dot / cream icon on dark; inactive → muted. **Never oxblood** (too high-frequency — bridge rule 2).
- **Treatment:** flat solid pill (`--cta`), `--shadow-card` lift.

---

## 5. Photography direction

Real photography (confirmed), **not** illustration. Warm, slightly moody editorial
lighting — the register of the reference images, not bright-airy food-blog style. Contained
within glass cards (not blurred across them). This direction is one of the two cross-zone
connective threads (§1c rule 3), so it holds on functional screens too, not just editorial
ones.

---

## 6. Signature element — archival numbering

**Rationale.** An "archive entry" numbering convention (Fig. 01, No. 69,
page-number-as-design-element) appeared consistently enough across the editorial references
to be a genre convention worth adopting deliberately, rather than a generic app pattern
bolted on. Per the frontend-design principle of spending your boldness in one place, this
is Daily Shuffle's **one deliberate risk** — native to the editorial register and carried,
in the display serif, even onto functional screens so the motif stitches the two zones
together. Three markers, visually related (all Fraunces, `--t-archive`) but formatted so
they are never ambiguous with one another.

| Surface | Format | Notes |
|---|---|---|
| Recipe library / recipe detail | `No. 001` | Zero-padded 3-digit, **stable per recipe** — a permanent catalogue ID. Set in Fraunces over the card glass. |
| Food diary entry | `Fig. 01` | Sequential **within a day** — a quiet per-entry counter, resets each day. |
| Streak / milestone | `Day 14` | Its **own** variant, same Fraunces treatment, bright-oxblood on milestone moments. |

> **Why streak is `Day 14`, not `No. 14`.** `No.` is the recipe catalogue format. A streak
> shown as `No. 14` sits in the identical format and a reader could momentarily wonder
> whether it means "recipe #14" or "14-day streak." Giving streak its own `Day 14` label
> keeps all three archival markers visually related (one serif treatment) but removes the
> collision — the motif reads as considered, not as one token copy-pasted everywhere.

---

## 7. Open questions

Stated explicitly rather than silently assumed. Working assumptions are what the current
spec builds against; revisit before locking.

| # | Question | Working assumption |
|---|---|---|
| 1 | **Icon style** — outline vs. filled | **Outline (stroke) icons**, filled only for the active/selected state (e.g. the favourite heart). Matches the thin editorial line quality of Fraunces. |
| 2 | **Dark mode** | **Deferred.** The functional cream base has no defined dark counterpart yet; inventing one now risks breaking the shared-cream bridge. Treat as future work, not a silent default. |
| 3 | **Photography sourcing/production** | Direction is locked (§5); the pipeline (shoot vs. license vs. AI-assisted) is open. Not a token — flagged so it isn't assumed solved. |
| 4 | **Gold accent scope** | `#B8842C` is specced for kickers/rules/small marks only. Whether it earns a larger editorial role (e.g. splash typography) is unconfirmed — held back to keep the editorial register anchored on oxblood + cream. |

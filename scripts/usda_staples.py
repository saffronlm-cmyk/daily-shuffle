#!/usr/bin/env python3
"""
usda_staples.py  --  Look up generic staple-ingredient macros via USDA FDC.

WHAT THIS DOES (in plain English)
----------------------------------
1. Reads scripts/staple_candidates.csv (the ~135 canonical staple ingredient
   names, deduped from the recipe library's ingredient-frequency scan --
   see logs/daily-shuffle_log.md, "Nutrition Estimation Feasibility" entry).
2. For each name, searches USDA FoodData Central for a Foundation / SR Legacy
   match (generic/unbranded reference data -- avoids "right words, wrong
   product form" mismatches, e.g. a spice search returning a branded sauce).
3. Fetches the full nutrient detail for the best match and extracts calories,
   protein, carbs, fat, fibre and sugar per 100g.
4. Writes a review CSV: name, matched_description, fdc_id, data_type,
   calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g (all per 100g),
   match_score, confidence_flag.

This is a BUILD-ONLY script, same pattern as price_pricebook.py: this
sandbox's egress gateway blocks api.nal.usda.gov, so it must be run on your
own machine, not from a Claude Code session. It only ever READS from USDA;
nothing is written back to Supabase by this script -- that happens in a
later, separate step (a Claude Code session applies the reviewed CSV to the
`staple_products` table directly via the Supabase MCP tools).

QUICK START
-----------
  # 1. Get a free key (name + email only): fdc.nal.usda.gov/api-key-signup
  export USDA_FDC_API_KEY=your_key_here

  # 2. See what WOULD be queried, without calling anything:
  python3 scripts/usda_staples.py --dry-run

  # 3. Check the real shape of a result for one name (useful for debugging):
  python3 scripts/usda_staples.py --probe "garlic"

  # 4. Small real run first (first 10 names) to sanity-check:
  python3 scripts/usda_staples.py --sample 10

  # 5. The full run:
  python3 scripts/usda_staples.py

Output: scripts/staple_report.csv (git-ignored, see .gitignore)
No third-party packages required -- standard library only.
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

FDC_BASE = "https://api.nal.usda.gov/fdc/v1"

# Prefer generic/unbranded reference data over branded products -- matches
# the same lesson learned in price_pricebook.py (allowed_units / TERM_OVERRIDES):
# a bare word search on branded data tends to return the wrong product form.
DATA_TYPES = "Foundation,SR Legacy"

# Search-term overrides for names whose literal wording returns the wrong FDC
# entry. Keyed by the exact `name` column in staple_candidates.csv. Two uses:
#   1. steer the search toward the right *form* (whole/raw food, not an oil or
#      candy that shares a word) -- e.g. "avocado" -> "avocados raw", otherwise
#      USDA returns "Oil, avocado" and it scores 1.00 on the shared word;
#   2. a documented PROXY where USDA has no generic entry (marked below) --
#      e.g. UK "cornflour" == US "cornstarch", "coconut sugar" ~ brown sugar.
# NOTE: match_score() now scores against BOTH the original name and the
# override term (whichever is higher), so an override that renames the target
# (cornflour->cornstarch) no longer scores 0 and drop to no_match.
TERM_OVERRIDES = {
    # --- Salt & Seasoning ---
    "salt": "salt table",
    "sea salt": "salt table",
    "garlic granules": "spices garlic powder",       # granules ~= powder
    "chipotle powder": "spices chili powder",         # proxy: no USDA chipotle
    "chilli powder": "spices chili powder",
    "cinnamon": "spices cinnamon ground",             # was matching "Bread, cinnamon"
    # --- Dairy & Eggs ---
    "milk": "milk whole 3.25 milkfat",                # was matching "Crackers, milk"
    "almond milk": "almond milk unsweetened shelf stable",
    "coconut milk": "nuts coconut milk canned",       # recipes mean canned, not carton
    "greek yoghurt": "yogurt greek plain whole milk",
    "yoghurt": "yogurt plain whole milk",             # UK spelling scored 0 before
    "natural yoghurt": "yogurt plain whole milk",
    # --- Sweeteners ---
    "coconut sugar": "sugars brown",                  # proxy: no USDA coconut sugar
    # --- Baking ---
    "cocoa powder": "cocoa dry powder unsweetened",   # was matching sweetened mix
    "vanilla paste": "vanilla extract",               # proxy: no USDA vanilla paste
    "plain flour": "wheat flour white all-purpose enriched",  # was matching pretzels
    "cornflour": "cornstarch",                        # UK cornflour == US cornstarch
    # --- Grains & Starches ---
    "oats": "cereals oats dry",                       # was matching "Oil, oat"
    "rice": "rice white long-grain regular raw",      # was matching "Rice crackers"
    "potato": "potatoes flesh and skin raw",          # was matching "Bread, potato"
    # --- Produce ---
    "avocado": "avocados raw",                        # was matching "Oil, avocado"
    "lemon": "lemons raw",                            # was matching bottled concentrate
    "carrot": "carrots raw",                          # was matching dehydrated (341 kcal!)
    "tomato": "tomatoes red ripe raw",                # was matching "Tomato powder"
    "cherry tomatoes": "tomatoes red ripe raw",
    "sweet potato": "sweet potato raw unprepared",    # was matching "Sweet potato leaves"
    "spring onion": "onions spring scallions raw",
    "red chilli": "peppers hot chili red raw",        # was matching "Cabbage, red"
    "mint": "spearmint fresh",                        # was matching "Candies, AFTER EIGHT"
    "jalapeno": "peppers jalapeno raw",
    "coriander": "coriander cilantro leaves raw",
    # --- Protein ---
    "chicken breast": "chicken broilers breast meat only raw",
    "salmon": "fish salmon atlantic raw",             # was matching "Fish oil, salmon"
    "tuna": "fish tuna light canned in water drained",
    "tofu": "tofu raw firm calcium sulfate",          # was matching "Tofu yogurt"
    "walnuts": "nuts walnuts english",                # was matching "Oil, walnut"
    "roasted peanuts": "peanuts all types dry-roasted with salt",
    "beef mince": "beef ground 15 fat raw",           # was matching "Pie, mince"
    "bean sprouts": "mung beans mature seeds sprouted raw",
    "protein powder": "whey protein powder",
    # --- Nut & Seed Butters ---
    "desiccated coconut": "nuts coconut meat dried desiccated not sweetened",
    # --- Sauces & Vinegars ---
    "rice vinegar": "vinegar distilled",              # proxy: no USDA rice vinegar
    "tamari": "soy sauce made from soy tamari",        # parens-stripped desc scored 0 before
    "gochugaru": "spices pepper red or cayenne",       # proxy: Korean chilli flakes
    "chilli oil": "oil sesame salad or cooking",       # proxy: ~= sesame oil macros
    "dijon mustard": "mustard prepared yellow",        # was matching "Oil, mustard"
    "mayonnaise": "salad dressing mayonnaise regular",
    "pumpkin puree": "pumpkin canned without salt",
    "chicken bone broth": "soup stock chicken home-prepared",
    "miso paste": "miso",
}

# Items USDA Foundation/SR Legacy has no good generic entry for -- expect these
# to come back `no_match` or a poor match; fill them by hand after review.
# (Documented here so the next reviewer doesn't chase them: nutritional yeast,
# coconut aminos, gochujang, chilli crisp, thai red curry paste, rice paper.)

# Energy is reported under different nutrient numbers depending on dataset:
#   208 = "Energy" (KCAL for SR Legacy; can be kJ -- unitName distinguishes)
#   957 = "Energy (Atwater General Factors)"  (KCAL, Foundation foods)
#   958 = "Energy (Atwater Specific Factors)" (KCAL, Foundation foods)
# Foundation foods usually omit 208, so without 957/958 calories come back
# blank. Priority order below (prefer the plain KCAL 208, then Atwater).
ENERGY_NUMBERS = ["208", "957", "958"]

# The other macros -- each has a single stable nutrientNumber.
OTHER_NUTRIENTS = {
    "protein_g": "203",  # Protein
    "fat_g": "204",       # Total lipid (fat)
    "carbs_g": "205",     # Carbohydrate, by difference
    "fibre_g": "291",     # Fiber, total dietary
    "sugar_g": "269",     # Sugars, total including NLEA
}

# Column order for the per-100g macros in the output CSV.
MACRO_KEYS = ["calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g"]

MATCH_THRESHOLD = 0.4   # minimum name-match score (0..1) to trust a result.

REQUEST_DELAY = 0.2     # seconds between calls, polite even at 1000 req/hr.


def canonicalise(name):
    """Kept in sync with index.html / price_pricebook.py -- see CLAUDE.md."""
    s = (name or "").lower()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = s.strip()
    words = [w for w in re.split(r"\s+", s) if w]
    s = " ".join(words)
    s = re.sub(r"ies\b", "y", s)
    s = re.sub(r"([^aeiou])es\b", r"\1e", s)
    s = re.sub(r"([^aeiou])s\b", r"\1", s)
    return s.strip()


def search_term(name):
    return TERM_OVERRIDES.get(name, name)


def match_score(name, term, description):
    """Fraction of the query's words that appear in the FDC description,
    scored against BOTH the original candidate name and the (possibly
    overridden) search term -- take the higher. This is what lets an override
    that renames the target (e.g. cornflour -> cornstarch) still score well:
    the original name shares no words with "Cornstarch", but the term does."""
    d_words = set(canonicalise(description).split())

    def frac(query):
        q_words = set(canonicalise(query).split())
        if not q_words:
            return 0.0
        return sum(1 for w in q_words if w in d_words) / len(q_words)

    return max(frac(name), frac(term))


def api_get(path, params, api_key, timeout=30):
    params = dict(params)
    params["api_key"] = api_key
    url = f"{FDC_BASE}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_food(name, api_key, page_size=5):
    """Search FDC, return the list of candidate foods (possibly empty)."""
    data = api_get("/foods/search", {
        "query": search_term(name),
        "dataType": DATA_TYPES,
        "pageSize": page_size,
    }, api_key)
    return data.get("foods", []) if isinstance(data, dict) else []


def best_match(name, foods):
    """Pick the highest-scoring search result. Returns (food, score) or
    (None, best_score_seen) if nothing clears MATCH_THRESHOLD."""
    term = search_term(name)
    best, best_score = None, 0.0
    for food in foods:
        desc = food.get("description", "")
        score = match_score(name, term, desc)
        if score > best_score:
            best, best_score = food, score
    if best_score < MATCH_THRESHOLD:
        return None, best_score
    return best, best_score


def food_detail(fdc_id, api_key):
    """Fetch full nutrient detail for one food."""
    return api_get(f"/food/{fdc_id}", {}, api_key)


def _iter_nutrient_fields(detail):
    """Yield (nutrientNumber:str, unitName:str upper, amount) for every
    nutrient in a food, handling both FDC response shapes:
      - /food/{fdcId}   nests as foodNutrients[].nutrient.number + .amount
      - /foods/search   flattens to foodNutrients[].nutrientNumber + .value
    (We can't test live against the API from this sandbox -- see the log's
    Environment notes -- so both shapes are handled defensively.)"""
    for fn in detail.get("foodNutrients", []) or []:
        if isinstance(fn.get("nutrient"), dict):
            num = fn["nutrient"].get("number")
            unit = (fn["nutrient"].get("unitName") or "").upper()
            amt = fn.get("amount")
        else:
            num = fn.get("nutrientNumber")
            unit = (fn.get("unitName") or "").upper()
            amt = fn.get("value")
        if num is None or amt is None:
            continue
        yield str(num), unit, amt


def extract_nutrients(detail):
    """Pull the six per-100g macros out of a food. Energy is resolved from
    whichever of nutrient numbers 208/957/958 is present (see ENERGY_NUMBERS),
    keeping only KCAL values (a 208 entry in kJ is skipped)."""
    out = {k: None for k in MACRO_KEYS}
    energy = {}   # nutrientNumber -> kcal amount
    for num, unit, amt in _iter_nutrient_fields(detail):
        if num in ENERGY_NUMBERS:
            # 957/958 are always kcal; 208 may be kJ -- take it only if KCAL
            # (or if no unit is given, assume kcal, the SR Legacy default).
            if num == "208" and unit and unit != "KCAL":
                continue
            energy[num] = amt
        for key, n in OTHER_NUTRIENTS.items():
            if num == n and out[key] is None:
                out[key] = amt
    for n in ENERGY_NUMBERS:      # priority: 208 (kcal) > 957 > 958
        if n in energy:
            out["calories"] = energy[n]
            break
    return out


def confidence_flag(score, nutrients):
    missing = [k for k, v in nutrients.items() if v is None]
    if missing:
        return f"missing:{','.join(missing)}"
    if score < 0.6:
        return "low_confidence_match"
    if score < 0.85:
        return "review_match"
    return "ok"


def load_candidates(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


REPORT_FIELDS = [
    "name", "category", "recipe_count", "source", "matched_description",
    "fdc_id", "data_type", "match_score", "calories", "protein_g",
    "carbs_g", "fat_g", "fibre_g", "sugar_g", "confidence_flag",
]


def _row(cand, **extra):
    """Build an output row from a candidate, defaulting all data columns
    blank. Used for matched, unmatched AND errored candidates so nothing is
    ever silently dropped from the report."""
    row = {
        "name": cand.get("name", ""), "category": cand.get("category", ""),
        "recipe_count": cand.get("recipe_count", ""),
        "source": cand.get("source", ""),
        "matched_description": "", "fdc_id": "", "data_type": "",
        "match_score": "", "confidence_flag": "",
    }
    row.update({k: "" for k in MACRO_KEYS})
    row.update(extra)
    return row


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="infile", default="scripts/staple_candidates.csv")
    ap.add_argument("--out", default="scripts/staple_report.csv")
    ap.add_argument("--sample", type=int, default=0,
                    help="only process the first N candidates (0 = all)")
    ap.add_argument("--page-size", type=int, default=5,
                    help="search results to request per candidate")
    ap.add_argument("--api-key", default=os.environ.get("USDA_FDC_API_KEY", ""))
    ap.add_argument("--dry-run", action="store_true",
                    help="list what would be queried; call nothing")
    ap.add_argument("--probe", metavar="NAME",
                    help="run ONE search + detail lookup for NAME and dump "
                         "the raw match, to sanity-check field shapes")
    args = ap.parse_args()

    candidates = load_candidates(args.infile)
    if args.sample:
        candidates = candidates[:args.sample]

    if args.probe:
        if not args.api_key:
            sys.exit("Set USDA_FDC_API_KEY (or pass --api-key) to probe.")
        try:
            foods = search_food(args.probe, args.api_key, args.page_size)
            print(f"search term: {search_term(args.probe)!r}  ->  "
                  f"{len(foods)} candidate(s)")
            food, score = best_match(args.probe, foods)
            if not food:
                print(f"no match cleared MATCH_THRESHOLD={MATCH_THRESHOLD} "
                      f"(best score seen: {score:.2f})")
                return
            print(f"best match: {food.get('description')!r} "
                  f"(fdcId={food.get('fdcId')}, dataType={food.get('dataType')}, "
                  f"score={score:.2f})")
            detail = food_detail(food["fdcId"], args.api_key)
            print(json.dumps(extract_nutrients(detail), indent=2))
        except urllib.error.HTTPError as e:
            print(f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:400]}")
        return

    print(f"Candidates to look up: {len(candidates)}")
    if args.dry_run:
        print("\n--dry-run: nothing was called. Sample of the query list:")
        for c in candidates[:25]:
            print(f"  - {c['name']!r}  (search: {search_term(c['name'])!r}, "
                  f"category={c['category']!r}, recipe_count={c['recipe_count']})")
        return

    if not args.api_key:
        sys.exit("\nSet USDA_FDC_API_KEY (or pass --api-key) for a real run. "
                 "Use --dry-run to preview without a key.")

    rows = []
    matched = 0
    for i, cand in enumerate(candidates, 1):
        name = cand["name"]
        try:
            foods = search_food(name, args.api_key, args.page_size)
            food, score = best_match(name, foods)
            if not food:
                rows.append(_row(cand, match_score=f"{score:.2f}",
                                 confidence_flag="no_match"))
                print(f"[{i}/{len(candidates)}] {name}: no confident match "
                      f"(best score {score:.2f})")
            else:
                detail = food_detail(food["fdcId"], args.api_key)
                nutrients = extract_nutrients(detail)
                flag = confidence_flag(score, nutrients)
                rows.append(_row(
                    cand,
                    matched_description=food.get("description", ""),
                    fdc_id=food.get("fdcId", ""),
                    data_type=food.get("dataType", ""),
                    match_score=f"{score:.2f}",
                    confidence_flag=flag,
                    **nutrients,
                ))
                matched += 1
                print(f"[{i}/{len(candidates)}] {name}: matched "
                      f"{food.get('description')!r} (score {score:.2f}, {flag})")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:200]
            rows.append(_row(cand, confidence_flag=f"error:HTTP {e.code}"))
            print(f"[{i}/{len(candidates)}] {name}: HTTP {e.code}: {body}")
        except Exception as e:  # noqa: BLE001
            rows.append(_row(cand, confidence_flag=f"error:{type(e).__name__}"))
            print(f"[{i}/{len(candidates)}] {name}: error: {e}")
        time.sleep(REQUEST_DELAY)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=REPORT_FIELDS)
        w.writeheader()
        w.writerows(rows)

    print(f"\nWrote {args.out}")
    print(f"Matched {matched}/{len(candidates)}; "
          f"{len(candidates) - matched} unmatched or errored.")


if __name__ == "__main__":
    main()

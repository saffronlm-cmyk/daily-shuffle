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

# A few search-term fixes for names whose literal candidate wording returns
# the wrong FDC entry. Keyed by the exact `name` column in staple_candidates.csv.
TERM_OVERRIDES = {
    "spring onion": "green onions",
    "coriander": "cilantro",
    "sea salt": "salt, table",
    "salt": "salt, table",
    "yoghurt": "yogurt, plain, whole milk",
    "greek yoghurt": "yogurt, greek, plain",
    "mayonnaise": "mayonnaise, regular",
    "protein powder": "whey protein powder",
    "dark chocolate": "chocolate, dark",
    "cornflour": "cornstarch",
    "jalapeno": "peppers, jalapeno",
}

# Nutrient numbers (USDA FDC's stable "nutrientNumber" field -- not the
# internal nutrientId, which is more likely to shift between datasets).
NUTRIENT_NUMBERS = {
    "calories": "208",   # Energy (KCAL)
    "protein_g": "203",  # Protein
    "fat_g": "204",       # Total lipid (fat)
    "carbs_g": "205",     # Carbohydrate, by difference
    "fibre_g": "291",     # Fiber, total dietary
    "sugar_g": "269",     # Sugars, total including NLEA
}

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


def match_score(name, description):
    """Fraction of the candidate name's words that appear in the FDC
    description. Mirrors price_pricebook.py's match_score()."""
    n_words = set(canonicalise(name).split())
    if not n_words:
        return 0.0
    d_words = set(canonicalise(description).split())
    hits = sum(1 for w in n_words if w in d_words)
    return hits / len(n_words)


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
    (None, 0.0) if nothing clears MATCH_THRESHOLD."""
    best, best_score = None, 0.0
    for food in foods:
        desc = food.get("description", "")
        score = match_score(name, desc)
        if score > best_score:
            best, best_score = food, score
    if best_score < MATCH_THRESHOLD:
        return None, best_score
    return best, best_score


def food_detail(fdc_id, api_key):
    """Fetch full nutrient detail for one food."""
    return api_get(f"/food/{fdc_id}", {}, api_key)


def extract_nutrients(detail):
    """
    Pull calories/protein/carbs/fat/fibre/sugar (per 100g) out of a
    /food/{fdcId} response. FDC nests nutrients as
    foodNutrients[].nutrient.number + foodNutrients[].amount, but the
    /foods/search endpoint (used only as a fallback here) flattens it to
    foodNutrients[].nutrientNumber + foodNutrients[].value -- handle both
    shapes since we can't test live against the real API from this sandbox
    (see logs/daily-shuffle_log.md, Environment notes).
    """
    out = {k: None for k in NUTRIENT_NUMBERS}
    for fn in detail.get("foodNutrients", []) or []:
        number = None
        amount = None
        if isinstance(fn.get("nutrient"), dict):
            number = fn["nutrient"].get("number")
            amount = fn.get("amount")
        if number is None:
            number = fn.get("nutrientNumber")
            amount = fn.get("value") if amount is None else amount
        if number is None or amount is None:
            continue
        for key, num in NUTRIENT_NUMBERS.items():
            if str(number) == num:
                out[key] = amount
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
    no_match = []
    for i, cand in enumerate(candidates, 1):
        name = cand["name"]
        try:
            foods = search_food(name, args.api_key, args.page_size)
            food, score = best_match(name, foods)
            if not food:
                no_match.append(name)
                print(f"[{i}/{len(candidates)}] {name}: no confident match "
                      f"(best score {score:.2f})")
                rows.append({**{k: cand.get(k, "") for k in
                                ("name", "category", "recipe_count", "source")},
                            "matched_description": "", "fdc_id": "",
                            "data_type": "", "match_score": f"{score:.2f}",
                            **{k: "" for k in NUTRIENT_NUMBERS},
                            "confidence_flag": "no_match"})
                time.sleep(REQUEST_DELAY)
                continue
            detail = food_detail(food["fdcId"], args.api_key)
            nutrients = extract_nutrients(detail)
            flag = confidence_flag(score, nutrients)
            rows.append({
                "name": cand.get("name", ""), "category": cand.get("category", ""),
                "recipe_count": cand.get("recipe_count", ""),
                "source": cand.get("source", ""),
                "matched_description": food.get("description", ""),
                "fdc_id": food.get("fdcId", ""),
                "data_type": food.get("dataType", ""),
                "match_score": f"{score:.2f}",
                **nutrients,
                "confidence_flag": flag,
            })
            print(f"[{i}/{len(candidates)}] {name}: matched "
                  f"{food.get('description')!r} (score {score:.2f}, {flag})")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:200]
            print(f"[{i}/{len(candidates)}] {name}: HTTP {e.code}: {body}")
            no_match.append(name)
        except Exception as e:  # noqa: BLE001
            print(f"[{i}/{len(candidates)}] {name}: error: {e}")
            no_match.append(name)
        time.sleep(REQUEST_DELAY)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=REPORT_FIELDS)
        w.writeheader()
        w.writerows(rows)

    print(f"\nWrote {args.out}")
    print(f"Matched {len(rows) - len(no_match)}/{len(candidates)}; "
          f"{len(no_match)} unmatched or errored.")


if __name__ == "__main__":
    main()

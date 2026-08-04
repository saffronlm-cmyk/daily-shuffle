#!/usr/bin/env python3
"""
price_pricebook.py  --  Fill the price columns of pricebook.csv using Apify.

WHAT THIS DOES (in plain English)
---------------------------------
1. Reads your pricebook.csv (the recipe-ingredient list).
2. Throws away rows that are not real groceries (water, "cooking", "juice of
   1 lime", measurement fragments, etc.).
3. Collapses the remaining rows down to the unique PRODUCTS worth pricing
   (those that appear at least --min-occ times across your recipes).
4. For each product it asks three UK supermarket "actors" on Apify
   (Tesco, Sainsbury's, ASDA) "what does <product> cost?".
5. Reads each answer, works out the price-per-kg / per-litre / per-item,
   and keeps the CHEAPEST across the three shops.
6. Writes that price/size/store back into every row that shares the product,
   producing a filled CSV plus a short report of anything it could not match.

It only ever READS from Apify -- it never changes anything on your account
except spending a small pay-per-result fee for the lookups.

QUICK START
-----------
  # 1. See what WOULD be queried + a cost estimate, WITHOUT spending anything:
  python3 scripts/price_pricebook.py --dry-run

  # 2. Check the real shape of an actor's results (one cheap test query):
  export APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxx
  python3 scripts/price_pricebook.py --probe "chicken breast"

  # 3. Do a small real run (first 10 products) to sanity-check:
  python3 scripts/price_pricebook.py --sample 10

  # 4. The full run:
  python3 scripts/price_pricebook.py

Outputs: pricebook.filled.csv  and  price_report.md
No third-party packages required -- standard library only.
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------
# CONFIG  --  the bits you are most likely to tweak live here.
# ---------------------------------------------------------------------------

# The Apify actors we ask. The key is the store label written into the CSV;
# the value is the actor id in Apify's "username~actor-name" form.
#
# NOTE: As of testing, the free illehius Tesco and Sainsbury's actors are
# blocked by those sites' anti-bot (403 / dead proxy) and return nothing.
# Only ASDA gets through, so we run ASDA-only. To add true price comparison
# later, drop in actor ids that route through residential proxies and the
# "cheapest wins" logic below will use them automatically.
ACTORS = {
    "ASDA": "illehius~asda-scraper",
    # "Tesco":       "illehius~tesco-scraper",      # blocked: HTTP 403
    # "Sainsbury's": "illehius~sainsburys-scraper",  # blocked: proxy 403
}

# How we build the INPUT we send to each actor. The illehius actors take a
# list of search words in `queries` and cap results with `maxResultsPerQuery`.
def build_actor_input(term, max_items):
    return {"queries": [term], "maxResultsPerQuery": max_items}

# Which fields we read OUT of each result row, mapped to the illehius actors'
# real output. If you swap actors, edit these to match (use --probe to see).
FIELD = {
    "name":       "name",              # product title
    "price":      "price",             # numeric pack price, e.g. 1.65
    "size":       "unitSize",          # pack size string, e.g. "4 PINT", "650g"
    "unit_price": "unitPrice",         # numeric, price per `measure`
    "measure":    "unitPriceMeasure",  # e.g. "per lt", "per kg", "per each"
    "url":        "productUrl",        # product link (optional)
}

# A few search-term fixes for misspelled / awkward Product names in the CSV.
# Keyed by canonicalise(Product). Makes ambiguous one-word products specific
# so the supermarket search returns the right form.
TERM_OVERRIDES = {
    "cacoa": "cocoa powder",
    "quinia": "quinoa",
    "puree": "tomato puree",
    "vanilla": "vanilla extract",     # bare "vanilla" matched a 2L drink
    "cayenne pepper": "ground cayenne pepper",
    "hazelnut": "hazelnuts",          # matched hazelnut milk otherwise
    "lime": "limes",                  # matched lime juice otherwise
    "lemon": "lemons",
    "clove": "cloves",
    "baking soda": "bicarbonate of soda",
}

# ---------------------------------------------------------------------------
# Category / unit awareness.
#
# The supermarket search for a one-word product often returns a different
# FORM of it (a spice search returns hot sauce; a nut search returns nut
# milk). We use the CSV's Category plus the product name to decide which
# base units (g / ml / each) are acceptable, and reject results whose name
# is clearly the wrong form. If nothing acceptable is left, the product is
# left unpriced (per the chosen "reject -> leave blank" policy).
# ---------------------------------------------------------------------------

# Words in a product/category name that signal it really IS a liquid, so we
# must NOT force grams on it (oil, sauce, extract, etc.).
_LIQUID_WORDS = {
    "oil", "sauce", "vinegar", "milk", "juice", "syrup", "extract", "essence",
    "wine", "aminos", "mirin", "sriracha", "tamari", "ketchup", "stock",
    "broth", "cream", "yoghurt", "yogurt", "drink", "passata", "water",
    "honey", "ponzu", "mayonnaise", "mayo",
}
# Words that signal a dry/solid good -> grams, never ml.
_SOLID_WORDS = {
    "powder", "granule", "granules", "seed", "seeds", "flour", "sugar",
    "rice", "oat", "oats", "flake", "flakes", "nut", "nuts", "spice", "pepper",
    "paprika", "cumin", "cinnamon", "cayenne", "turmeric", "nutmeg", "masala",
    "bicarbonate", "soda", "cocoa", "cacao", "starch", "cornstarch",
}
# Result-name words that mean "wrong form" for a solid/produce product.
_BAD_FORM_WORDS = {
    "sauce", "drink", "juice", "squash", "cordial", "milkshake", "latte",
    "milk", "syrup", "smoothie", "water", "soda",
}
_SOLID_CATS = {"Spices & Herbs", "Nuts & Seeds", "Grains"}
_PRODUCE_CATS = {"Produce", "Vegetables"}

# Per-product hard overrides of allowed units, keyed by canonicalise(Product).
# Use for items the heuristics get wrong (often due to a bad CSV Category).
UNIT_OVERRIDES = {
    "baking soda": {"g"},
    "baking powder": {"g"},
}

def allowed_units(category, product):
    """
    Return (allowed_bases:set, reject_words:set) for a product.
    allowed_bases is which of {'g','ml','each'} a result may use; reject_words
    are words whose presence in a result name disqualifies it.
    """
    key = canonicalise(product)
    if key in UNIT_OVERRIDES:
        return set(UNIT_OVERRIDES[key]), _BAD_FORM_WORDS
    cat = (category or "").strip()
    words = set(key.split()) | set(canonicalise(cat).split())
    is_liquid = bool(words & _LIQUID_WORDS)
    is_solid = bool(set(key.split()) & _SOLID_WORDS)
    if cat == "Beverages":
        return {"ml"}, set()
    if is_liquid:
        return {"g", "ml", "each"}, set()       # genuinely a liquid; allow all
    if cat in _SOLID_CATS or is_solid:
        return {"g"}, _BAD_FORM_WORDS            # dry good -> grams only
    if cat in _PRODUCE_CATS:
        return {"each", "g"}, {"juice", "drink", "squash", "cordial", "sauce"}
    # default: allow all units but still reject obvious drink forms
    return {"g", "ml", "each"}, {"drink", "squash", "cordial", "milkshake",
                                 "smoothie", "latte"}


# Products that are not really single buyable groceries -- skipped entirely.
JUNK_PRODUCTS = {
    "water", "boiling water", "cold water", "reserved pasta water",
    "reserved noodle water", "cooking", "cooking spray", "fresh", "plain",
    "red", "fry", "lightly", "gluten-free", "bone-in", "filling choice",
    "broth choice", "vegetable", "meat", "cooking salt pepper",
}

# Ingredient/Product names matching any of these are measurement fragments,
# not products -- skipped.
JUNK_PATTERNS = [
    re.compile(r"^\s*(juice|zest)\s+of", re.I),
    re.compile(r"^\s*\d"),
    re.compile(r"^\s*[¼½¾]"),          # ¼ ½ ¾
    re.compile(r"\b(tbsp|tsp|teaspoon|tablespoon)\b", re.I),
    re.compile(r"^\s*(enough|drizzle|handful|large handful|serving|second|"
               r"pinch|knob|pound|sheets?\s+of)\b", re.I),
    re.compile(r"^\s*water\b", re.I),
]

MATCH_THRESHOLD = 0.5   # minimum name-match score (0..1) to trust a result.

# ---------------------------------------------------------------------------
# canonicalise()  --  a faithful Python copy of the app's index.html version,
# so the keys/aliases we generate later line up with how the app matches.
# ---------------------------------------------------------------------------
_STOP_ADJ = {
    "fresh", "organic", "large", "small", "medium", "baby", "whole", "finely",
    "roughly", "free-range", "boneless", "skinless", "ripe", "raw", "cooked",
    "dried", "frozen", "chopped", "sliced", "diced", "minced", "ground",
    "grated", "crushed", "peeled", "cubed", "halved", "quartered", "shredded",
    "mashed", "beaten", "softened", "melted", "cooled", "toasted", "roasted",
    "torn", "julienned", "thinly", "thickly", "coarsely", "optional", "approx",
    "approximately", "about", "around", "a", "an", "the", "of", "to", "for",
    "your", "some",
}

def canonicalise(name):
    s = (name or "").lower()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = s.strip()
    words = [w for w in re.split(r"\s+", s) if w and w not in _STOP_ADJ]
    s = " ".join(words)
    s = re.sub(r"ies\b", "y", s)
    s = re.sub(r"([^aeiou])es\b", r"\1e", s)
    s = re.sub(r"([^aeiou])s\b", r"\1", s)
    return s.strip()

# ---------------------------------------------------------------------------
# Parsing helpers for the scraped data.
# ---------------------------------------------------------------------------
def parse_price(raw):
    """'£3.50' / '3.50' / 3.5  ->  3.5 (float) or None."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    m = re.search(r"(\d+(?:\.\d+)?)", str(raw).replace(",", ""))
    return float(m.group(1)) if m else None

def parse_size(raw):
    """
    Turn a pack-size string into (qty_in_base_unit, base_unit).
    base_unit is one of 'g', 'ml', 'each'. Handles kg/l and multipacks
    like '6 x 125g'. Returns (None, None) if it cannot tell.
    """
    if raw is None:
        return (None, None)
    s = str(raw).lower().strip()

    # multipack: "6 x 125g" / "4x125ml"
    m = re.search(r"(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl)\b", s)
    if m:
        count = float(m.group(1)); each = float(m.group(2)); unit = m.group(3)
        qty = count * each
        return _to_base(qty, unit)

    # single weight/volume: "650g" / "1.5kg" / "500ml" / "1 litre" / "4 pint"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl|litre|liter|pint|pt)\b", s)
    if m:
        return _to_base(float(m.group(1)), m.group(2))

    # count: "6 pack" / "pack of 4" / "each" / "single"
    m = re.search(r"(\d+)\s*(?:pack|pk|ct|count|s)?\b", s)
    if "each" in s or "single" in s:
        return (1.0, "each")
    if m and ("pack" in s or "pk" in s or "ct" in s or "count" in s):
        return (float(m.group(1)), "each")
    return (None, None)

def _to_base(qty, unit):
    unit = unit.lower()
    if unit in ("kg",):
        return (qty * 1000.0, "g")
    if unit in ("g",):
        return (qty, "g")
    if unit in ("l", "litre", "liter"):
        return (qty * 1000.0, "ml")
    if unit in ("cl",):
        return (qty * 10.0, "ml")
    if unit in ("ml",):
        return (qty, "ml")
    if unit in ("pint", "pt"):
        return (qty * 568.261, "ml")
    return (None, None)

def parse_measure(measure):
    """
    Turn a unit-price measure like 'per lt' / 'per 100g' / 'per each' into
    (qty_in_base_unit, base_unit). Used as a fallback when the pack-size
    string can't be parsed but the actor gave a per-unit price.
    """
    if not measure:
        return (None, None)
    s = str(measure).lower().replace("per", " ")
    m = re.search(r"(\d+(?:\.\d+)?)?\s*(kg|g|lt|litre|liter|l|ml|cl|pint|pt|"
                  r"each|ea|unit|sheet|wash|roll)\b", s)
    if not m:
        return (None, None)
    qty = float(m.group(1)) if m.group(1) else 1.0
    unit = m.group(2)
    if unit in ("lt",):
        return (qty * 1000.0, "ml")
    if unit in ("each", "ea", "unit", "sheet", "wash", "roll"):
        return (qty, "each")
    return _to_base(qty, unit)

def match_score(product, candidate_name):
    """Fraction of the product's words that appear in the candidate title."""
    p_words = set(canonicalise(product).split())
    if not p_words:
        return 0.0
    c_words = set(canonicalise(candidate_name).split())
    hits = sum(1 for w in p_words if w in c_words)
    return hits / len(p_words)

# ---------------------------------------------------------------------------
# Apify call.
# ---------------------------------------------------------------------------
class ApifyQuotaExceeded(Exception):
    """Raised when Apify reports the account's monthly usage hard limit is hit.
    Once this fires, every subsequent call will also fail, so the run must
    stop instead of logging the rest of the products as false 'no match'."""

def run_actor(actor_id, payload, token, timeout=180):
    """
    Calls the 'run-sync-get-dataset-items' endpoint, which starts the actor,
    waits for it to finish, and returns its result rows in one HTTP call.
    Returns a list of dicts (possibly empty). Raises on hard failure.
    """
    url = (f"https://api.apify.com/v2/acts/{actor_id}"
           f"/run-sync-get-dataset-items?token={token}&timeout={timeout}")
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout + 30) as resp:
        body = resp.read().decode("utf-8")
    parsed = json.loads(body)
    return parsed if isinstance(parsed, list) else []

# ---------------------------------------------------------------------------
# CSV loading + product selection.
# ---------------------------------------------------------------------------
COL_ING, COL_PROD = "Ingredient", "Product"
COL_CAT = "Category"
COL_QTY, COL_UNIT = "Pack size (qty)", "Pack unit (g / ml / each)"
COL_PRICE, COL_STORE = "Pack price (£)", "Store"
COL_OCC = "occurrences"

def is_junk(name):
    c = canonicalise(name)
    if c in JUNK_PRODUCTS:
        return True
    return any(p.search(name or "") for p in JUNK_PATTERNS)

def load_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return reader.fieldnames, list(reader)

def select_products(rows, min_occ):
    """Group rows by Product, drop junk, keep those with summed occ >= min_occ.
    Records each product's Category (first non-empty seen)."""
    groups = {}
    for r in rows:
        product = (r.get(COL_PROD) or "").strip()
        if not product or is_junk(product):
            continue
        try:
            occ = int(float(r.get(COL_OCC) or 0))
        except ValueError:
            occ = 0
        g = groups.setdefault(product, {"occ": 0, "category": ""})
        g["occ"] += occ
        if not g["category"]:
            g["category"] = (r.get(COL_CAT) or "").strip()
    chosen = {p: g for p, g in groups.items() if g["occ"] >= min_occ}
    return dict(sorted(chosen.items(), key=lambda kv: -kv[1]["occ"]))

def search_term(product):
    return TERM_OVERRIDES.get(canonicalise(product), product)

# ---------------------------------------------------------------------------
# Core: price one product across all stores, return the cheapest pick.
# ---------------------------------------------------------------------------
def best_result_for_store(results, product, category=""):
    """Pick the best-matching, then cheapest, result from one store, after
    rejecting results whose unit/form is wrong for the product's category."""
    allowed, reject_words = allowed_units(category, product)
    # Don't reject a result for containing the product's OWN words
    # (e.g. "Bicarbonate of Soda" must not trip the "soda" bad-form word).
    reject_words = reject_words - set(canonicalise(product).split())
    best = None
    for item in results:
        name = item.get(FIELD["name"])
        if not name:
            continue
        score = match_score(product, name)
        if score < MATCH_THRESHOLD:
            continue
        # Reject wrong forms (e.g. a spice result named "...sauce"/"...drink").
        nwords = set(canonicalise(name).split())
        if nwords & reject_words:
            continue
        price = parse_price(item.get(FIELD["price"]))
        qty, base = parse_size(item.get(FIELD["size"]))
        if price is not None and qty and base:
            # We parsed the real pack ("650g" @ £3.50) -> store it as-is.
            pack_price, pack_qty, pack_base = round(price, 2), qty, base
            unit_price = price / qty
        else:
            # Fall back to the actor's pre-computed unit price + measure
            # ("£0.73 per lt"), normalised to a 1-unit "pack".
            mqty, mbase = parse_measure(item.get(FIELD["measure"]))
            upval = parse_price(item.get(FIELD["unit_price"]))
            if not (upval and mqty and mbase):
                continue
            pack_price, pack_qty, pack_base = round(upval, 3), mqty, mbase
            unit_price = upval / mqty
        if pack_base not in allowed:        # wrong unit for this category
            continue
        cand = {"name": name, "price": pack_price, "qty": pack_qty,
                "base": pack_base, "unit_price": unit_price, "score": score,
                "url": item.get(FIELD["url"])}
        # prefer higher match score, then lower unit price
        if best is None or (cand["score"], -cand["unit_price"]) > \
                           (best["score"], -best["unit_price"]):
            best = cand
    return best

def cheapest_across(per_store):
    """Given {store: pick}, return (store, pick) with lowest unit price within
    the most common base unit. None if nothing usable."""
    if not per_store:
        return None
    # group by base unit; choose the base unit shared by the most stores
    from collections import Counter
    bases = Counter(p["base"] for p in per_store.values())
    target_base = bases.most_common(1)[0][0]
    candidates = {s: p for s, p in per_store.items() if p["base"] == target_base}
    store = min(candidates, key=lambda s: candidates[s]["unit_price"])
    return store, candidates[store]

# ---------------------------------------------------------------------------
# Main.
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="infile", default="pricebook.csv")
    ap.add_argument("--out", default="pricebook.filled.csv")
    ap.add_argument("--report", default="price_report.md")
    ap.add_argument("--min-occ", type=int, default=3,
                    help="only price products appearing at least this many times")
    ap.add_argument("--max-items", type=int, default=5,
                    help="results to request per store per product")
    ap.add_argument("--sample", type=int, default=0,
                    help="only process the first N products (0 = all)")
    ap.add_argument("--resume", action="store_true",
                    help="skip products already priced in an existing --out "
                         "file, instead of re-querying (re-spending) on them")
    ap.add_argument("--token", default=os.environ.get("APIFY_TOKEN", ""))
    ap.add_argument("--price-per-1000", type=float, default=0.0,
                    help="actor's $ per 1000 results, for the cost estimate")
    ap.add_argument("--dry-run", action="store_true",
                    help="list what would be queried + cost; call nothing")
    ap.add_argument("--probe", metavar="TERM",
                    help="run ONE query for TERM against each store and dump "
                         "the first raw result, to discover field names")
    args = ap.parse_args()

    # --- probe mode: discover the real field names cheaply ------------------
    if args.probe:
        if not args.token:
            sys.exit("Set APIFY_TOKEN (or pass --token) to probe.")
        for store, actor in ACTORS.items():
            print(f"\n=== {store} ({actor}) ===")
            try:
                res = run_actor(actor, build_actor_input(args.probe, 3), args.token)
                print(f"  items returned: {len(res)}")
                print(json.dumps(res[0] if res else {}, indent=2)[:1500])
            except urllib.error.HTTPError as e:
                print(f"  HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:400]}")
            except Exception as e:  # noqa: BLE001
                print(f"  ERROR: {e}")
        return

    fieldnames, rows = load_rows(args.infile)
    products = select_products(rows, args.min_occ)
    if args.sample:
        products = dict(list(products.items())[:args.sample])

    n_products = len(products)
    priced = {}      # product -> {"store","qty","base","price",...}

    if args.resume and os.path.exists(args.out):
        _, prev_rows = load_rows(args.out)
        carried = 0
        for r in prev_rows:
            product = (r.get(COL_PROD) or "").strip()
            if product not in products or product in priced:
                continue
            price_raw = (r.get(COL_PRICE) or "").strip()
            if not price_raw:
                continue
            try:
                priced[product] = {
                    "store": (r.get(COL_STORE) or "").strip(),
                    "qty": float(r.get(COL_QTY) or 0),
                    "base": (r.get(COL_UNIT) or "").strip(),
                    "price": float(price_raw),
                    "name": "(carried over from previous run)",
                    "score": 1.0,
                }
                carried += 1
            except ValueError:
                continue
        if carried:
            print(f"--resume: carrying forward {carried} already-priced "
                  f"product(s) from {args.out}; not re-querying them.")
            products = {p: g for p, g in products.items() if p not in priced}
    n_queries = len(products) * len(ACTORS)
    est_results = n_queries * args.max_items
    print(f"Products to price : {n_products}"
          + (f"  ({len(products)} remaining after --resume)"
             if args.resume and len(products) != n_products else ""))
    print(f"Stores per product: {len(ACTORS)}  ({', '.join(ACTORS)})")
    print(f"Total queries     : {n_queries}")
    print(f"Max results pulled: ~{est_results}")
    if args.price_per_1000:
        print(f"Est. cost         : ~${est_results/1000*args.price_per_1000:.2f}"
              f"  (at ${args.price_per_1000}/1000 results)")

    if args.dry_run:
        print("\n--dry-run: nothing was called. Sample of the query list:")
        for p in list(products)[:25]:
            print(f"  - {p!r}  (search: {search_term(p)!r}, "
                  f"occ={products[p]['occ']})")
        return

    if not args.token:
        sys.exit("\nSet APIFY_TOKEN (or pass --token) for a real run. "
                 "Use --dry-run to preview without a token.")

    # --- price every product ----------------------------------------------
    no_match = []       # products that got real results but none confident
    not_attempted = []  # products skipped because quota ran out mid-run
    quota_msg = None
    remaining = list(products)
    for i, product in enumerate(remaining, 1):
        term = search_term(product)
        category = products[product].get("category", "")
        per_store = {}
        try:
            for store, actor in ACTORS.items():
                try:
                    results = run_actor(actor, build_actor_input(term, args.max_items),
                                        args.token)
                except urllib.error.HTTPError as e:
                    body = e.read().decode("utf-8", "replace")[:300]
                    if e.code == 403 and ("actor-disabled" in body
                                           or "hard limit" in body.lower()):
                        raise ApifyQuotaExceeded(body) from None
                    print(f"  [{store}] HTTP {e.code} for {term!r}: {body[:200]}")
                    continue
                except Exception as e:  # noqa: BLE001
                    print(f"  [{store}] error for {term!r}: {e}")
                    continue
                pick = best_result_for_store(results, product, category)
                if pick:
                    per_store[store] = pick
        except ApifyQuotaExceeded as e:
            quota_msg = str(e)
            not_attempted = remaining[i - 1:]
            print(f"\nApify quota exhausted on {product!r}: {quota_msg[:200]}")
            print(f"Stopping early -- {len(not_attempted)} product(s) not "
                  f"attempted this run.")
            break
        choice = cheapest_across(per_store)
        if choice:
            store, pick = choice
            priced[product] = {"store": store, **pick}
            print(f"[{i}/{len(remaining)}] {product}: £{pick['price']} "
                  f"@ {store} ({pick['qty']:g}{pick['base']})")
        else:
            no_match.append(product)
            print(f"[{i}/{len(remaining)}] {product}: no confident match")

    # --- write the filled CSV ---------------------------------------------
    for r in rows:
        product = (r.get(COL_PROD) or "").strip()
        p = priced.get(product)
        if not p:
            continue
        r[COL_QTY] = f"{p['qty']:g}"
        r[COL_UNIT] = p["base"]
        r[COL_PRICE] = f"{p['price']:.2f}"
        r[COL_STORE] = p["store"]
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    # --- write the report --------------------------------------------------
    low_conf = {p: d for p, d in priced.items() if d["score"] < 0.75}
    with open(args.report, "w", encoding="utf-8") as f:
        f.write(f"# Price book fill report\n\n")
        f.write(f"- Products priced: **{len(priced)}** / {n_products}\n")
        f.write(f"- No confident match: **{len(no_match)}**\n")
        f.write(f"- Low-confidence picks (eyeball these): **{len(low_conf)}**\n")
        if not_attempted:
            f.write(f"- **Not attempted (Apify quota exhausted): "
                    f"{len(not_attempted)}** -- re-run with `--resume` once "
                    f"your quota resets/upgrades; these are NOT real "
                    f"mismatches.\n")
        f.write("\n")
        if quota_msg:
            f.write(f"## Apify quota exhausted\n\n"
                    f"Run stopped early because Apify reported the account's "
                    f"monthly usage hard limit was hit:\n\n```\n{quota_msg}\n"
                    f"```\n\nRe-run with `--resume` after upgrading/waiting "
                    f"for reset to pick up where this left off without "
                    f"re-querying already-priced products.\n\n")
        if not_attempted:
            f.write("## Not attempted (quota exhausted, not real mismatches)\n\n")
            for p in sorted(not_attempted):
                f.write(f"- {p}\n")
            f.write("\n")
        if low_conf:
            f.write("## Low-confidence picks\n\n")
            for p, d in sorted(low_conf.items()):
                f.write(f"- **{p}** -> matched \"{d['name']}\" "
                        f"(£{d['price']} @ {d['store']}, score {d['score']:.2f})\n")
            f.write("\n")
        if no_match:
            f.write("## No match found\n\n")
            for p in sorted(no_match):
                f.write(f"- {p}\n")

    print(f"\nWrote {args.out} and {args.report}")
    print(f"Priced {len(priced)}/{n_products} products; "
          f"{len(no_match)} unmatched; {len(low_conf)} low-confidence"
          + (f"; {len(not_attempted)} not attempted (quota exhausted -- "
             f"re-run with --resume)." if not_attempted else "."))

if __name__ == "__main__":
    main()

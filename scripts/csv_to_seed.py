#!/usr/bin/env python3
"""
csv_to_seed.py  --  Turn the filled pricebook.csv into the app's price-book seed.

WHAT THIS DOES (in plain English)
---------------------------------
The app (index.html) ships with a hard-coded list of prices inside a function
called seedPriceBook(). This script reads your FILLED pricebook.csv (the output
of price_pricebook.py) and rewrites that function so the app uses your new
prices. Each unique Product becomes one price-book entry, keyed the same way
the app keys things (canonicalise), with all the ingredient name variants
attached as "aliases" so recipes match.

By default it just PRINTS a ready-to-paste snippet and writes it to
scripts/seed_snippet.js -- it changes nothing. Pass --apply to patch
index.html in place (a .bak backup is written first).

USAGE
-----
  python3 scripts/csv_to_seed.py --in pricebook.filled.csv        # preview
  python3 scripts/csv_to_seed.py --in pricebook.filled.csv --apply
"""

import argparse
import csv
import datetime as dt
import json
import re
import sys

# Same canonicalise() + stop list as the app and as price_pricebook.py.
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

COL_ING, COL_PROD = "Ingredient", "Product"
COL_QTY, COL_UNIT = "Pack size (qty)", "Pack unit (g / ml / each)"
COL_PRICE, COL_STORE, COL_ALIAS = "Pack price (£)", "Store", "Aliases"

SEED_FLAG = "ds_pb_seeded_v3"   # bumped from v2 so the new data actually loads.

def build_entries(rows, date):
    """Return list of (key, packSize, packUnit, packPrice, store, date, aliases)."""
    groups = {}  # key -> dict
    for r in rows:
        product = (r.get(COL_PROD) or "").strip()
        price = (r.get(COL_PRICE) or "").strip()
        if not product or not price:
            continue  # only products that actually got priced
        key = canonicalise(product)
        if not key:
            continue
        g = groups.setdefault(key, {
            "packSize": (r.get(COL_QTY) or "").strip(),
            "packUnit": (r.get(COL_UNIT) or "").strip(),
            "packPrice": price,
            "store": (r.get(COL_STORE) or "").strip(),
            "aliases": set(),
        })
        # collect alias variants: the ingredient name + the Aliases column
        for cand in [r.get(COL_ING, "")] + (r.get(COL_ALIAS, "") or "").split(";"):
            ca = canonicalise(cand)
            if ca and ca != key:
                g["aliases"].add(ca)

    entries = []
    for key, g in sorted(groups.items()):
        try:
            ps = float(g["packSize"]); pp = float(g["packPrice"])
        except ValueError:
            continue
        ps = int(ps) if ps.is_integer() else ps
        entries.append((key, ps, g["packUnit"], round(pp, 2),
                        g["store"], date, sorted(g["aliases"])))
    return entries

def render_seed(entries):
    """Produce the full seedPriceBook() IIFE text."""
    lines = []
    lines.append("(function seedPriceBook() {")
    lines.append(f"  if (localStorage.getItem('{SEED_FLAG}')) return;")
    lines.append("  // [key, packSize, packUnit, packPrice, store, updatedAt, aliases]")
    lines.append("  // Generated from pricebook.csv via scripts/csv_to_seed.py")
    lines.append("  const rows = [")
    for key, ps, pu, pp, st, ua, aliases in entries:
        row = [key, ps, pu, pp, st, ua, aliases]
        lines.append("    " + json.dumps(row, ensure_ascii=False) + ",")
    lines.append("  ];")
    lines.append("  for (const [k, ps, pu, pp, st, ua, al] of rows) {")
    lines.append("    priceBook[k] = { aliases: al || [], unitPrice: pp / ps, "
                 "unit: pu, packSize: ps, packUnit: pu, packPrice: pp, "
                 "store: st, updatedAt: ua };")
    lines.append("  }")
    lines.append("  try { localStorage.setItem('ds_pricebook', "
                 "JSON.stringify(priceBook)); } catch(e) {}")
    lines.append(f"  localStorage.setItem('{SEED_FLAG}', '1');")
    lines.append("})();")
    return "\n".join(lines)

SEED_RE = re.compile(r"\(function seedPriceBook\(\) \{.*?\n\}\)\(\);", re.S)

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="infile", default="pricebook.filled.csv")
    ap.add_argument("--html", default="index.html")
    ap.add_argument("--snippet", default="scripts/seed_snippet.js")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--apply", action="store_true",
                    help="patch index.html in place (writes index.html.bak first)")
    args = ap.parse_args()

    with open(args.infile, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    entries = build_entries(rows, args.date)
    if not entries:
        sys.exit("No priced products found in the CSV. Run price_pricebook.py first.")
    seed = render_seed(entries)

    with open(args.snippet, "w", encoding="utf-8") as f:
        f.write(seed + "\n")
    print(f"Generated {len(entries)} price-book entries -> {args.snippet}")

    if not args.apply:
        print("Preview only. Re-run with --apply to patch index.html.")
        return

    with open(args.html, encoding="utf-8") as f:
        html = f.read()
    if not SEED_RE.search(html):
        sys.exit("Could not find seedPriceBook() in index.html -- aborting.")
    with open(args.html + ".bak", "w", encoding="utf-8") as f:
        f.write(html)
    new_html = SEED_RE.sub(lambda _: seed, html, count=1)
    with open(args.html, "w", encoding="utf-8") as f:
        f.write(new_html)
    print(f"Patched {args.html} (backup at {args.html}.bak).")

if __name__ == "__main__":
    main()

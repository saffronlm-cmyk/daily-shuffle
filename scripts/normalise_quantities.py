#!/usr/bin/env python3
"""
Ingredient quantity normalisation — applies the ruleset in
`quantity-normalisation-plan.md` (§3) to produce a gram weight + provenance
flag (`qty_source`) for every ingredient line.

Input : a JSON array of {id, serves, sections} where `sections` is the recipe's
        `ingredient_sections` jsonb (list of {title, ingredients:[...]} objects;
        each ingredient is either a plain string (legacy) or a
        {qty,unit,name,note,group} object (structured), or null).
Output: - <out_csv>   one row per real ingredient line (for human spot-check), plus a
                     `skip_reason` column naming the guard that excluded the recipe
        - <out_json>  one object per recipe:
                     {id, ingredient_grams, add_flags, items_seen, skipped}
                     `ingredient_grams` is **null**, not [], for skipped recipes —
                     the apply step writes nothing for those. Guards:
                       empty_ingredients  no usable lines (e.g. every line null —
                                          see the 2026-07 hollow-recipe damage)
                       serves_missing     no `serves` (plan §6 decision 5)

Build-only; stdlib only. Run locally in the sandbox (no external network needed —
data is supplied as a file dumped via the Supabase MCP channel).
"""
import sys, json, csv, re, unicodedata

# ---------------------------------------------------------------- fractions
UNICODE_FRAC = {
    '¼': .25, '½': .5, '¾': .75, '⅓': 1/3, '⅔': 2/3,
    '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875, '⅕': .2, '⅖': .4,
    '⅗': .6, '⅘': .8, '⅙': 1/6, '⅚': 5/6,
}

def _frac_token(tok):
    """Parse a single numeric token that may be '1', '1.5', '1/2', '½', '1½', '1 1/2'."""
    tok = tok.strip()
    if not tok:
        return None
    # split off a leading integer glued/spaced before a fraction: '1½', '1 1/2'
    total = 0.0
    got = False
    # unicode fraction glued to int e.g. 1½
    m = re.match(r'^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚])$', tok)
    if m:
        return int(m.group(1)) + UNICODE_FRAC[m.group(2)]
    if tok in UNICODE_FRAC:
        return UNICODE_FRAC[tok]
    # mixed 'a b/c'
    m = re.match(r'^(\d+)\s+(\d+)\s*/\s*(\d+)$', tok)
    if m:
        return int(m.group(1)) + int(m.group(2)) / int(m.group(3))
    # simple fraction 'b/c'
    m = re.match(r'^(\d+)\s*/\s*(\d+)$', tok)
    if m:
        return int(m.group(1)) / int(m.group(2))
    # decimal / int
    m = re.match(r'^(\d+(?:\.\d+)?)$', tok)
    if m:
        return float(m.group(1))
    return None

def parse_leading_amount(s):
    """
    Return (value, rest) where value is the leading quantity (ranges -> midpoint,
    fractions handled) and rest is the string after the consumed amount.
    If no leading amount, (None, s).
    """
    s = s.strip()
    # Grab a leading run that looks like a quantity, possibly a range.
    # Pattern captures things like: 1, 1.5, 1/2, ½, 1½, 1 1/2, 3-4, 1/2 - 1, ½–¾
    m = re.match(
        r'^\s*('
        r'\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]'   # 1½
        r'|\d+\s+\d+\s*/\s*\d+'          # 1 1/2
        r'|\d+\s*/\s*\d+'                # 1/2
        r'|[¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]'          # ½
        r'|\d+(?:\.\d+)?'                # 1 or 1.5
        r')\s*',
        s)
    if not m:
        return None, s
    first = _frac_token(m.group(1).strip())
    rest = s[m.end():]
    # range? next token is a dash then another number
    m2 = re.match(r'^\s*[-–—]\s*('
                  r'\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]'
                  r'|\d+\s+\d+\s*/\s*\d+'
                  r'|\d+\s*/\s*\d+'
                  r'|[¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]'
                  r'|\d+(?:\.\d+)?'
                  r')\s*', rest)
    if m2 and first is not None:
        second = _frac_token(m2.group(1).strip())
        if second is not None:
            first = (first + second) / 2.0
            rest = rest[m2.end():]
    return first, rest

# ---------------------------------------------------------------- classes
# per (class): tsp, tbsp, cup grams, and ml-density (g/ml). None = N/A.
DENSITY = {
    'water':   dict(tsp=5,   tbsp=15,  cup=250, mlden=1.00),
    'sauce':   dict(tsp=5.5, tbsp=16,  cup=275, mlden=1.10),
    'oil':     dict(tsp=4.5, tbsp=14,  cup=227, mlden=0.91),
    'syrup':   dict(tsp=7,   tbsp=21,  cup=350, mlden=1.40),
    'sugar':   dict(tsp=4,   tbsp=12.5,cup=213, mlden=0.85),
    'paste':   dict(tsp=5,   tbsp=16,  cup=263, mlden=1.05),
    'dairy':   dict(tsp=5,   tbsp=15,  cup=255, mlden=1.02),
    'flour':   dict(tsp=2.6, tbsp=8,   cup=133, mlden=0.53),
    'cocoa':   dict(tsp=2,   tbsp=6,   cup=103, mlden=0.41),
    'salt':    dict(tsp=6,   tbsp=18,  cup=None,mlden=1.20),
    'spice':   dict(tsp=2.5, tbsp=6,   cup=None,mlden=0.50),
    'cheese':  dict(tsp=None,tbsp=7,   cup=100, mlden=None),
    'seeds':   dict(tsp=4,   tbsp=10,  cup=167, mlden=None),
    'oats':    dict(tsp=None,tbsp=6,   cup=90,  mlden=None),
    'rice':    dict(tsp=None,tbsp=None,cup=185, mlden=None),
    'leafy':   dict(tsp=None,tbsp=None,cup=30,  mlden=None),
    'berries': dict(tsp=None,tbsp=None,cup=140, mlden=None),
    'veg':     dict(tsp=None,tbsp=None,cup=150, mlden=None),
    'solidfb': dict(tsp=3,   tbsp=9,   cup=156, mlden=0.60),
    'liquidfb':dict(tsp=5,   tbsp=15,  cup=250, mlden=1.00),
}

# keyword -> class. Order matters (first hit wins); more-specific first.
CLASS_KEYWORDS = [
    ('oil',    ['olive oil','vegetable oil','veg oil','coconut oil','sesame oil','avocado oil',
                'sunflower oil','rapeseed oil','chilli oil','chili oil','garlic oil','melted butter','ghee',' oil']),
    ('syrup',  ['maple syrup','golden syrup','honey','molasses','agave','date syrup','rice malt syrup','corn syrup']),
    ('sugar',  ['caster sugar','icing sugar','brown sugar','white sugar','coconut sugar','granulated sugar',
                'demerara',' sugar']),
    ('sauce',  ['soy sauce','light soy','dark soy','fish sauce','worcestershire','tamari','oyster sauce',
                'hoisin','sweet chilli sauce','pickle juice','mirin','rice vinegar','vinegar','sherry',
                'sriracha','coconut aminos','tabasco','hot sauce','mango chutney','chutney','ketchup']),
    ('paste',  ['peanut butter','almond butter','cashew butter','nut butter','tahini','miso','tomato paste',
                'tomato puree','curry paste','harissa','gochujang','pesto','mustard','mayo','mayonnaise',
                'cream cheese']),
    ('dairy',  ['greek yoghurt','greek yogurt','natural yoghurt','plain yoghurt','yoghurt','yogurt',
                'sour cream','creme fraiche','crème fraîche','double cream','single cream','soured cream']),
    ('flour',  ['plain flour','self-raising','self raising','oat flour','cornflour','corn starch','cornstarch',
                'almond flour','coconut flour','flour']),
    ('cocoa',  ['cocoa powder','cacao powder','cocoa','cacao']),
    ('cheese', ['cheddar','parmesan','grana padano','mozzarella','feta','halloumi','pecorino','gruyere',
                'grated cheese','shredded cheese','cheese']),
    ('seeds',  ['chia seed','chia','flax','linseed','sesame seed','hemp seed','pumpkin seed','sunflower seed']),
    ('oats',   ['rolled oats','porridge oats','oats']),
    ('rice',   ['basmati','jasmine rice','white rice','brown rice','rice']),
    ('salt',   ['sea salt','table salt','flaky salt','kosher salt','salt']),
    ('spice',  ['cumin','paprika','cinnamon','turmeric','coriander powder','ground ginger','garlic powder',
                'onion powder','garlic granules','chilli powder','chili powder','cayenne','oregano','thyme',
                'garam masala','curry powder','baking powder','baking soda','bicarbonate','bicarb','nutmeg',
                'allspice','chilli flakes','chili flakes','red pepper flakes','black pepper','white pepper',
                'ground pepper','chipotle','gochugaru','chile lime','cardamom','fennel',
                'italian seasoning','everything bagel','za\'atar','zaatar','sumac','cajun','taco seasoning',
                'seasoning','spice']),
    ('berries',['blueberr','raspberr','strawberr','blackberr','berries']),
    ('leafy',  ['spinach','watercress','rocket','kale','basil','coriander','parsley','mint','lettuce','greens',
                'salad leaves','herbs']),
    ('water',  ['milk','stock','broth','water','juice','wine','coconut milk','coconut cream','cream','passata',
                'coconut water','pumpkin puree','butternut','squash','puree','purée','mashed','vanilla']),
]

def _kwhit(kw, n):
    """word-boundary prefix match: 'oil' hits 'oil'/'olive oil' but not 'boiling';
    'strawberr' still hits 'strawberries'."""
    return re.search(r'\b' + re.escape(kw.strip()), n) is not None

def classify(name):
    n = name.lower()
    for cls, kws in CLASS_KEYWORDS:
        for kw in kws:
            if _kwhit(kw, n):
                return cls
    return None

# ---------------------------------------------------------------- count items
# name-keyword -> grams per single piece (edible portion, typical UK size)
COUNT_G = [
    ('garlic clove',5),('clove',5),('garlic',5),
    ('medjool date',18),('date',18),('leek',90),('scallion',15),('romaine',300),
    ('star anise',0.5),('kaffir lime leaf',0.2),('lime leaf',0.2),
    ('chicken breast',170),('chicken thigh',90),('thigh',90),('breast',170),
    ('salmon fillet',130),('cod fillet',130),('fish fillet',130),('fillet',130),
    ('spring onion',15),('green onion',15),('scallion',15),
    ('red onion',150),('white onion',150),('yellow onion',150),('onion',150),
    ('shallot',40),
    ('cherry tomato',17),('strawberr',12),('raspberr',5),('blackberr',5),('blueberr',2),
    ('avocado',150),('banana',118),('apple',150),('pear',160),('orange',130),
    ('lemon',45),('lime',30),
    ('carrot',60),('courgette',200),('zucchini',200),('cucumber',300),
    ('bell pepper',120),('green pepper',120),('red pepper',120),('pepper',120),
    ('cherry tomato',17),('baby tomato',17),('plum tomato',60),('sundried tomato',4),('tomato',120),
    ('new potato',25),('sweet potato',130),('potato',170),
    ('jalapeno',15),('jalapeño',15),('chilli',15),('chili',15),
    ('rice cake',9),('rice paper',5),('sourdough',50),('tortilla',45),('wrap',45),
    ('slice of bread',40),('bread',40),('bay leaf',0.2),('stock cube',10),
    ('mushroom',20),('gherkin',15),('egg white',33),('egg',50),
    ('baby gem',90),('gem lettuce',90),
    # Whole vegetables sold as one item. Without these a line like "1 whole
    # butternut squash" fell through to the 100 g/piece fallback (§5) and came
    # out ~8x light. Values reconciled against Saffron's 2026-08-07 review
    # (quantity-review-decisions.v2.csv) — cabbage at 900 reproduces her 450 /
    # 225 / 315 / 157.5 entries exactly via the existing small/large modifiers.
    ('butternut squash',800),('butternut',800),('pumpkin',900),('squash',800),
    ('cauliflower',600),('cabbage',900),('broccoli',350),('celeriac',800),
    ('swede',700),('aubergine',250),('eggplant',250),
]

# Container / portion words that carry an implied weight. Same failure mode as
# the whole vegetables above: "1 pint cherry tomatoes" was read as one cherry
# tomato (17 g). Keyed on the container, then the contents where it matters.
CONTAINER_G = [
    ('punnet',  [('tomato',250),('mushroom',200),('berr',150)],            200),
    ('pint',    [('tomato',300),('berr',300)],                             300),
    ('bag',     [('coleslaw',300),('slaw',300),('salad',100),('spinach',200)], 300),
    ('head',    [],                                                        None),
]
def container_grams(name, lower):
    """(keyword, grams) for a container word, or (None, None).

    Returns None grams for 'head' so it falls through to COUNT_G — a head of
    cauliflower/broccoli/romaine is already a whole-vegetable entry there.
    """
    for kw, contents, default in CONTAINER_G:
        if not _kwhit(kw, lower):
            continue
        if default is None:
            return None, None
        for ckw, g in contents:
            if _kwhit(ckw, name.lower()):
                return f"{kw} of {ckw}", g
        return kw, default
    return None, None
# A whole-vegetable keyword must not fire when the line names a *processed form*
# of it: "cauliflower rice" is a bulk staple, not a 600 g cauliflower, and
# "butternut squash soup" is not a whole squash. Checked before COUNT_G.
WHOLE_VEG = {'butternut squash','butternut','pumpkin','squash','cauliflower',
             'cabbage','broccoli','celeriac','swede','aubergine','eggplant'}
_NOT_WHOLE = re.compile(
    r'\b(?:cauli(?:flower)?|butternut|squash|pumpkin|cabbage|broccoli)\s+'
    r'(?:rice|soup|puree|purée|powder|mash|steaks?|slaw|noodles?)\b'
    r'|\briced\s|\b(?:soup|puree|purée|powder)\b', re.I)

def count_grams(name):
    n = name.lower()
    skip_whole = bool(_NOT_WHOLE.search(n))
    for kw, g in COUNT_G:
        if skip_whole and kw in WHOLE_VEG:
            continue
        if _kwhit(kw, n):
            return kw, g
    return None, None

# bare-main "typical serving" grams when no qty/unit and not a count noun (§3.6.3)
BARE_SERVING = [
    ('protein powder',30),('chickpea',200),('black bean',200),('kidney bean',200),
    ('butter bean',200),('bean sprout',80),('bean',200),('lentil',180),('rice',180),('pasta',180),
    ('noodle',180),('oats',40),('quinoa',180),('couscous',180),('greek yoghurt',150),
    ('yoghurt',150),('yogurt',150),('milk',200),
    ('peanut butter',16),('almond butter',16),('nut butter',16),
    ('olive oil',14),('vegetable oil',14),('cooking oil',5),('cooking spray',2),('garlic oil',5),('oil',14),
    ('tuna',100),('salmon',100),('feta',30),('parmesan',20),('halloumi',60),('cheese',40),
    ('coriander',5),('parsley',5),('basil',5),('dill',5),('chives',5),('mint',5),('herbs',5),
    ('lettuce',30),('rocket',20),('broccoli',80),('cabbage',100),('bok choy',100),('spinach',60),
    ('sriracha',15),('salsa',30),('jam',15),('chutney',15),('pickle',15),('gherkin',15),
    ('strawberr',80),('raspberr',80),('blueberr',80),('blackberr',80),('berr',80),
    ('raisin',30),('desiccated coconut',10),('coconut flake',10),('cacao nib',10),
    ('sweetcorn',150),('peas',80),('flour',100),('sugar',10),('honey',20),('maple syrup',20),
    ('chocolate',30),('nuts',30),('seeds',10),('tofu',150),('mince',250),('vanilla',5),
    ('nutritional yeast',5),('hummus',40),('granola',40),('pecan',30),('walnut',30),('almond',30),
    ('cashew',30),('cilantro',5),('kewpie',15),('mayo',15),('cocoa',10),('ice cream',60),
    ('peach',80),('nectarine',80),('mango',80),('fruit',80),('seaweed',5),('pico de gallo',30),
    ('pita',60),('naan',90),('avocado',150),('egg',50),('bacon',30),('ham',30),
    ('peanut',30),('hazelnut',30),('pistachio',30),('macadamia',30),('hoisin',15),('cacao',10),
]
def bare_serving(name):
    n = name.lower()
    for kw, g in BARE_SERVING:
        if _kwhit(kw, n):
            return kw, g
    return None, None

VAGUE = {
    'pinch':0.3,'dash':0.5,'drizzle':5,'splash':15,'knob':15,'handful':30,
    'scoop':30,'sprig':2,'bunch':30,
}

SEASONING_TO_TASTE = [('salt',1),('pepper',0.5)]  # bare/"to taste" nominal grams

# ---------------------------------------------------------------- main rule
def normalise(raw, serves=1):
    """
    raw: a single ingredient line already flattened to a string.
    serves: the recipe's `serves`, used ONLY to scale the bare-bulk-staple
        default in §6 — see the note there. Everything else on this path is
        already a whole-recipe quantity.
    returns dict(grams, qty_source, detail, name)
    grams None => unresolved.
    """
    if raw is None:
        return None
    original = raw.strip()
    if not original:
        return None
    s = original
    # name for classification = strip a leading amount+unit and trailing prep
    lower = s.lower()

    garnish = bool(re.search(r'\b(to serve|to garnish|for garnish|for serving|to top|as topping|optional)\b', lower))
    to_taste = bool(re.search(r'\bto taste\b', lower))

    # ingredient "name" ~ everything after leading qty/unit, before first comma
    _, after_amt = parse_leading_amount(s)
    name = re.sub(r'^\s*(g|kg|ml|l|tsp|tbsp|tbsps|teaspoons?|tablespoons?|cups?|oz|ounces?|lb|lbs|pounds?|'
                  r'cloves?|slices?|pinch(?:es)?|dash(?:es)?|handfuls?|scoops?|sprigs?|bunch(?:es)?|'
                  r'cans?|tins?|packs?|heaped|rounded|level|scant|large|medium|small|whole)\b\.?\s*',
                  '', after_amt, flags=re.I).strip()
    name = re.split(r',', name)[0].strip()
    if not name:
        name = re.split(r',', original)[0].strip()
    cls = classify(name)

    # modifier
    mult = 1.0
    if re.search(r'\b(heaped|rounded)\b', lower): mult = 1.5
    elif re.search(r'\bscant\b', lower): mult = 0.85

    def dens(cls_):
        return DENSITY.get(cls_ or ('liquidfb' if _is_liquid(name) else 'solidfb'))

    # ---- 1. explicit metric weight anywhere (stated) — highest confidence
    grams_tokens = re.findall(r'(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b', lower)
    # prefer a weight (g/kg); else a volume (ml/l)
    wt = next(((float(v),u) for v,u in grams_tokens if u in ('g','kg')), None)
    vol = next(((float(v),u) for v,u in grams_tokens if u in ('ml','l')), None)
    if wt:
        g = wt[0] * (1000 if wt[1]=='kg' else 1)
        return dict(grams=round(g,1), qty_source='stated', detail=f"{wt[0]}{wt[1]} stated", name=name)
    if vol:
        ml = vol[0] * (1000 if vol[1]=='l' else 1)
        d = dens(cls)['mlden'] or 1.0
        return dict(grams=round(ml*d,1), qty_source='stated',
                    detail=f"{vol[0]}{vol[1]} × {d} g/ml", name=name)

    amount, _ = parse_leading_amount(s)

    # ---- 1b. "juice of N X" / "zest of N X" — the N is embedded, not leading
    mj = re.search(r'\b(juice|zest)\s+of\b', lower)
    if mj and not re.search(r'\b(ml|g|cup|tbsp|tsp)\b', lower):
        kind = mj.group(1)
        mnum = re.search(r'of\s+(\d+(?:\.\d+)?|[¼½¾⅓⅔⅛])\s*(?:large|small)?\s*'
                         r'(lemon|lime|orange|grapefruit|clementine)', lower)
        n = 1.0; fruit = 'lemon'
        if mnum:
            n = _frac_token(mnum.group(1)) or 1.0
            fruit = mnum.group(2)
        per = ({'lemon':6,'lime':4,'orange':10,'grapefruit':12,'clementine':6} if kind == 'zest'
               else {'lemon':45,'lime':30,'orange':80,'grapefruit':120,'clementine':40})
        return dict(grams=round(n*per.get(fruit,45),1), qty_source='converted',
                    detail=f"{kind} of {round(n,2)} {fruit}", name=name)

    # ---- 1c. "N cm/inch piece" of ginger etc. — a length, not a count
    ml_ = re.search(r'(\d+(?:\.\d+)?|[¼½¾⅓⅔⅛])\s*(cm|inch|"|thumb)', lower)
    if ml_:
        n = _frac_token(ml_.group(1)) or 1.0
        per = 6 if ml_.group(2) == 'cm' else 15   # ginger ≈6 g/cm, ≈15 g/inch
        base = per if ('ginger' in name.lower() or 'galangal' in name.lower() or 'turmeric' in name.lower()) else 12
        return dict(grams=round(n*base,1), qty_source='converted',
                    detail=f"{round(n,2)} {ml_.group(2)} piece", name=name)

    # ---- 1d. tin / can
    mt = re.search(r'\b(tin|can)s?\b', lower)
    if mt:
        n = amount if amount is not None else 1.0
        nm = name.lower()
        if any(k in nm for k in ['coconut milk','coconut cream','tomato','passata']): w = 400
        elif any(k in nm for k in ['chickpea','bean','lentil']): w = 240     # drained
        elif 'tuna' in nm or 'salmon' in nm or 'sardine' in nm: w = 100      # drained
        else: w = 400
        return dict(grams=round(n*w,1), qty_source='converted',
                    detail=f"{round(n,2)} × {w} g tin", name=name)

    # ---- 2. imperial
    m = re.search(r'\b(oz|ounces?|lb|lbs|pounds?)\b', lower)
    if m and amount is not None:
        u = m.group(1)
        g = amount * (453.6 if u.startswith(('lb','pound')) else 28.35)
        return dict(grams=round(g*mult,1), qty_source='converted',
                    detail=f"{amount} {u} → metric", name=name)

    # ---- 3. volume units
    m = re.search(r'\b(tsp|teaspoons?|tbsp|tbsps|tablespoons?|tbs|tb|cups?)\b', lower)
    if m:
        u = m.group(1)
        key = 'tsp' if u.startswith(('tsp','teaspoon')) else 'tbsp' if u.startswith(('tbsp','tablespoon','tbs','tb')) else 'cup'
        d = dens(cls)
        per = d.get(key)
        if per is None:  # class has no value for this measure -> fallback
            per = DENSITY['liquidfb' if _is_liquid(name) else 'solidfb'][key]
        amt = amount if amount is not None else 1.0
        return dict(grams=round(amt*per*mult,1), qty_source='converted',
                    detail=f"{amt} {key} × {per} g ({cls or 'fallback'})", name=name)

    # ---- 4. vague measures
    for term, val in VAGUE.items():
        if re.search(r'\b'+term, lower):   # prefix: matches handfuls/dashes/pinches
            amt = amount if amount is not None else 1.0
            g = amt * val
            if term=='bunch' and 'spring onion' in name.lower(): g = amt*75
            unit = 'ml' if term in ('splash',) else 'g'
            gg = g * ((dens(cls)['mlden'] or 1.0) if unit=='ml' else 1)
            return dict(grams=round(gg,1), qty_source='defaulted',
                        detail=f"{term} default", name=name)

    # ---- 5. clove / explicit count noun with amount
    if amount is not None:
        # "1 serving microwave sticky rice" — the count is explicit, so this is
        # N × one person's portion and does NOT scale by `serves`.
        if re.search(r'\bservings?\b', lower):
            skw, sg = bare_serving(name)
            if sg is not None:
                return dict(grams=round(amount*sg,1), qty_source='estimated',
                            detail=f"{amount} × {sg} g serving ({skw})", name=name)
        ckw, cg = container_grams(name, lower)
        if cg is not None:
            return dict(grams=round(amount*cg*mult,1), qty_source='converted',
                        detail=f"{amount} × {cg} g ({ckw})", name=name)
        kw, g = count_grams(name)
        if g is not None:
            # Size words only count when they qualify the ingredient, i.e. before
            # the first comma. "1 head cauliflower, cut into small florets" is a
            # whole cauliflower cut small, not a small cauliflower — reading the
            # prep clause knocked 30% off it.
            head = lower.split(',', 1)[0]
            adj = 1.0
            if re.search(r'\bsmall\b', head): adj = 0.7
            elif re.search(r'\blarge\b', head): adj = 1.4
            return dict(grams=round(amount*g*adj,1), qty_source='converted',
                        detail=f"{amount} × {g} g ({kw})", name=name)
        # amount but unknown count item -> estimated fallback 100 g/piece
        return dict(grams=round(amount*100,1), qty_source='estimated',
                    detail=f"{amount} × 100 g (unknown unit, fallback)", name=name)

    # ---- 6. no amount, no unit
    if to_taste or _is_seasoning(name):
        for kw, g in SEASONING_TO_TASTE:
            if kw in name.lower():
                return dict(grams=g, qty_source='to_taste', detail=f"to taste ({kw})", name=name)
        return dict(grams=1.0, qty_source='to_taste', detail="to taste (seasoning)", name=name)
    if garnish:
        return dict(grams=5.0, qty_source='garnish', detail="garnish default", name=name)
    # bare count noun -> 1 piece, estimated
    kw, g = count_grams(name)
    if g is not None:
        return dict(grams=round(g,1), qty_source='estimated', detail=f"bare → 1 × {g} g ({kw})", name=name)
    # bare bulk staple -> typical serving × serves, estimated
    #
    # BARE_SERVING holds ONE PERSON'S portion, but `grams` on this path is a
    # whole-recipe weight (plan §2; step 3 sums and divides by `serves`). Before
    # 2026-08-07 the per-serving figure was written straight through, so every
    # bare staple in a multi-serve recipe came out short by a factor of `serves`
    # — "rice" in a serves-4 recipe scored 180 g rather than 720 g. Saffron's
    # review caught this by hand; see quantity-review-decisions.md.
    #
    # Only this branch scales. A bare count noun (§6 above) is already one whole
    # item in the recipe, and to_taste/garnish/VAGUE amounts don't grow with
    # batch size, so none of those are multiplied.
    kw, g = bare_serving(name)
    if g is not None:
        n = max(1, int(serves or 1))
        total = g * n
        detail = (f"bare → {g} g typical ({kw}) × {n} serves" if n > 1
                  else f"bare → {g} g typical ({kw})")
        return dict(grams=round(total,1), qty_source='estimated', detail=detail, name=name)
    # unresolved
    return dict(grams=None, qty_source='unresolved', detail="no amount, generic item", name=name)

def _is_liquid(name):
    return classify(name) in ('water','sauce','oil','syrup','dairy')
def _is_seasoning(name):
    return classify(name) in ('salt','spice')

# ---------------------------------------------------------------- flatten
def flatten_item(item):
    """Return a raw string for an ingredient item (string or {qty,unit,name})."""
    if item is None:
        return None, None
    if isinstance(item, str):
        return item, None
    if isinstance(item, dict):
        qty, unit, nm = item.get('qty'), item.get('unit'), item.get('name') or ''
        grp = item.get('group')
        parts = []
        if qty is not None:
            # render qty compactly
            q = int(qty) if float(qty).is_integer() else round(qty, 3)
            parts.append(str(q))
        if unit:
            parts.append(str(unit))
        parts.append(str(nm))
        return ' '.join(parts).strip(), grp
    return None, None

def load_decisions(path):
    """Read a reviewed decisions CSV into {(recipe_id, sec, item): {...}}.

    Expects the columns of `quantity-review-decisions.v2.csv`: recipe_id, sec,
    item, corrected_grams, note. Three shapes of `corrected_grams`:
      a number   -> that whole-recipe gram weight, qty_source becomes 'reviewed'
      'N/A' / 0  -> exclude the line from nutrition, keep the computed grams
      empty      -> undecided; the row is ignored and the computed value stands
    A note containing 'exclude from nutritional' also sets the exclude flag,
    which is how the three cooked-rice lines are handled (grams kept for cost
    and the grocery list, macros skipped).
    """
    decisions = {}
    with open(path, newline='') as f:
        for r in csv.DictReader(f):
            rid = (r.get('recipe_id') or '').strip()
            if not rid:
                continue
            key = (rid, int(r['sec']), int(r['item']))
            raw = (r.get('corrected_grams') or '').strip()
            note = (r.get('note') or '').strip()
            d = {'grams': None, 'exclude_from_nutrition': False, 'note': note}
            if 'exclude from nutritional' in note.lower():
                d['exclude_from_nutrition'] = True
            if raw.upper() == 'N/A':
                d['exclude_from_nutrition'] = True
            else:
                try:
                    val = float(raw)
                except ValueError:
                    if not raw:
                        # undecided — but an exclude note still counts
                        if d['exclude_from_nutrition']:
                            decisions[key] = d
                        continue
                    raise SystemExit(f"unparseable corrected_grams {raw!r} for {key}")
                d['grams'] = val
                if val == 0:
                    d['exclude_from_nutrition'] = True
            decisions[key] = d
    return decisions

def process(recipes, decisions=None):
    """decisions: optional {(recipe_id, sec, item): {grams, exclude_from_nutrition, note}}
    from a reviewed reviewCSV — see load_decisions(). Reviewed values override the
    computed ones and are marked qty_source='reviewed'."""
    rows = []
    updates = []
    for r in recipes:
        rid, serves, sections = r['id'], r.get('serves'), r.get('sections') or []
        ig = []
        flags = set()
        my_rows = []
        items_seen = 0
        for si, sect in enumerate(sections):
            title = (sect or {}).get('section_title') or (sect or {}).get('title')
            for ii, item in enumerate((sect or {}).get('ingredients') or []):
                items_seen += 1
                raw, grp = flatten_item(item)
                if raw is None or not raw.strip():
                    continue
                res = normalise(raw, serves)
                if res is None:
                    continue
                entry = dict(sec=si, item=ii, name=res['name'], grams=res['grams'],
                             qty_source=res['qty_source'], detail=res['detail'])
                if grp: entry['group'] = grp
                # Reviewed lines may carry exclude_from_nutrition (see
                # apply_review_decisions); the script never sets it itself.
                dec = decisions.get((rid, si, ii)) if decisions else None
                if dec:
                    if dec.get('grams') is not None:
                        entry['grams'] = dec['grams']
                        entry['qty_source'] = 'reviewed'
                        entry['detail'] = dec.get('note') or 'reviewed by hand'
                    if dec.get('exclude_from_nutrition'):
                        entry['exclude_from_nutrition'] = True
                ig.append(entry)
                if entry['qty_source'] in ('estimated','unresolved'):
                    flags.add('quantities_estimated')
                my_rows.append(dict(recipe_id=rid, section=title, sec=si, item=ii,
                                    original=raw, name=entry['name'], grams=entry['grams'],
                                    qty_source=entry['qty_source'], detail=entry['detail'],
                                    serves=serves,
                                    exclude_from_nutrition=int(bool(entry.get('exclude_from_nutrition'))),
                                    reviewed=int(bool(dec))))

        # --- skip guards -------------------------------------------------
        # A recipe that yields no usable lines must NOT be written as an empty
        # ingredient_grams array: that reads downstream as "normalised, has no
        # ingredients" and would carry a hollow recipe silently into step 3.
        # `items_seen` distinguishes the two hollow shapes for the operator:
        # sections present but every line null (the 2026-07 damage) vs no
        # ingredient data at all.
        if not ig:
            flags.add('empty_ingredients')
        # Locked plan decision 5 (§6): recipes with no `serves` are skipped, not
        # normalised, so a manual serves fill happens before any later pass.
        if serves is None:
            flags.add('serves_missing')

        skipped = sorted(flags & {'empty_ingredients', 'serves_missing'})
        for row in my_rows:
            row['skip_reason'] = '+'.join(skipped)
        rows.extend(my_rows)
        # ingredient_grams stays null for skipped recipes — the apply step writes
        # nothing for them, rather than writing an empty array.
        updates.append(dict(id=rid, ingredient_grams=(None if skipped else ig),
                            add_flags=sorted(flags), items_seen=items_seen,
                            skipped=bool(skipped)))
    return rows, updates

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dec_path = next((a.split('=',1)[1] for a in sys.argv[1:]
                     if a.startswith('--decisions=')), None)
    inp, out_csv, out_json = args[0], args[1], args[2]
    with open(inp) as f:
        recipes = json.load(f)
    decisions = load_decisions(dec_path) if dec_path else None
    if decisions:
        print(f"loaded {len(decisions)} reviewed decisions from {dec_path}")
    rows, updates = process(recipes, decisions)
    if '--review-only' in sys.argv:
        # The worklist: lines the script had to guess at that a human has not yet
        # ruled on. Same shape as quantity-review-decisions.v2.csv so a filled-in
        # sheet feeds straight back through --decisions.
        rows = [r for r in rows
                if r['qty_source'] in ('estimated', 'unresolved')
                and not r['reviewed'] and not r['skip_reason']]
        print(f"--review-only: {len(rows)} undecided lines "
              f"across {len({r['recipe_id'] for r in rows})} recipes")
    with open(out_csv, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['recipe_id','section','sec','item','original',
                                          'name','grams','qty_source','detail','serves',
                                          'exclude_from_nutrition','reviewed','skip_reason'])
        w.writeheader()
        for row in rows: w.writerow(row)
    with open(out_json, 'w') as f:
        json.dump(updates, f)
    # summary
    from collections import Counter
    c = Counter(r['qty_source'] for r in rows)
    print(f"recipes={len(updates)} lines={len(rows)}")
    for k in ['stated','converted','defaulted','to_taste','garnish','estimated','unresolved']:
        print(f"  {k:12} {c.get(k,0)}")
    flagged = sum(1 for u in updates if 'quantities_estimated' in u['add_flags'])
    print(f"recipes flagged quantities_estimated: {flagged}")

    # Skipped recipes are the ones that must never reach step 3 unnoticed.
    hollow  = [u for u in updates if 'empty_ingredients' in u['add_flags']]
    noserve = [u for u in updates if 'serves_missing' in u['add_flags']]
    print(f"\nSKIPPED (ingredient_grams left null) = {sum(1 for u in updates if u['skipped'])}")
    print(f"  empty_ingredients {len(hollow):4}  "
          f"({sum(1 for u in hollow if u['items_seen'])} with all-null lines "
          f"-> re-enter from source; {sum(1 for u in hollow if not u['items_seen'])} with no lines at all)")
    print(f"  serves_missing    {len(noserve):4}  -> manual serves fill first (plan §6 decision 5)")
    for u in hollow:
        print(f"    empty_ingredients {u['id']}  null_lines={u['items_seen']}")
    for u in noserve:
        print(f"    serves_missing    {u['id']}")
    if hollow:
        print("\nWARNING: hollow recipes found. Re-enter their ingredients from source "
              "before applying step 2 to them; nutrition (step 3) must not run on them.")

if __name__ == '__main__':
    main()

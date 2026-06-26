import fs from 'fs';
// ===== canonicalise (app-verbatim) =====
const _STOP=new Set(['fresh','organic','large','small','medium','baby','mini','leaf','leaves','whole','finely','roughly','free-range','boneless','skinless','ripe','raw','cooked','dried','frozen','chopped','sliced','diced','minced','ground','grated','crushed','peeled','cubed','halved','quartered','shredded','mashed','beaten','softened','melted','cooled','toasted','roasted','torn','julienned','thinly','thickly','coarsely','optional','approx','approximately','about','around','a','an','the','of','to','for','your','some']);
function canon(n){return (n||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9\s-]/g,'').trim().split(/\s+/).filter(w=>!_STOP.has(w)).join(' ').replace(/ies\b/g,'y').replace(/([^aeiou])es\b/g,'$1e').replace(/([^aeiou])s\b/g,'$1').trim();}
function title(s){return s.split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');}
// cleanRaw: the same cleaning the master keys were built with, so the match key aligns.
const _LEAD_MEASURE=/^(cup|cups|tbsp|tbsps|tb|tablespoons?|tsp|tsps|teaspoons?|g|kg|ml|l|litres?|oz|lbs?|grams?|cloves?|pinch|handful|scoops?|cans?|tins?|jars?|slices?|sheets?|sprigs?|sticks?|stalks?|knobs?|heads?|bulbs?|bunch|pounds?|rashers?|fillets?|punnet|ribbon|weight|packs?|packets?|bags?|tubs?|dash|splash|drizzle|each|x|heaped|heaping|rounded|level|generous|scant)$/;
const ABBR2={mayo:'mayonnaise',choc:'chocolate',tb:'tbsp'};
function cleanRaw(raw){
  let s=String(raw||'').toLowerCase();
  s=s.replace(/\([^)]*\)/g,' ').replace(/jalape[ñn\s]*o?s?/g,'jalapeno');
  s=s.split(/\s+and\/or\s+|\s+or\s+|\//)[0];
  s=s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\b/g,' ').replace(/\b\d+(\.\d+)?\s*\/\s*\d+\b/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*(kg|g|ml|l|oz|lb|tbsp|tsp|cup|cups|cm)\b/g,' ').replace(/\b\d+\s*x\b/g,' ').replace(/\b\d+(\.\d+)?\b/g,' ');
  let toks=s.replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
  while(toks.length>1 && (_LEAD_MEASURE.test(toks[0])||_STOP.has(toks[0]))) toks.shift();
  return toks.map(t=>ABBR2[t]||t).join(' ');
}
const normSpell=s=>s.replace(/yoghurt/g,'yogurt').replace(/chili\b/g,'chilli');
const ckey=n=>canon(normSpell(cleanRaw(n)));
function esc(s){s=String(s??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function readCsv(p){const t=fs.readFileSync(p,'utf8');const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c!=='\r')f+=c;}}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}
// ===== recipe line parser (heaped/cm/"A or B"/abbrev) =====
const FRAC={'½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875};
const UNITS={g:'g',gram:'g',grams:'g',kg:'kg',ml:'ml',l:'l',litre:'l',litres:'l',liter:'l',oz:'oz',lb:'lb',lbs:'lb',tbsp:'tbsp',tbsps:'tbsp',tbs:'tbsp',tb:'tbsp',tablespoon:'tbsp',tablespoons:'tbsp',tsp:'tsp',tsps:'tsp',teaspoon:'tsp',teaspoons:'tsp',cup:'cup',cups:'cup',clove:'clove',cloves:'clove',handful:'handful',pinch:'pinch',dash:'dash',scoop:'scoop',scoops:'scoop',can:'can',cans:'can',tin:'tin',slice:'slice',slices:'slice',stick:'stick',sprig:'sprig',head:'head',bunch:'bunch',knob:'knob',fillet:'fillet'};
Object.assign(UNITS,{handfuls:'handful',punnet:'punnet',punnets:'punnet',block:'block',blocks:'block',piece:'piece',pieces:'piece',knobs:'knob',sticks:'stick',sprig:'sprig',sprigs:'sprig',bag:'bag',bags:'bag',pack:'pack',packs:'pack',packet:'packet',packets:'packet',tub:'tub',tubs:'tub',bunches:'bunch',heads:'head',slices:'slice',sheet:'sheet',sheets:'sheet',scoops:'scoop',tins:'tin',jar:'jar',jars:'jar',fillets:'fillet',rasher:'rasher',rashers:'rasher',cans:'can'});
const LEAD_FILLER=new Set(['about','approx','approximately','around','roughly','a','an','little','less','than','good','nice','big','optional','optionally','maybe','some','couple','few','full','of','very','extra']);
const BARE_UNIT=new Set(['pinch','handful','dash','splash','knob']);
const PREP=new Set(['minced','chopped','diced','sliced','grated','crushed','peeled','cubed','halved','quartered','shredded','mashed','beaten','softened','melted','cooled','toasted','roasted','torn','julienned','finely','roughly','thinly','thickly','coarsely','cut','into','piece','pieces','fillet','fillets','drained','rinsed','deseeded','trimmed','divided','plus','more','crumbled','to','taste','serve','garnish','for','serving']);
const LEAD_PREP=new Set(['grated','chopped','diced','sliced','minced','crushed','mashed','shredded','finely','roughly','thinly','thickly','coarsely','peeled','cubed','crumbled','beaten','melted','toasted']);
const ABBREV={mayo:'mayonnaise',choc:'chocolate'};
function num(t){t=t.trim();let m;if(m=t.match(/^(\d+)\s+(\d+)\/(\d+)$/))return +m[1]+(+m[2])/(+m[3]);if(m=t.match(/^(\d+)\/(\d+)$/))return (+m[1])/(+m[2]);if(FRAC[t]!=null)return FRAC[t];if(/^\d+(\.\d+)?$/.test(t))return parseFloat(t);return null;}
function parseLine(raw){
  let s=String(raw||'').trim(); if(!s) return null; const notes=[];
  s=s.replace(/\(([^)]*)\)/g,(_,n)=>{if(n.trim())notes.push(n.trim());return ' ';});
  const alt=s.split(/\s+and\/or\s+|\s+or\s+/i); if(alt.length>1){s=alt[0];notes.push('or '+alt.slice(1).join(' or ').trim());}
  s=s.replace(/\b(heaped|heaping|rounded|level|generous|scant)\b/ig,(w)=>{notes.unshift(w.toLowerCase());return ' ';});
  s=s.replace(/\b(\d+(?:\.\d+)?)\s*cm\b/ig,(_,n)=>{notes.push(n+'cm piece');return ' ';});
  s=s.replace(/(\d)([½¼¾⅓⅔⅛⅜⅝⅞])/g,'$1 $2').replace(/\s+/g,' ').trim();
  // collapse a numeric range ("1/4-1/3", "2-3", "1/4 to 1/2", "16-20") to its first value
  s=s.replace(/(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)(?:\s*[-–]\s*|\s+to\s+)(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\b/i,(_,a)=>{notes.push('range');return a+' ';}).replace(/\s+/g,' ').trim();
  let words=s.split(' '); while(words.length&&LEAD_FILLER.has(words[0].toLowerCase().replace(/[^a-z]/g,'')))words.shift(); s=words.join(' ');
  let qty='',unit='',m;
  if(m=s.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)){qty=parseFloat(m[1]);s=s.slice(m[0].length).trim();notes.push('range');}
  else if(m=s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])/)){qty=num(m[1]);s=s.slice(m[0].length).trim();}
  if(qty!==''&&qty!=null) s=s.replace(/^(big|large|small|medium|heaped|heaping|generous|good|nice|level|rounded|scant)\s+/i,'').trim();
  if(qty!==''&&qty!=null){if(m=s.match(/^([a-zA-Z]+)\b\.?/)){const u=UNITS[m[1].toLowerCase()];if(u){unit=u;s=s.slice(m[0].length).trim();}}}
  else{if(m=s.match(/^([a-zA-Z]+)\b/)){const w=m[1].toLowerCase();if(BARE_UNIT.has(w)){unit=UNITS[w];qty=1;s=s.slice(m[0].length).trim();}}}
  // strip an alternate measurement after a slash: "3 tbsp / 65ml oil", "600g / 1.2 lb chicken", '1.5cm / 1/2" ginger'
  s=s.replace(/^\/\s*\d+(?:\s*[.\/]\s*\d+)?\s*(?:["a-zA-Z]+\.?)?\s*/,'').trim();
  s=s.replace(/^of\s+/i,'').trim();
  let name=s,prep=null;
  if(s.includes(',')){const p=s.split(',');name=p[0].trim();prep=p.slice(1).join(', ').trim()||null;}
  {let lw=name.split(' ');const lead=[];while(lw.length>1&&LEAD_PREP.has(lw[0].toLowerCase().replace(/[^a-z]/g,'')))lead.push(lw.shift());if(lead.length){const t=lead.join(' ');prep=prep?`${t}; ${prep}`:t;name=lw.join(' ');}}
  {let nw=name.split(' ');const tail=[];while(nw.length>1&&PREP.has(nw[nw.length-1].toLowerCase().replace(/[^a-z]/g,'')))tail.unshift(nw.pop());if(tail.length){const t=tail.join(' ');prep=prep?`${t}; ${prep}`:t;name=nw.join(' ');}}
  if(prep)notes.push(prep);
  // Recover the noun when the name is adjective-only ("fresh", "boneless", "large"):
  // the real ingredient got pushed into a prep clause or an "or …" alternative note.
  if(!canon(name)){
    const cands=[...(prep?prep.split(';'):[]), ...notes.map(x=>x.replace(/^or\s+/i,'').replace(/^(frozen|fresh|big|small|large)\s+/i,''))];
    for(const cand of cands){ const cr=cleanRaw(cand); if(cr && !_LEAD_MEASURE.test(cr) && canon(cr)){ name=cand.trim(); break; } }
  }
  name=name.split(/\s+/).map(w=>ABBREV[w.toLowerCase()]||w).join(' ').replace(/\s+/g,' ').trim();
  if(qty!==''&&qty!=null)qty=Math.round(qty*1000)/1000;
  return {qty,unit,name,note:[...new Set(notes.filter(Boolean))].join('; ')};
}
// ===== aisle classifier (for split comps / fallback) =====
const AISLE=[[/\b(yoghurt|yogurt|cheese|butter|cream|egg|milk|paneer|kefir|labneh)\b/,'Dairy & Eggs / Alt'],[/\b(chicken|beef|pork|lamb|turkey|mince|sausage|bacon|ham|salmon|tuna|cod|prawn|shrimp|fish|tofu|tempeh)\b/,'Meat & Seafood / Protein'],[/\b(bread|tortilla|pitta|pita|wrap|naan|roll|bun|sourdough|rice paper|rice cake)\b/,'Bakery'],[/\b(sauce|vinegar|mayonnaise|ketchup|mustard|soy|tamari|sriracha|miso|oil|tahini|pesto|harissa|gochujang|aminos|mirin|paste|brine)\b/,'Condiments & Sauces'],[/\b(salt|pepper|cumin|turmeric|paprika|cinnamon|nutmeg|oregano|sumac|flake|garam|curry|cayenne|chipotle|seasoning|stock|herb|thyme|rosemary|sage|bay)\b/,'Spices & Herbs'],[/\b(juice|tea|coffee|espresso|soda|wine|water)\b/,'Beverages'],[/\b(chocolate|cocoa|cacao|chip|cookie|biscuit|brownie|cake|bar|wafer)\b/,'Snacks & Confectionery'],[/\b(rice|pasta|noodle|oat|quinoa|flour|sugar|cornflour|seed|lentil|bean|chickpea|nut|almond|cashew|walnut|peanut|pecan|chia|honey|maple|coconut|sweetener|date|raisin)\b/,'Pantry / Dry Goods'],[/\b(apple|banana|berry|blueberry|raspberry|spinach|kale|tomato|onion|shallot|garlic|carrot|broccoli|cabbage|cucumber|potato|coriander|basil|parsley|mint|ginger|lemon|lime|orange|avocado|mushroom|chilli|jalapeno|pepper|daikon|radish|peas|corn|edamame)\b/,'Produce']];
function aisle(n){const s=' '+n.toLowerCase()+' ';for(const[re,a]of AISLE)if(re.test(s))return a;return 'Other';}

// ===== build maps from the edited master =====
const M=readCsv('ingredient-master.csv').slice(1).filter(r=>r.length>=6&&r[4]);
const renameMap={};            // canon(variant) -> {variant, product, category}
const fvGroup={};              // finalVariant -> {product, category, aliases:Set, occ}
function regFinal(fv,product,category,occ){ if(!fvGroup[fv]) fvGroup[fv]={product,category:category||aisle(fv),aliases:new Set(),occ:0}; const g=fvGroup[fv]; if(product&&!g.product)g.product=product; g.occ+=(occ||0); return g; }
for(const r of M){
  const category=r[1], product=(r[3]||r[2]||'').trim(), variant=r[4], vch=(r[5]||'').trim(), occ=+(r[6]||0);
  const fv=title((vch||variant).trim());
  const k=ckey(variant);
  if(!renameMap[k]) renameMap[k]={variant:fv,product,category};
  const g=regFinal(fv,product,category,occ);
  const ka=ckey(variant); if(ka && ka!==ckey(fv)) g.aliases.add(ka);
}
// ===== splits =====
const SP=readCsv('split-plan.csv').slice(1).filter(r=>r[0]); const sh={action:0,variant:1,proposed_result:2};
const splitMap={}, renameSimple={};
for(const r of SP){const act=r[0],v=r[1],res=r[2];const k=canon(v);if(act==='SPLIT')splitMap[k]=res.split('|').map(s=>s.trim()).filter(Boolean);else if(act==='RENAME'||act.startsWith('KEEP'))renameSimple[k]=res.trim();}
function pepper(name){const n=canon(name);if(/\bpepper\b/.test(n)&&/(black|cracked|coarse|ground)/.test(n)&&!/(white|bell|red|green|cayenne|chilli|chili|chipotle|aleppo|lemon)/.test(n))return 'Black Pepper';return null;}
// resolve a single ingredient name -> finalVariant (+register price entry)
function resolve(name){
  const k=ckey(name), c=canon(name);
  if(renameMap[k]) return renameMap[k].variant;
  if(renameMap[c]) return renameMap[c].variant;
  if(renameSimple[c]||renameSimple[k]) { const fv=title(renameSimple[c]||renameSimple[k]); regFinal(fv,'', aisle(fv),0); return fv; }
  const p=pepper(name); if(p){ regFinal(p,'Pepper',aisle(p),0); return p; }
  const fv=title(cleanRaw(name)||name); regFinal(fv,'',aisle(fv),0); return fv;
}

// ===== regenerate recipe worksheet =====
const R=readCsv('recipe-ingredient-normalisation.csv'); const ci=Object.fromEntries(R[0].map((h,i)=>[h.trim(),i]));
const head=['row_key','recipe_name','section','original_line','qty','unit','ingredient','note','review'];
const out=[head.join(',')];
let nLines=0,nSplit=0,nNull=0,matched=0;
for(const r of R.slice(1)){
  const rk=r[ci.row_key],rec=r[ci.recipe_name],sec=r[ci.section],orig=r[ci.original_line];
  if(!orig){ nNull++; out.push([esc(rk),esc(rec),esc(sec),'','','','','','NULL_LINE re-enter'].join(',')); continue; }
  const p=parseLine(orig); if(!p||!p.name){ out.push([esc(rk),esc(rec),esc(sec),esc(orig),'','','','','review-parse'].join(',')); continue; }
  nLines++;
  const sk=canon(p.name);
  if(splitMap[sk]){
    nSplit++;
    splitMap[sk].forEach((c,idx)=>{
      const fv=resolve(c); const g=fvGroup[fv]; if(g) g.occ++;
      out.push([esc(rk+(idx?'-'+(idx+1):'')),esc(rec),esc(sec),esc(orig),idx?'':esc(p.qty),idx?'':esc(p.unit),esc(fv),esc(idx?(p.note?p.note+'; ':'')+'(split — set qty)':p.note),'split'].join(','));
    });
    continue;
  }
  const fv=resolve(p.name); if(renameMap[ckey(p.name)]||renameMap[sk])matched++; const g=fvGroup[fv]; if(g)g.occ++;
  out.push([esc(rk),esc(rec),esc(sec),esc(orig),esc(p.qty),esc(p.unit),esc(fv),esc(p.note),renameMap[ckey(p.name)]||renameMap[sk]?'':'unmatched'].join(','));
}
fs.writeFileSync('recipe-ingredient-normalisation.final.csv',out.join('\n')+'\n');

// ===== price book CSV (one row per final variant) =====
const ph=['Ingredient','Product','Category','Pack size (qty)','Pack unit (g / ml / each)','Pack price (£)','Store','Aliases','occurrences'];
const pout=[ph.join(',')];
// Preserve any already-filled prices (Pack size/unit/price/Store) from a prior
// pricebook.variants.csv so regenerating never wipes manual fills. Keyed by Ingredient.
const priorPrice={};
if(fs.existsSync('pricebook.variants.csv')){
  const pv=readCsv('pricebook.variants.csv'); const hi=Object.fromEntries((pv[0]||[]).map((h,i)=>[h.trim(),i]));
  for(const r of pv.slice(1)){ const ing=r[hi['Ingredient']]; if(ing&&(r[hi['Pack price (£)']]||r[hi['Pack size (qty)']])) priorPrice[ing]={size:r[hi['Pack size (qty)']]||'',unit:r[hi['Pack unit (g / ml / each)']]||'',price:r[hi['Pack price (£)']]||'',store:r[hi['Store']]||''}; }
}
const fvs=Object.keys(fvGroup).sort((a,b)=>fvGroup[b].occ-fvGroup[a].occ||a.localeCompare(b));
let carried=0;
for(const fv of fvs){const g=fvGroup[fv];const pp=priorPrice[fv]||{size:'',unit:'',price:'',store:''};if(pp.price)carried++;pout.push([esc(fv),esc(g.product||''),esc(g.category||''),esc(pp.size),esc(pp.unit),esc(pp.price),esc(pp.store),esc([...g.aliases].sort().join(';')),g.occ].join(','));}
console.log('carried-over prices:',carried);
// NOTE: output is `pricebook.variants.csv` (one row per normalised variant), NOT
// `pricebook.csv` — the latter belongs to the separate Apify scraper stream and
// must not be clobbered. The variant sheet is the canonical app-facing price book.
fs.writeFileSync('pricebook.variants.csv',pout.join('\n')+'\n');

console.log('recipe lines:',nLines,'| splits:',nSplit,'| null:',nNull,'| matched-to-master:',matched);
console.log('price book variants:',fvs.length);
console.log('\nsample final recipe lines:');
let sh2=0;for(const r of out.slice(1)){const c=r.split(',');if(sh2>=8)break;if(c[6]&&c[3]){console.log(`  "${c[3].replace(/^"|"$/g,'').slice(0,32)}" -> ${c[6].replace(/^"|"$/g,'')} (q=${c[4]||'-'} ${c[5]||''})`);sh2++;}}
console.log('\nsample price rows (ingredient | product | category | aliases):');
for(const fv of fvs.slice(0,12)){const g=fvGroup[fv];console.log(`  ${fv} | ${g.product||'-'} | ${g.category} | ${[...g.aliases].slice(0,3).join(', ')}`);}

import fs from 'fs';

// ── canonicalise + _STOP_ADJ (app-verbatim) ──
const _STOP_ADJ=new Set(['fresh','organic','large','small','medium','baby','whole','finely','roughly','free-range',
 'boneless','skinless','ripe','raw','cooked','dried','frozen','chopped','sliced','diced','minced','ground','grated',
 'crushed','peeled','cubed','halved','quartered','shredded','mashed','beaten','softened','melted','cooled','toasted',
 'roasted','torn','julienned','thinly','thickly','coarsely','optional','approx','approximately','about','around',
 'a','an','the','of','to','for','your','some']);
function canonicalise(name){
  return (name||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9\s-]/g,'').trim()
    .split(/\s+/).filter(w=>!_STOP_ADJ.has(w)).join(' ')
    .replace(/ies\b/g,'y').replace(/([^aeiou])es\b/g,'$1e').replace(/([^aeiou])s\b/g,'$1').trim();
}
function esc(s){s=String(s??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function readCsv(path){
  const text=fs.readFileSync(path,'utf8'); const rows=[]; let f='',row=[],q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false;} else f+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(f);f='';} else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';} else if(c!=='\r')f+=c; } }
  if(f!==''||row.length){row.push(f);rows.push(row);}
  const head=rows[0].map(h=>h.trim());
  return rows.slice(1).filter(r=>r.length>1).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]??'').trim()])));
}

// ── build rename + alias maps from the approved consolidation worksheet ──
const cons=readCsv('ingredient-consolidation.csv');
const byCluster={};
for(const r of cons){ (byCluster[r.cluster_id] ||= []).push(r); }
const renameMap={};          // canonicalise(variant) -> Canonical Title  (rewrite clusters only)
const aliasGroups={};        // Canonical Title -> Set(alias canon keys)
for(const id in byCluster){
  const rows=byCluster[id];
  const primary=rows.find(r=>r.reason==='canonical')||rows[0];
  const canonical=primary.suggested_canonical;
  const rewrite=primary.rewrite_recipes==='yes';
  const canonKey=canonicalise(canonical);
  for(const r of rows){
    if(r.decision!=='merge') continue;          // skip review / keep-separate
    const vk=canonicalise(r.variant);
    if(vk && vk!==canonKey){ (aliasGroups[canonical] ||= new Set()).add(vk); }
    if(rewrite){ renameMap[vk]=canonical; }
  }
}

// ── recipe line parser with heaped/cm/"A or B"/abbrev handling ──
const FRAC={'½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875};
const UNITS={g:'g',gram:'g',grams:'g',kg:'kg',ml:'ml',l:'l',litre:'l',litres:'l',liter:'l',floz:'fl oz',oz:'oz',
 ounce:'oz',ounces:'oz',lb:'lb',lbs:'lb',tbsp:'tbsp',tbsps:'tbsp',tbs:'tbsp',tb:'tbsp',tablespoon:'tbsp',tablespoons:'tbsp',
 tsp:'tsp',tsps:'tsp',teaspoon:'tsp',teaspoons:'tsp',cup:'cup',cups:'cup',clove:'clove',cloves:'clove',handful:'handful',
 pinch:'pinch',dash:'dash',scoop:'scoop',scoops:'scoop',can:'can',cans:'can',tin:'tin',slice:'slice',slices:'slice',
 stick:'stick',sprig:'sprig',head:'head',bunch:'bunch',stalk:'stalk',knob:'knob',sheet:'sheet',fillet:'fillet'};
const LEAD_FILLER=new Set(['about','approx','approximately','around','roughly','a','an','little','less','than','generously',
 'good','nice','big','optional','optionally','maybe','some','couple','few','full','of']);
const BARE_UNIT=new Set(['pinch','handful','dash','splash','knob']);
const PREP=new Set(['minced','chopped','diced','sliced','grated','crushed','peeled','cubed','halved','quartered','shredded',
 'mashed','beaten','softened','melted','cooled','toasted','roasted','torn','julienned','finely','roughly','thinly','thickly',
 'coarsely','cut','into','pieces','drained','rinsed','deseeded','trimmed','divided','plus','more','crumbled','to','taste','serve','garnish','for','serving']);
const LEAD_PREP=new Set(['grated','chopped','diced','sliced','minced','crushed','mashed','shredded','finely','roughly','thinly','thickly','coarsely','peeled','cubed','crumbled','beaten','melted','toasted']);
const ABBREV={mayo:'mayonnaise',choc:'chocolate'};
function num(t){t=t.trim();let m;if(m=t.match(/^(\d+)\s+(\d+)\/(\d+)$/))return +m[1]+(+m[2])/(+m[3]);
  if(m=t.match(/^(\d+)\/(\d+)$/))return (+m[1])/(+m[2]);if(FRAC[t]!=null)return FRAC[t];
  if(/^\d+(\.\d+)?$/.test(t))return parseFloat(t);return null;}
function parseLine(raw){
  let s=String(raw||'').trim(); if(!s) return null;
  const notes=[];
  s=s.replace(/\(([^)]*)\)/g,(_,n)=>{if(n.trim())notes.push(n.trim());return ' ';});
  const alt=s.split(/\s+and\/or\s+|\s+or\s+/i);
  if(alt.length>1){ s=alt[0]; notes.push('or '+alt.slice(1).join(' or ').trim()); }
  s=s.replace(/\b(heaped|heaping|rounded|level|generous|scant)\b/ig,(w)=>{notes.unshift(w.toLowerCase());return ' ';});
  s=s.replace(/\b(\d+(?:\.\d+)?)\s*cm\b/ig,(_,n)=>{notes.push(n+'cm piece');return ' ';});
  s=s.replace(/(\d)([½¼¾⅓⅔⅛⅜⅝⅞])/g,'$1 $2').replace(/\s+/g,' ').trim();
  let words=s.split(' ');
  while(words.length && LEAD_FILLER.has(words[0].toLowerCase().replace(/[^a-z]/g,''))) words.shift();
  s=words.join(' ');
  let qty='',unit='',range=false,m;
  if(m=s.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)){qty=parseFloat(m[1]);range=true;s=s.slice(m[0].length).trim();}
  else if(m=s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])/)){qty=num(m[1]);s=s.slice(m[0].length).trim();}
  if(qty!==''&&qty!=null){ if(m=s.match(/^([a-zA-Z]+)\b\.?/)){const u=UNITS[m[1].toLowerCase()];if(u){unit=u;s=s.slice(m[0].length).trim();}} }
  else { if(m=s.match(/^([a-zA-Z]+)\b/)){const w=m[1].toLowerCase();if(BARE_UNIT.has(w)){unit=UNITS[w];qty=1;s=s.slice(m[0].length).trim();}} }
  s=s.replace(/^of\s+/i,'').trim();
  let name=s,prep=null;
  if(s.includes(',')){const p=s.split(',');name=p[0].trim();prep=p.slice(1).join(', ').trim()||null;}
  { let lw=name.split(' '); const lead=[];
    while(lw.length>1 && LEAD_PREP.has(lw[0].toLowerCase().replace(/[^a-z]/g,''))) lead.push(lw.shift());
    if(lead.length){const t=lead.join(' ');prep=prep?`${t}; ${prep}`:t;name=lw.join(' ');} }
  { let nw=name.split(' '); const tail=[];
    while(nw.length>1 && PREP.has(nw[nw.length-1].toLowerCase().replace(/[^a-z]/g,''))) tail.unshift(nw.pop());
    if(tail.length){const t=tail.join(' ');prep=prep?`${t}; ${prep}`:t;name=nw.join(' ');} }
  if(prep) notes.push(prep);
  // abbreviation expansion on the name
  name=name.split(/\s+/).map(w=>ABBREV[w.toLowerCase()]||w).join(' ').replace(/\s+/g,' ').trim();
  if(range) notes.push('range');
  if(qty!=='' && qty!=null) qty=Math.round(qty*1000)/1000;
  return {qty,unit,name,note:[...new Set(notes.filter(Boolean))].join('; ')};
}
function titleCase(s){return s.split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');}

// ── regenerate recipe worksheet (canonical names applied) ──
const recipe=readCsv('recipe-ingredient-normalisation.csv');
const outHead=['row_key','recipe_name','section','original_line','qty','unit','ingredient','note','review'];
const out=[outHead.join(',')];
let renamed=0,reparsed=0,nullLines=0;
for(const r of recipe){
  if(!r.original_line){ nullLines++; out.push([esc(r.row_key),esc(r.recipe_name),esc(r.section),'','','','','','NULL_LINE re-enter'].join(',')); continue; }
  const p=parseLine(r.original_line);
  let ingredient=p.name, flag=[];
  const key=canonicalise(p.name);
  if(renameMap[key] && renameMap[key]!==titleCase(p.name)){ ingredient=renameMap[key]; renamed++; flag.push('renamed'); }
  else ingredient=titleCase(p.name);
  if(p.note) { reparsed++; if(/heaped|rounded|level|generous|cm|^or |; or /.test(p.note)) flag.push('note'); }
  out.push([esc(r.row_key),esc(r.recipe_name),esc(r.section),esc(r.original_line),esc(p.qty),esc(p.unit),esc(ingredient),esc(p.note),esc(flag.join('|'))].join(','));
}
fs.writeFileSync('recipe-ingredient-normalisation.consolidated.csv',out.join('\n')+'\n');

// ── emit collapsed price-book aliases sheet ──
const priceRows=readCsv('missing-ingredient-prices.csv');
const priceByName={}; for(const r of priceRows) priceByName[canonicalise(r.Ingredient)]=r;
const aHead=['Ingredient','Pack size (qty)','Pack unit (g / ml / each)','Pack price (£)','Store','Aliases'];
const aOut=[aHead.join(',')];
const canons=Object.keys(aliasGroups).sort();
for(const canonical of canons){
  const aliases=[...aliasGroups[canonical]].sort();
  if(!aliases.length) continue;
  const ex=priceByName[canonicalise(canonical)]||{};
  aOut.push([esc(canonical),esc(ex['Pack size (qty)']||''),esc(ex['Pack unit (g / ml / each)']||''),esc(ex['Pack price (£)']||''),esc(ex['Store']||''),esc(aliases.join(';'))].join(','));
}
fs.writeFileSync('pricebook-aliases.csv',aOut.join('\n')+'\n');

console.log('recipe rows:',recipe.length,'| renamed to canonical:',renamed,'| null:',nullLines);
console.log('alias clusters:',canons.length,'| total aliases:',Object.values(aliasGroups).reduce((s,x)=>s+x.size,0));
console.log('\nSample renamed recipe lines:');
let shown=0;
for(const r of recipe){ if(shown>=12||!r.original_line) continue; const p=parseLine(r.original_line); const k=canonicalise(p.name);
  if(renameMap[k]){ console.log(`  "${r.original_line}"  ->  q=${p.qty} u=${p.unit||'-'} | ${renameMap[k]} | note: ${p.note||'-'}`); shown++; } }
console.log('\nSample alias rows:');
for(const c of canons.slice(0,10)) console.log(`  ${c}  ⇐  ${[...aliasGroups[c]].join('; ')}`);

import fs from 'fs';

// ── app canonicalise() + _STOP_ADJ, ported verbatim (index.html ~2571/2676) ──
const _STOP_ADJ = new Set(['fresh','organic','large','small','medium','baby','whole','finely','roughly',
 'free-range','boneless','skinless','ripe','raw','cooked','dried','frozen','chopped','sliced','diced','minced',
 'ground','grated','crushed','peeled','cubed','halved','quartered','shredded','mashed','beaten','softened','melted',
 'cooled','toasted','roasted','torn','julienned','thinly','thickly','coarsely','optional','approx','approximately',
 'about','around','a','an','the','of','to','for','your','some']);
function canonicalise(name){
  return (name||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9\s-]/g,'').trim()
    .split(/\s+/).filter(w=>!_STOP_ADJ.has(w)).join(' ')
    .replace(/ies\b/g,'y').replace(/([^aeiou])es\b/g,'$1e').replace(/([^aeiou])s\b/g,'$1').trim();
}

// ── price-book seed keys (index.html ~1267) ──
const PB_KEYS = new Set(['chicken mince','egg white','egg','turkey mince','chicken','spring onion','butternut squash',
 'apple','avocado','date','sweet potato','potato','beansprout','onion','broccoli','mushroom','coriander','basil','ginger',
 'lime','blueberry','raspberry','broccoli cauliflower','soya yogurt','soya milk','vegan cheese','sriracha','mayo','ketchup',
 'pesto','chilli sauce','dark chocolate','cocoa powder','protein pasta','spaghetti','vegan protein powder',
 'peanut butter powder','chocolate peanut butter powder']);

// ── reduction sets ──
// Multi-word synonyms first, then single-word. UK-default direction.
const SYN_PHRASE = [
  ['green onion','spring onion'],['spring onions','spring onion'],['all purpose flour','plain flour'],
  ['all-purpose flour','plain flour'],['confectioners sugar','icing sugar'],['powdered sugar','icing sugar'],
  ['baking soda','bicarbonate of soda'],['bicarb','bicarbonate of soda'],['caster sugar','caster sugar'],
];
const SYN_WORD = { cilantro:'coriander', zucchini:'courgette', eggplant:'aubergine', shrimp:'prawn',
  shrimps:'prawn', scallion:'spring onion', scallions:'spring onion', cornstarch:'cornflour',
  garbanzo:'chickpea', yoghurt:'yogurt', yogurt:'yogurt' };
// container/measure words — strip when other tokens remain (reveals the ingredient)
const CONTAINER = new Set(['clove','cloves','head','heads','bulb','bulbs','sprig','sprigs','stalk','stalks',
 'stick','sticks','can','cans','tin','tins','jar','jars','bunch','bunches','handful','handfuls','slice','slices',
 'fillet','fillets','knob','knobs','piece','pieces','sheet','sheets','rasher','rashers','punnet','block','blocks',
 'packet','packets','pack','packs','bag','bags','tub','tubs','pinch','pinches','dash','scoop','scoops','splash',
 // measure-word parse artifacts leaked into some names ("cup rice", "tbsp tahini")
 'cup','cups','tbsp','tbsps','tablespoon','tablespoons','tsp','tsps','teaspoon','teaspoons',
 'g','kg','ml','l','litre','litres','oz','lb','lbs','gram','grams']);
// price-neutral qualifiers — safe to strip (one product/price)
const QUAL_SAFE = new Set(['low','reduced','sodium','salt-reduced','plain','thick','thin','nonfat',
 'non-fat','fat-free','low-fat','full-fat','reduced-fat','semi','semi-skimmed','skimmed','0','unsalted','salted',
 'smooth','crunchy','mild','runny','natural','greek-style','low-sodium','reduced-sodium','low-salt']);
// qualifiers that often DO change product/price (dark/light choc, dark/light brown sugar) —
// propose the merge but flag for review rather than auto-merging.
const QUAL_REVIEW = new Set(['light','dark']);
// colour qualifiers — propose merge but flag REVIEW (red onion ≠ onion price) unless the variant is a bell pepper.
const QUAL_COLOUR = new Set(['red','green','yellow','purple','white']);
// protected family heads — never strip a leading variety token into these
const PROTECTED = new Set(['rice','oil','vinegar','flour','sugar','lentil','bean','mushroom','cheese','milk','sauce','paste','stock']);

function applySynonyms(s){
  let out=' '+s+' ';
  for(const [a,b] of SYN_PHRASE) out=out.split(' '+a+' ').join(' '+b+' ');
  out=out.trim().split(/\s+/).map(w=>SYN_WORD[w]||w).join(' ');
  return out;
}
// returns {reduced, joins:[{token,type}]}
function reduce(canon){
  let s=applySynonyms(canon);
  let toks=s.split(/\s+/).filter(Boolean);
  const head=toks[toks.length-1];
  const joins=[];
  const kept=[];
  for(let i=0;i<toks.length;i++){
    const t=toks[i];
    const isLast=(i===toks.length-1);
    if(!isLast && CONTAINER.has(t)){ joins.push({token:t,type:'container'}); continue; }
    if(QUAL_SAFE.has(t)){ joins.push({token:t,type:'qualifier'}); continue; }
    if(QUAL_REVIEW.has(t)){ joins.push({token:t,type:'qual-review'}); continue; }
    // colour only strips as a LEADING qualifier (red onion), never as the head noun (egg white, egg yolk)
    if(!isLast && QUAL_COLOUR.has(t)){ joins.push({token:t,type:'colour'}); continue; }
    kept.push(t);
  }
  let reducedToks = kept.length?kept:toks; // never reduce to empty
  // protected-family guard: if head is protected and a NON-strippable leading variety token remains,
  // the reduced form keeps it (so jasmine rice != rice) — already true since we only stripped qual/container.
  const reduced = [...reducedToks].sort().join(' ');
  const reducedNatural = reducedToks.join(' ');
  const synUsed = s!==canon;
  if(synUsed) joins.push({token:`${canon}→${s}`,type:'synonym'});
  return {reduced, reducedNatural, head, joins, synUsed};
}

function parseCsvCol(path, colName){
  const text=fs.readFileSync(path,'utf8');
  // simple parse reusing quote handling
  const rows=[]; let f='',row=[],q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false;} else f+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(f);f='';} else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';} else if(c!=='\r')f+=c; } }
  if(f!==''||row.length){row.push(f);rows.push(row);}
  const head=rows[0].map(h=>h.trim()); const ci=head.indexOf(colName);
  return rows.slice(1).map(r=>(r[ci]??'').trim());
}

// ── build vocabulary: canonical -> {occ, inPb, raw display} ──
const _LEAD_MEASURE=/^(cup|cups|tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|g|kg|ml|l|litres?|oz|lbs?|grams?|cloves?|pinch|handful|scoops?|cans?|tins?|jars?|slices?|sprigs?|sticks?|knobs?|heads?|bulbs?|bunch|packs?|packets?|bags?|tubs?|dash|splash|each)$/;
function cleanRaw(raw){
  let s=String(raw||'').toLowerCase();
  s=s.replace(/\([^)]*\)/g,' ');
  s=s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\b/g,' ');     // ranges
  s=s.replace(/\b\d+(\.\d+)?\s*\/\s*\d+\b/g,' ');                // fractions
  s=s.replace(/\b\d+(\.\d+)?\s*(kg|g|ml|l|oz|lb|tbsp|tsp|cup|cups)\b/g,' '); // glued qty+unit
  s=s.replace(/\b\d+(\.\d+)?\b/g,' ');                           // bare numbers
  let toks=s.replace(/[^a-z\s-]/g,' ').split(/\s+/).filter(Boolean);
  while(toks.length>1 && (_LEAD_MEASURE.test(toks[0]) || _STOP_ADJ.has(toks[0]))) toks.shift();
  return toks.join(' ');
}
const vocab=new Map();
function add(raw, occ, fromPb){
  const c=canonicalise(cleanRaw(raw));
  if(!c || c.length<2) return;
  if(!vocab.has(c)) vocab.set(c,{canon:c,occ:0,inPb:false});
  const v=vocab.get(c); v.occ+=occ; if(fromPb) v.inPb=true;
}
for(const ing of parseCsvCol('recipe-ingredient-normalisation.csv','ingredient')) if(ing) add(ing,1,false);
for(const ing of parseCsvCol('missing-ingredient-prices.csv','Ingredient')) if(ing) add(ing,0,false);
for(const k of PB_KEYS) add(k,0,true);

// ── cluster by reduced key ──
const clusters=new Map(); // reducedKey -> [members]
for(const v of vocab.values()){
  const r=reduce(v.canon);
  v._r=r;
  if(!clusters.has(r.reduced)) clusters.set(r.reduced,[]);
  clusters.get(r.reduced).push(v);
}

// keep only clusters with >=2 distinct members (real consolidation opportunities)
let clusterList=[...clusters.entries()].filter(([k,m])=>m.length>=2).map(([reduced,members])=>{
  // suggested canonical: prefer a member equal to reducedNatural; else fewest tokens then highest occ
  const bySimplicity=[...members].sort((a,b)=> a.canon.split(' ').length-b.canon.split(' ').length || b.occ-a.occ || a.canon.localeCompare(b.canon));
  const natural=members[0]._r.reducedNatural;
  const exact=members.find(m=>m.canon===natural);
  const canonical=(exact||bySimplicity[0]).canon;
  const totalOcc=members.reduce((s,m)=>s+m.occ,0);
  return {reduced, canonical, members, totalOcc};
});
clusterList.sort((a,b)=> b.totalOcc-a.totalOcc || b.members.length-a.members.length || a.canonical.localeCompare(b.canonical));

// ── emit worksheet ──
function titleCase(s){return s.split(' ').filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');}
function esc(s){s=String(s??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
const header=['cluster_id','suggested_canonical','variant','occurrences','in_pricebook','reason','decision','rewrite_recipes'];
const out=[header.join(',')];
let cid=0, mergeRows=0, reviewRows=0;
for(const cl of clusterList){
  cid++;
  // order members: canonical first, then occ desc
  const members=[...cl.members].sort((a,b)=> (b.canon===cl.canonical?0:1)-(a.canon===cl.canonical?0:1) || b.occ-a.occ || a.canon.localeCompare(b.canon));
  // cluster-level rewrite default: 'yes' only if every non-canonical member joined trivially (container/synonym/qualifier-none)
  let allTrivial=true;
  for(const m of members){
    if(m.canon===cl.canonical) continue;
    const types=new Set(m._r.joins.map(j=>j.type));
    if(types.has('qualifier')||types.has('colour')||types.has('qual-review')) allTrivial=false;
  }
  const rewriteDefault = allTrivial ? 'yes' : 'no';
  for(const m of members){
    const isCanon=m.canon===cl.canonical;
    let reason, decision;
    if(isCanon){ reason='canonical'; decision='merge'; }
    else {
      const types=m._r.joins;
      const parts=types.map(j=> j.type==='synonym'?`synonym:${j.token}`
        : j.type==='container'?`container:${j.token}`
        : j.type==='colour'?`colour:${j.token}`
        : j.type==='qual-review'?`qualifier?:${j.token}`
        : `qualifier:${j.token}`);
      const anyCol = types.some(j=>j.type==='colour');
      const colourOk = anyCol && m.canon.includes('bell'); // only bell peppers auto-merge on colour
      const anyQualReview = types.some(j=>j.type==='qual-review');
      if((anyCol && !colourOk) || anyQualReview){ decision='review'; parts.push(anyCol?'REVIEW:colour':'REVIEW:dark/light'); }
      else decision='merge';
      reason=parts.join(' | ')||'variant';
    }
    if(decision==='merge') mergeRows++; else reviewRows++;
    out.push([cid, esc(titleCase(cl.canonical)), esc(m.canon), m.occ, m.inPb?'yes':'no', esc(reason), decision, isCanon?rewriteDefault:''].join(','));
  }
}
fs.writeFileSync('ingredient-consolidation.csv', out.join('\n')+'\n');
console.log('vocab terms:',vocab.size);
console.log('clusters (>=2):',clusterList.length,'| rows:',out.length-1,'| merge:',mergeRows,'| review:',reviewRows);
console.log('\nTop 25 clusters:');
for(const cl of clusterList.slice(0,25)) console.log(`  [${cl.members.length}] ${titleCase(cl.canonical)}  ←  ${cl.members.filter(m=>m.canon!==cl.canonical).map(m=>m.canon).join(', ')}`);

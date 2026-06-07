import fs from 'fs';

// ── app canonicalise() + _STOP_ADJ (verbatim) ──
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
const PB_KEYS = new Set(['chicken mince','egg white','egg','turkey mince','chicken','spring onion','butternut squash',
 'apple','avocado','date','sweet potato','potato','beansprout','onion','broccoli','mushroom','coriander','basil','ginger',
 'lime','blueberry','raspberry','broccoli cauliflower','soya yogurt','soya milk','vegan cheese','sriracha','mayo','ketchup',
 'pesto','chilli sauce','dark chocolate','cocoa powder','protein pasta','spaghetti','vegan protein powder',
 'peanut butter powder','chocolate peanut butter powder']);

// ── raw cleaning: drop qty/measure/parenthetical, expand abbrevs, take first "A or B" ──
const _LEAD_MEASURE=/^(cup|cups|tbsp|tbsps|tb|tablespoons?|tsp|tsps|teaspoons?|g|kg|ml|l|litres?|oz|lbs?|grams?|cloves?|pinch|handful|scoops?|cans?|tins?|jars?|slices?|sprigs?|sticks?|knobs?|heads?|bulbs?|bunch|packs?|packets?|bags?|tubs?|dash|splash|drizzle|each|x|heaped|heaping|rounded|level|generous|scant)$/;
const ABBREV={ mayo:'mayonnaise', choc:'chocolate', tb:'tbsp' };
function cleanRaw(raw){
  let s=String(raw||'').toLowerCase();
  s=s.replace(/\([^)]*\)/g,' ');
  s=s.replace(/jalape[ñn\s]*o?s?/g,'jalapeno');   // normalise jalapeño/jalapenos/"jalape o"
  // take first alternative of "A or B" / "A and/or B" / "A/B"
  s=s.split(/\s+and\/or\s+|\s+or\s+|\//)[0];
  s=s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\b/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*\/\s*\d+\b/g,' ');
  s=s.replace(/\b\d+(\.\d+)?\s*(kg|g|ml|l|oz|lb|tbsp|tsp|cup|cups|cm)\b/g,' ');
  s=s.replace(/\b\d+\s*x\b/g,' ');                 // "2x" multiplier remnant
  s=s.replace(/\b\d+(\.\d+)?\b/g,' ');
  let toks=s.replace(/[^a-z\s-]/g,' ').split(/\s+/).filter(Boolean);
  while(toks.length>1 && (_LEAD_MEASURE.test(toks[0])||_STOP_ADJ.has(toks[0]))) toks.shift();
  toks=toks.map(t=>ABBREV[t]||t);
  return toks.join(' ');
}
function titleCase(s){return s.split(' ').filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');}
// spelling normalisation for matching only
function norm(v){return v.replace(/yoghurt/g,'yogurt').replace(/chili/g,'chilli');}
function toks(v){return new Set(norm(v).split(' ').filter(Boolean));}
const has=(S,...w)=>w.some(x=>S.has(x));
const hasAll=(S,...w)=>w.every(x=>S.has(x));
const VEGAN=/(vegan|dairy-free|dairy free|plant based|plant-based)/;

// tokens that may appear ALONGSIDE a rule's defining tokens without changing identity
const TRIVIAL=new Set(['clove','cloves','head','heads','bulb','bulbs','sprig','sprigs','stalk','stalks','stick','sticks',
 'can','cans','tin','tins','jar','jars','bunch','bunches','handful','handfuls','knob','knobs','piece','pieces','sheet','sheets',
 'punnet','block','blocks','packet','packets','pack','packs','bag','bags','tub','tubs','pinch','dash','scoop','scoops','splash',
 'fillet','fillets','slice','slices','fresh','freshly','raw','cooked','peeled','deveined','minced','chopped','grated','crushed',
 'sliced','diced','mashed','wild','caught','jumbo','pink','king','tiger','baby','large','small','medium','extra','and','for',
 'frying','serving','room','temperature','thumb','size','cm','inch','root','of','from','half','squeezed','pure','clear',
 'unsweetened','additional','high','quality','so','or']);
// rule maps only if every token is a defining token (heads), trivial, or in `allow`
function cleanMap(T, heads, canonical, rewrite, allow, note){
  if(![...heads].some(h=>T.has(h))) return null;
  const ok=new Set([...heads,...TRIVIAL,...(allow||[])]);
  for(const t of T) if(!ok.has(t)) return null;
  return {canonical,rewrite,note};
}

// ── explicit decision rules: variant(canonicalised) -> {canonical, rewrite, note} | null ──
function classify(v){
  const n=norm(v); const T=toks(v);
  const veg = VEGAN.test(v);

  // MAYONNAISE / light mayo (only bare/light; flavoured e.g. sriracha/kewpie stay distinct)
  if(has(T,'mayo','mayonnaise')){
    if(veg) return null;
    if(has(T,'light','lowfat')||/low fat|low-fat/.test(n)) return cleanMap(T,new Set(['mayo','mayonnaise']),'Light Mayonnaise',true,['light','lowfat']);
    return cleanMap(T,new Set(['mayo','mayonnaise']),'Mayonnaise',true,[]);
  }
  // CREAM CHEESE — light/low-fat/reduced-fat = Light Cream Cheese; full-fat/plain = Cream Cheese
  if(hasAll(T,'cream','cheese')){
    if(has(T,'light','lowfat')||/low fat|low-fat|reduced fat|reduced-fat/.test(n)) return cleanMap(T,new Set(['cream','cheese']),'Light Cream Cheese',true,['light','lowfat','low-fat','reduced','reduced-fat','fat']);
    return cleanMap(T,new Set(['cream','cheese']),'Cream Cheese',false,['full','fat','full-fat']);
  }
  // COCONUT MILK — low-fat/full-fat/light all fall under Coconut Milk
  if(hasAll(T,'coconut','milk')) return cleanMap(T,new Set(['coconut','milk']),'Coconut Milk',true,['light','low','full','fat','low-fat','full-fat','reduced']);
  // YOGHURT family
  if(has(T,'yogurt')){
    if(has(T,'coconut')) return {canonical:'Coconut Yoghurt',rewrite:true};
    if(has(T,'soya','soy')) return {canonical:'Soya Yoghurt',rewrite:false};
    if(has(T,'vanilla','protein','kefir','nush')||veg) return null; // flavoured/other = distinct
    if(has(T,'greek','thick','strained','labneh')) return {canonical:'Greek Yoghurt',rewrite:true,note:'dairy-free sub OK'};
    return {canonical:'Plain Yoghurt',rewrite:true}; // bare / plain / low-fat / plain full-fat
  }
  // ONION
  if(has(T,'onion')){
    if(has(T,'powder')) return null;
    if(has(T,'spring','scallion')||/green onion/.test(n)) return cleanMap(T,new Set(['onion','spring','scallion','green']),'Spring Onion',true,['green','spring','scallion','greens','stem','stems']);
    if(has(T,'pickled','crispy','fried','red')) return null; // red/pickled/crispy distinct
    if(has(T,'yellow','white','brown')||[...T].filter(x=>x!=='onion').length===0)
      return cleanMap(T,new Set(['onion']),'Yellow Onion',true,['yellow','white','brown']);
    return null;
  }
  // CABBAGE — bare -> White Cabbage; colours distinct
  if(has(T,'cabbage')){
    if([...T].filter(x=>x!=='cabbage').length===0) return {canonical:'White Cabbage',rewrite:true};
    return null;
  }
  // OILS — only neutral/cooking/vegetable/plain/drizzle; named oils distinct
  if(has(T,'oil')){
    if(has(T,'olive','sesame','coconut','avocado','chilli','peanut','garlic','canola','sunflower','rapeseed','truffle','spray')) return null;
    return cleanMap(T,new Set(['oil']),'Vegetable Oil',true,['neutral','cooking','vegetable','veg','plain','drizzle','frying','light']);
  }
  // BUTTERS
  if(has(T,'butter')){
    if(has(T,'powder','powdered')) return null;
    if(has(T,'peanut')) return cleanMap(T,new Set(['peanut','butter']),'Peanut Butter',true,['smooth','creamy','chunky','natural','crunchy']);
    if(has(T,'almond')) return cleanMap(T,new Set(['almond','butter']),'Almond Butter',false,[]);
    if(has(T,'cashew','hazelnut','nut','sunbutter','seed','biscoff','sun')) return null;
    if(veg) return null;
    return cleanMap(T,new Set(['butter']),'Butter',true,['unsalted','salted']);
  }
  // SUGAR — only white -> Sugar; others distinct
  if(has(T,'sugar')){
    if(/white sugar/.test(n)) return cleanMap(T,new Set(['sugar']),'Sugar',true,['white']);
    if([...T].filter(x=>x!=='sugar').length===0) return {canonical:'Sugar',rewrite:false};
    return null;
  }
  // CORNFLOUR (before FLOUR)
  if(has(T,'cornflour','cornstarch')||/corn flour/.test(n)) return cleanMap(T,new Set(['cornflour','cornstarch','corn','flour']),'Cornflour',true,['corn']);
  // FLOUR — bare/plain/all-purpose -> Plain Flour; types distinct
  if(has(T,'flour')){
    if(has(T,'gluten','gf','gluten-free','almond','oat','coconut','rice','chickpea','wholemeal','wheat','quinoa','arrowroot','bread','glutinous','blanched')) return null;
    if(/self raising|self rising/.test(n)) return {canonical:'Self-Raising Flour',rewrite:true};
    if(/all purpose|all-purpose|plain flour/.test(n) || [...T].filter(x=>x!=='flour').length===0)
      return cleanMap(T,new Set(['flour']),'Plain Flour',true,['all','purpose','plain']);
    return null;
  }
  // HONEY (honey mustard etc. excluded by cleanMap)
  if(has(T,'honey')) return cleanMap(T,new Set(['honey']),'Honey',true,['hot']);
  // CITRUS — juice/zest/rind/whole all roll up to the fruit (grocery = buy the fruit; prep kept in note)
  for(const f of ['lemon','lime','orange']){
    if(has(T,f)){
      const r=cleanMap(T,new Set([f]),f[0].toUpperCase()+f.slice(1),true,['juice','zest','rind','squeezed','half','wedge','wedges','slice','slices']);
      if(r) return r;
    }
  }
  // GINGER (fresh root); ground/puree/paste/pickled/sauce/dressing distinct
  if(has(T,'ginger')){
    if(has(T,'powder','puree','paste','pickled','sauce','dressing','ground','garlic','cinnamon')) return null;
    return cleanMap(T,new Set(['ginger']),'Ginger',true,['root']);
  }
  // COCOA POWDER
  if(hasAll(T,'cocoa','powder')) return cleanMap(T,new Set(['cocoa','powder']),'Cocoa Powder',true,['dark','black','dutch']);
  // DIJON MUSTARD
  if(has(T,'dijon')) return cleanMap(T,new Set(['dijon','mustard']),'Dijon Mustard',true,['smooth']);
  // TAHINI / TAMARI / SWEETENER
  if(has(T,'tahini')) return cleanMap(T,new Set(['tahini']),'Tahini',true,['runny']);
  if(has(T,'tamari')) return cleanMap(T,new Set(['tamari']),'Tamari',true,['sauce']);
  if(has(T,'sweetener')) return cleanMap(T,new Set(['sweetener']),'Sweetener',true,['granulated','powdered','liquid']);
  // CHILLI flakes / powder
  if((has(T,'chilli')||/red pepper flake/.test(n)) && has(T,'flake')) return cleanMap(T,new Set(['chilli','flake','pepper']),'Chilli Flakes',true,['red','korean','dried','pepper','crushed']);
  if(has(T,'chilli') && has(T,'powder')) return cleanMap(T,new Set(['chilli','powder']),'Chilli Powder',true,['red']);
  // CURRY POWDER
  if(hasAll(T,'curry','powder')) return cleanMap(T,new Set(['curry','powder']),'Curry Powder',true,['mild','hot','madras']);
  // PRAWN (all shrimp/prawn)
  if(has(T,'prawn','shrimp')) return cleanMap(T,new Set(['prawn','shrimp']),'Prawn',true,['tail','tails','shell','on','off','argentine','pink']);
  // CHICKEN STOCK
  if(has(T,'chicken') && has(T,'stock','broth')) return cleanMap(T,new Set(['chicken','stock','broth']),'Chicken Stock',true,['cube','cubes','bone','sodium','low']);
  // CHOCOLATE CHIP / CHUNK (dark/white distinct; chunk = chip)
  if((has(T,'chip')||has(T,'chunk')) && has(T,'chocolate')){
    if(has(T,'dark')) return {canonical:'Dark Chocolate Chip',rewrite:true};
    if(has(T,'white')) return {canonical:'White Chocolate Chip',rewrite:false};
    return cleanMap(T,new Set(['chocolate','chip','chunk']),'Chocolate Chip',true,['mini','topping','milk','dairy-free']);
  }
  // CHOCOLATE bar — dark (+ dairy-free dark) = Dark Chocolate; white = White Chocolate; else Chocolate
  if(has(T,'chocolate') && !has(T,'powder','cocoa','milk','bar','protein','spread','peanut')){
    if(has(T,'dark')) return cleanMap(T,new Set(['chocolate']),'Dark Chocolate',true,['dark','dairy-free','vegan','plain']);
    if(has(T,'white')) return cleanMap(T,new Set(['chocolate']),'White Chocolate',false,['white']);
    if([...T].filter(x=>x!=='chocolate').length===0) return {canonical:'Chocolate',rewrite:false};
  }
  // RICE NOODLE — wide/flat/thin/stick variants merge; vermicelli/glass/ramen/udon distinct
  if(hasAll(T,'rice','noodle') && !has(T,'vermicelli','glass','ramen','udon','soba')) return cleanMap(T,new Set(['rice','noodle']),'Rice Noodle',true,['wide','flat','thin','stick','sticks','dried']);
  // RICE — white/brown distinct; jasmine/basmati/sushi/sticky/wild stay their own; cooked/precooked -> note
  if(has(T,'rice') && !has(T,'noodle','paper','cake','vinegar','wine','flour','pudding','krispie','bran')){
    if(has(T,'jasmine','basmati','sushi','arborio','wild','sticky','glutinous')) return null; // protected varieties
    if(has(T,'brown')) return cleanMap(T,new Set(['rice']),'Brown Rice',true,['brown','cooked','precooked','uncooked','leftover','dry','dried']);
    if(has(T,'white')) return cleanMap(T,new Set(['rice']),'White Rice',true,['white','cooked','precooked','uncooked','leftover','dry','dried']);
    return cleanMap(T,new Set(['rice']),'Rice',true,['cooked','precooked','uncooked','leftover','dry','dried','steamed']);
  }
  // JALAPEÑO — pickled / from a jar = Pickled Jalapeño; fresh = Jalapeño
  if(has(T,'jalapeno')){
    if(has(T,'pickled','jar','brine')) return cleanMap(T,new Set(['jalapeno','brine']),has(T,'brine')?'Pickled Jalapeño Brine':'Pickled Jalapeño',true,['pickled','jar','from']);
    return cleanMap(T,new Set(['jalapeno']),'Jalapeño',true,[]);
  }
  // GARLIC (clove/bulb/fresh) — sauces/pastes/powder excluded
  if(has(T,'garlic')){
    if(has(T,'powder','granule','granules','salt','oil','sauce','paste','crunch','bread','pasta')) return null;
    return cleanMap(T,new Set(['garlic']),'Garlic',true,[]);
  }
  return null;
}

// ── light generic reducer for the long tail (container/synonym/qual-safe; colours kept distinct) ──
const SYN_WORD={ cilantro:'coriander', scallion:'spring onion', cornstarch:'cornflour', garbanzo:'chickpea' };
const CONTAINER=new Set(['clove','cloves','head','heads','bulb','bulbs','sprig','sprigs','stalk','stalks','stick','sticks',
 'can','cans','tin','tins','jar','jars','bunch','bunches','handful','handfuls','knob','knobs','piece','pieces','sheet','sheets',
 'rasher','rashers','punnet','block','blocks','packet','packets','pack','packs','bag','bags','tub','tubs','pinch','dash','scoop','scoops','splash','fillet','fillets','slice','slices']);
const FILLER=new Set(['big','extra','little','plenty','good','nice','couple','few','part','whole','generous','drizzle']);
const QUAL_SAFE=new Set(['low','reduced','sodium','plain','thick','thin','nonfat','non-fat','fat-free','low-fat','full-fat',
 'reduced-fat','semi','skimmed','unsalted','salted','smooth','crunchy','mild','runny','natural']);
const QUAL_REVIEW=new Set(['light','dark']);
// strip trailing "leaf/leaves" for leafy ingredients (spinach leaf->spinach) but NOT where the
// leaf IS the ingredient (bay/curry/lime/kaffir leaf).
const LEAF_KEEP=new Set(['bay','curry','lime','kaffir','makrut','vine','gold','kale']);
function reduceGeneric(v){
  let toks=v.split(' ').map(w=>SYN_WORD[w]||w);
  // multiword scallion->spring onion already; flatten
  toks=toks.join(' ').split(' ');
  if(toks.length>1 && /^le(af|aves|ave)$/.test(toks[toks.length-1]) && !LEAF_KEEP.has(toks[toks.length-2])) toks.pop();
  const joins=[]; const kept=[];
  for(const t of toks){
    if(CONTAINER.has(t)||FILLER.has(t)){ joins.push({t,type:'container'}); continue; }
    if(QUAL_SAFE.has(t)){ joins.push({t,type:'qualifier'}); continue; }
    if(QUAL_REVIEW.has(t)){ joins.push({t,type:'qual-review'}); continue; }
    kept.push(t);
  }
  const keptToks=kept.length?kept:toks;
  return {key:[...keptToks].sort().join(' '), natural:keptToks.join(' '), joins, changed:keptToks.length!==toks.length};
}

// ── build vocab ──
const vocab=new Map();
function addVocab(raw,occ,fromPb){
  const c=canonicalise(cleanRaw(raw));
  if(!c||c.length<2) return;
  if(!vocab.has(c)) vocab.set(c,{canon:c,occ:0,inPb:false});
  const x=vocab.get(c); x.occ+=occ; if(fromPb)x.inPb=true;
}
function csvCol(path,col){
  const text=fs.readFileSync(path,'utf8'); const rows=[]; let f='',row=[],q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false;} else f+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(f);f='';} else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';} else if(c!=='\r')f+=c; } }
  if(f!==''||row.length){row.push(f);rows.push(row);}
  const h=rows[0].map(x=>x.trim()); const ci=h.indexOf(col);
  return rows.slice(1).map(r=>(r[ci]??'').trim());
}
for(const ing of csvCol('recipe-ingredient-normalisation.csv','ingredient')) if(ing) addVocab(ing,1,false);
for(const ing of csvCol('missing-ingredient-prices.csv','Ingredient')) if(ing) addVocab(ing,0,false);
for(const k of PB_KEYS) addVocab(k,0,true);

// ── assign each variant a canonical (rule → generic → self) ──
const groups=new Map(); // canonicalTitle -> {canonical, rewrite, note, members:[{v,occ,inPb,decision,reason}]}
function ensure(canonical,rewrite,note){
  if(!groups.has(canonical)) groups.set(canonical,{canonical,rewrite:!!rewrite,note:note||'',members:[]});
  const g=groups.get(canonical); if(rewrite) g.rewrite=true; if(note&&!g.note) g.note=note; return g;
}
const genericBuckets=new Map(); // reducedKey -> [{v,occ,inPb,joins,natural}]
for(const x of vocab.values()){
  const r=classify(x.canon);
  if(r){
    const reason = x.canon===norm(r.canonical).toLowerCase()?'canonical':'rule';
    ensure(r.canonical,r.rewrite,r.note).members.push({v:x.canon,occ:x.occ,inPb:x.inPb,decision:'merge',reason:'rule:'+r.canonical});
  } else {
    const g=reduceGeneric(x.canon);
    if(!genericBuckets.has(g.key)) genericBuckets.set(g.key,[]);
    genericBuckets.get(g.key).push({...x,_g:g});
  }
}
// generic buckets -> clusters (only where >=2 members or a member changed)
for(const [key,arr] of genericBuckets){
  const anyChange=arr.some(a=>a._g.changed);
  if(arr.length<2 && !anyChange) continue; // pure distinct singleton: skip (shortens sheet)
  // canonical = the REDUCED natural form (so "runny honey" -> Honey, merging into any
  // explicit group of the same name), taken from the highest-occurrence member.
  const pick=[...arr].sort((a,b)=>b.occ-a.occ||a.canon.length-b.canon.length)[0];
  const canonical=titleCase(pick._g.natural);
  const g=ensure(canonical,true,'');
  for(const a of arr){
    const types=new Set(a._g.joins.map(j=>j.type));
    const decision = types.has('qual-review') ? 'review' : 'merge';
    const reason = a._g.joins.map(j=>j.type==='qual-review'?`qualifier?:${j.t}`:j.type==='container'?`container:${j.t}`:`qualifier:${j.t}`).join(' | ')||'variant';
    g.members.push({v:a.canon,occ:a.occ,inPb:a.inPb,decision,reason});
  }
}

// ── emit: drop trivial no-op single-member groups (canonical == sole variant, no rewrite) ──
let clusters=[...groups.values()].filter(g=>{
  if(g.members.length>=2) return true;
  const m=g.members[0];
  return titleCase(m.v)!==g.canonical || g.rewrite || m.decision==='review';
});
// total occurrences for sort
for(const g of clusters) g.tot=g.members.reduce((s,m)=>s+m.occ,0);
clusters.sort((a,b)=>b.tot-a.tot||b.members.length-a.members.length||a.canonical.localeCompare(b.canonical));

function esc(s){s=String(s??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
const header=['cluster_id','suggested_canonical','variant','occurrences','in_pricebook','reason','decision','rewrite_recipes','notes'];
const out=[header.join(',')];
let cid=0,merge=0,review=0,sep=0;
for(const g of clusters){
  cid++;
  // dedupe members by variant; canonical-match first, then occ desc
  const seen=new Set();
  const members=[...g.members].filter(m=>{if(seen.has(m.v))return false;seen.add(m.v);return true;})
    .sort((a,b)=>((titleCase(b.v)===g.canonical)-(titleCase(a.v)===g.canonical))||b.occ-a.occ||a.v.localeCompare(b.v));
  // primary row = the variant equal to canonical, else the highest-occ row (a pure rename)
  let pIdx=members.findIndex(m=>titleCase(m.v)===g.canonical); if(pIdx<0) pIdx=0;
  members.forEach((m,i)=>{
    const isPrimary=i===pIdx;
    const dec=isPrimary?'merge':m.decision;
    if(dec==='merge')merge++; else if(dec==='review')review++; else sep++;
    const reason=isPrimary?'canonical':m.reason;
    out.push([cid,esc(g.canonical),esc(m.v),m.occ,m.inPb?'yes':'no',esc(reason),dec,isPrimary?(g.rewrite?'yes':'no'):'',esc(isPrimary?g.note:'')].join(','));
  });
}
fs.writeFileSync('ingredient-consolidation.csv',out.join('\n')+'\n');
console.log('vocab:',vocab.size,'| clusters:',clusters.length,'| rows:',out.length-1,'| merge:',merge,'| review:',review);
console.log('\nTop 30 clusters:');
for(const g of clusters.slice(0,30)) console.log(`  [${g.members.length}] ${g.canonical}${g.rewrite?'*':''}  ←  ${g.members.map(m=>m.v).filter(v=>titleCase(v)!==g.canonical).join(', ')}`);

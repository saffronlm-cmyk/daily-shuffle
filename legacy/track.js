// ─── TRACK STATE ─────────────────────────────────────────────────────────────
let trackDate = (() => { const d = new Date(); return d.toISOString().slice(0,10); })();
let foodLog   = {};   // { 'YYYY-MM-DD': { breakfast:[{type,id,servings}], snack:[], lunch:[], dinner:[], dessert:[] } }
let targets   = { kcal: 1800, protein: 130, carbs: 180, fat: 60 };

try { const fl = localStorage.getItem('ds_food_log'); if(fl) foodLog = JSON.parse(fl); } catch(e){}
try { const tg = localStorage.getItem('ds_targets');  if(tg) targets = { ...targets, ...JSON.parse(tg) }; } catch(e){}

function saveFoodLog()  { try { localStorage.setItem('ds_food_log', JSON.stringify(foodLog));   } catch(e){} }
function saveTargets()  {
  targets.kcal    = parseInt(document.getElementById('target-kcal')?.value,10)    || targets.kcal;
  targets.protein = parseInt(document.getElementById('target-protein')?.value,10) || targets.protein;
  targets.carbs   = parseInt(document.getElementById('target-carbs')?.value,10)   || targets.carbs;
  targets.fat     = parseInt(document.getElementById('target-fat')?.value,10)     || targets.fat;
  try { localStorage.setItem('ds_targets', JSON.stringify(targets)); } catch(e){}
  const n = document.getElementById('targetsSavedNotice');
  if(n) { n.style.display='inline'; setTimeout(()=>n.style.display='none', 2000); }
  if(document.getElementById('tab-track')?.classList.contains('active')) renderTrackTab();
}

// ─── TRACK HELPERS ────────────────────────────────────────────────────────────
const TRACK_SLOTS = ['breakfast','snack','lunch','dinner','dessert'];
const TRACK_SLOT_EMOJI = { breakfast:'🌅', snack:'☕', lunch:'🥗', dinner:'🍽', dessert:'🍫' };
const TRACK_SLOT_LABEL = { breakfast:'Breakfast', snack:'Snack', lunch:'Lunch', dinner:'Dinner', dessert:'Dessert' };

function getDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  const dayName = d.toLocaleDateString('en-GB', { weekday:'short' });
  const dateLabel = d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  if(diff === 0) return { main: 'Today', sub: dateLabel };
  if(diff === -1) return { main: 'Yesterday', sub: dateLabel };
  if(diff === 1) return { main: 'Tomorrow', sub: dateLabel };
  return { main: `${dayName} ${dateLabel}`, sub: '' };
}

function shiftDate(delta) {
  const d = new Date(trackDate + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  trackDate = d.toISOString().slice(0,10);
  renderTrackTab();
}

function goToday() {
  trackDate = new Date().toISOString().slice(0,10);
  renderTrackTab();
}

function ensureDayLog(dateStr) {
  if (!foodLog[dateStr]) foodLog[dateStr] = { breakfast:[], snack:[], lunch:[], dinner:[], dessert:[] };
  for (const slot of TRACK_SLOTS) if (!foodLog[dateStr][slot]) foodLog[dateStr][slot] = [];
  return foodLog[dateStr];
}

function getEntryMacros(entry) {
  const srv = entry.servings || 1;
  if (entry.type === 'recipe') {
    const fd = RECIPE_FULL_DATA[entry.id];
    const nut = fd?.nutrition;
    if (!nut) return null;
    return {
      kcal:    Math.round((nut.kcal    || 0) * srv),
      protein: Math.round((nut.protein || 0) * srv),
      carbs:   Math.round((nut.carbs   || 0) * srv),
      fat:     Math.round((nut.fat     || 0) * srv),
    };
  }
  if (entry.type === 'pantry') {
    const item = pantry.find(p => p.id === entry.id);
    if (!item) return null;
    return {
      kcal:    Math.round((item.kcal    || 0) * srv),
      protein: Math.round((item.protein || 0) * srv),
      carbs:   Math.round((item.carbs   || 0) * srv),
      fat:     Math.round((item.fat     || 0) * srv),
    };
  }
  return null;
}

function getDayTotals(dateStr) {
  const day = foodLog[dateStr];
  if (!day) return { kcal:0, protein:0, carbs:0, fat:0 };
  const tot = { kcal:0, protein:0, carbs:0, fat:0 };
  for (const slot of TRACK_SLOTS) {
    for (const entry of (day[slot]||[])) {
      const m = getEntryMacros(entry);
      if (m) { tot.kcal += m.kcal; tot.protein += m.protein; tot.carbs += m.carbs; tot.fat += m.fat; }
    }
  }
  return tot;
}

function removeLogEntry(slot, idx) {
  const day = ensureDayLog(trackDate);
  day[slot].splice(idx, 1);
  saveFoodLog();
  renderTrackTab();
}

function updateLogServings(slot, idx, val) {
  const n = parseFloat(val);
  const day = ensureDayLog(trackDate);
  if (day[slot]?.[idx]) day[slot][idx].servings = n > 0 ? n : 1;
  saveFoodLog();
  renderTrackTab();
}

// ─── TRACK PICKER (extends existing picker overlay) ──────────────────────────
let trackPickerSlot = null;

function openTrackPicker(slot) {
  trackPickerSlot = slot;
  pickerContext = null; // signal: not plan mode
  document.getElementById('pickerTitle').textContent = `Add to ${TRACK_SLOT_LABEL[slot]||slot}`;
  document.getElementById('pickerHint').textContent  = 'Pick a recipe or pantry item';
  document.getElementById('pickerSearch').value = '';
  filterTrackPicker();
  document.getElementById('pickerOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('pickerSearch').focus(), 50);
}

function filterTrackPicker() {
  const q = document.getElementById('pickerSearch').value.toLowerCase();
  const recipeItems = recipes
    .filter(r => r.name.toLowerCase().includes(q))
    .map(r => {
      const nut = RECIPE_FULL_DATA[r.id]?.nutrition;
      const macroStr = nut ? `${nut.kcal} kcal · ${nut.protein}g protein` : '';
      return `<div class="picker-item" onclick="selectTrackItem('recipe','${r.id}')">
        <div class="picker-item-name">${r.name}</div>
        <div class="picker-item-meta">
          <span>${TYPE_LABELS[r.mealType]||''}</span>
          ${macroStr?`<span>${macroStr}</span>`:'<span class="track-no-macros">No macros — estimate first</span>'}
        </div>
      </div>`;
    });
  const pantryItems = pantry
    .filter(p => p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q))
    .map(p => `<div class="picker-item" onclick="selectTrackItem('pantry',${p.id})">
      <div class="picker-item-name">${p.name}${p.brand?` <span style="font-weight:400;color:var(--text3)">(${p.brand})</span>`:''}</div>
      <div class="picker-item-meta"><span>🥫 Pantry · ${p.kcal} kcal · ${p.protein}g protein per ${p.unitLabel||'serving'}</span></div>
    </div>`);
  const combined = [...pantryItems, ...recipeItems];
  document.getElementById('pickerList').innerHTML = combined.length
    ? combined.join('')
    : '<div style="padding:24px;text-align:center;color:var(--text3)">No matches</div>';
}

function selectTrackItem(type, id) {
  if (!trackPickerSlot) return;
  const day = ensureDayLog(trackDate);
  day[trackPickerSlot].push({ type, id, servings: 1 });
  saveFoodLog();
  closePicker();
  trackPickerSlot = null;
  renderTrackTab();
}

// ─── TRACK RENDER ─────────────────────────────────────────────────────────────
function renderTrackTab() {
  const el = document.getElementById('trackLayout'); if (!el) return;
  const day = foodLog[trackDate] || {};
  const totals = getDayTotals(trackDate);
  const { main, sub } = getDateLabel(trackDate);
  const isToday = trackDate === new Date().toISOString().slice(0,10);

  // Date nav
  let html = `
    <div class="track-date-nav">
      <button class="track-nav-btn" onclick="shiftDate(-1)">‹</button>
      <div class="track-date-info">
        <div class="track-date-label">${main}</div>
        ${sub?`<div class="track-date-sub">${sub}</div>`:''}
      </div>
      ${!isToday?`<button class="track-today-btn" onclick="goToday()">Today</button>`:'<div style="width:56px"></div>'}
      <button class="track-nav-btn" onclick="shiftDate(1)">›</button>
    </div>`;

  // Meal slots
  for (const slot of TRACK_SLOTS) {
    const entries = day[slot] || [];
    let slotKcal = 0;
    const entryRows = entries.map((entry, idx) => {
      const m = getEntryMacros(entry);
      if (m) slotKcal += m.kcal;
      const name = entry.type === 'recipe'
        ? (recipes.find(r => r.id === entry.id)?.name || 'Unknown recipe')
        : (pantry.find(p => p.id === entry.id)?.name || 'Unknown item');
      const badge = entry.type === 'pantry' ? `<span style="font-size:10px;color:var(--green);margin-left:4px">🥫</span>` : '';
      const macroStr = m ? `${m.kcal} kcal · ${m.protein}g P` : '<span class="track-no-macros">no macros</span>';
      return `<div class="track-entry">
        <div class="track-entry-name">${name}${badge}</div>
        <div class="track-entry-srv-wrap">
          <input class="track-entry-srv" type="number" min="0.5" step="0.5" value="${entry.servings||1}"
            onchange="updateLogServings('${slot}',${idx},this.value)" title="Servings">
          <span>×</span>
        </div>
        <div class="track-entry-macros">${macroStr}</div>
        <button class="track-entry-remove" onclick="removeLogEntry('${slot}',${idx})" title="Remove">×</button>
      </div>`;
    }).join('');

    html += `<div class="track-slot">
      <div class="track-slot-header">
        <div class="track-slot-left">
          <span class="track-slot-label">${TRACK_SLOT_EMOJI[slot]} ${TRACK_SLOT_LABEL[slot]}</span>
          ${slotKcal?`<span class="track-slot-kcal">${slotKcal} kcal</span>`:''}
        </div>
        <button class="track-add-btn" onclick="openTrackPicker('${slot}')" title="Add food">+</button>
      </div>
      <div class="track-slot-entries">
        ${entryRows || `<div class="track-empty">Nothing logged yet</div>`}
      </div>
    </div>`;
  }

  // Macro totals
  const pct = (val, target) => Math.min(100, target > 0 ? Math.round(val / target * 100) : 0);
  const valueClass = (val, target) => val > target * 1.05 ? 'over' : val >= target * 0.9 ? 'ok' : 'low';
  html += `<div class="track-totals">
    <div class="track-totals-header">
      <span class="track-totals-title">Daily Totals</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="track-totals-kcal">${totals.kcal} / ${targets.kcal} kcal</span>
        <button class="btn-track-targets" onclick="openCalcModal()" title="Recalculate targets">⚙</button>
      </div>
    </div>
    ${[
      { key:'protein', label:'Protein', unit:'g', colour:'bar-protein' },
      { key:'carbs',   label:'Carbs',   unit:'g', colour:'bar-carbs'   },
      { key:'fat',     label:'Fat',     unit:'g', colour:'bar-fat'     },
    ].map(m => `<div class="track-macro-row">
      <div class="track-macro-label">
        <span class="track-macro-name">${m.label}</span>
        <span class="track-macro-value ${valueClass(totals[m.key], targets[m.key])}">${totals[m.key]}g / ${targets[m.key]}g</span>
      </div>
      <div class="track-bar-bg"><div class="track-bar-fill ${m.colour}" style="width:${pct(totals[m.key],targets[m.key])}%"></div></div>
    </div>`).join('')}
    <div class="track-macro-row">
      <div class="track-macro-label">
        <span class="track-macro-name">Calories</span>
        <span class="track-macro-value ${valueClass(totals.kcal, targets.kcal)}">${totals.kcal} / ${targets.kcal} kcal</span>
      </div>
      <div class="track-bar-bg"><div class="track-bar-fill bar-kcal" style="width:${pct(totals.kcal,targets.kcal)}%"></div></div>
    </div>
  </div>`;

  el.innerHTML = html;

  // Populate target inputs if settings panel is open
  populateTargetInputs();
}

// ─── SETTINGS HELPERS (target inputs) ────────────────────────────────────────
function populateTargetInputs() {
  const map = { 'target-kcal': targets.kcal, 'target-protein': targets.protein, 'target-carbs': targets.carbs, 'target-fat': targets.fat };
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  }
}

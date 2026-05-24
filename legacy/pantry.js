// ─── PANTRY STATE ────────────────────────────────────────────────────────────
let pantry    = [];   // [{ id, name, brand, unitLabel, kcal, protein, carbs, fat, aliases:[] }]
let pantryShowForm = false;
let pantryEditId   = null;
let pantryAiImages = [];
let pantryAiStatus  = { text: '', cls: '' };

try { const pt = localStorage.getItem('ds_pantry');   if(pt) pantry  = JSON.parse(pt); } catch(e){}

function savePantry()   { try { localStorage.setItem('ds_pantry', JSON.stringify(pantry));       } catch(e){} }

// ─── PANTRY RENDER ───────────────────────────────────────────────────────────
function renderPantryTab() {
  const el = document.getElementById('pantryLayout'); if (!el) return;
  const items = pantry.map(item => `
    <div class="pantry-item">
      <div class="pantry-item-info">
        <div class="pantry-item-name">${item.name}${item.brand?` <span style="font-weight:400;font-size:11px;color:var(--text3)">(${item.brand})</span>`:''}</div>
        <div class="pantry-item-detail">${item.kcal} kcal · ${item.protein}g P · ${item.carbs}g C · ${item.fat}g F per ${item.unitLabel||'serving'}${item.aliases?.length?` · aliases: ${item.aliases.join(', ')}`:''}</div>
      </div>
      <div class="pantry-item-btns">
        <button class="btn-pi" onclick="openPantryForm(${item.id})">Edit</button>
        <button class="btn-pi del" onclick="deletePantryItem(${item.id})">×</button>
      </div>
    </div>`).join('');

  const emptyMsg = pantry.length === 0 && !pantryShowForm
    ? `<p style="font-size:13px;color:var(--text3);text-align:center;padding:24px 0">No items yet — add your first product below.</p>`
    : '';

  const aiPreviewsHtml = pantryAiImages.map((img, i) => `
    <div class="ai-preview-thumb">
      <img src="${img.dataUrl}" alt="Preview ${i+1}">
      <button class="ai-preview-thumb-remove" onclick="removePantryAiImage(${i})" title="Remove">×</button>
    </div>`).join('');

  el.innerHTML = `
    <div style="max-width:640px;margin:0 auto;padding:16px 0">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:4px">🥫 My Pantry</h2>
      <p style="font-size:12px;color:var(--text3);margin-bottom:16px;line-height:1.5">Save your go-to branded foods with exact macros. They'll appear first when you log food in the Track tab.</p>

      <div class="ai-quick-add" style="margin-bottom:20px">
        <div class="ai-quick-add-header">
          <h3>✨ Quick Add with AI</h3>
          <span class="ai-badge">Claude Haiku</span>
        </div>
        <div class="ai-tabs">
          <button class="ai-tab-btn active" id="pantryAiTabImg" onclick="switchPantryAiTab('image',this)">📷 Screenshot</button>
          <button class="ai-tab-btn" id="pantryAiTabText" onclick="switchPantryAiTab('text',this)">📋 Paste text</button>
        </div>
        <div class="ai-input-panel active" id="pantry-ai-panel-image">
          <div class="ai-drop-zone" id="pantryAiDropZone">
            <input type="file" id="pantryAiImageInput" accept="image/*" multiple onchange="handlePantryImageSelect(event)" />
            <div class="ai-drop-zone-icon">📸</div>
            <div class="ai-drop-zone-text">Drop a nutrition label screenshot here, or click to choose</div>
            <div class="ai-drop-zone-sub">Works with product packaging, nutrition labels, or any macro info</div>
          </div>
          <div class="ai-preview-grid" id="pantryAiPreviewGrid">${aiPreviewsHtml}</div>
        </div>
        <div class="ai-input-panel" id="pantry-ai-panel-text">
          <textarea class="ai-text-input" id="pantryAiText" placeholder="Paste the product name, brand, and nutrition info here…"></textarea>
        </div>
        <div class="ai-actions">
          <button class="btn-parse" id="btnPantryParse" onclick="parsePantryWithAI()">
            <span id="pantryParseSpinner" style="display:none">⏳</span>
            ✨ Parse product
          </button>
          <span class="ai-parse-status ${pantryAiStatus.cls}" id="pantryAiStatus">${pantryAiStatus.text}</span>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="flex:1;height:1px;background:var(--border)"></div>
        <span style="font-size:11px;color:var(--text3);white-space:nowrap">or add manually</span>
        <div style="flex:1;height:1px;background:var(--border)"></div>
      </div>

      ${items}
      ${emptyMsg}
      ${!pantryShowForm?`<button class="btn-pantry-add" onclick="openPantryForm(null)">+ Add food item</button>`:''}
      ${pantryShowForm ? buildPantryForm() : ''}
    </div>`;

  setupPantryDropZone();
}

function switchPantryAiTab(tab, btn) {
  document.querySelectorAll('#pantryLayout .ai-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#pantryLayout .ai-input-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pantry-ai-panel-' + tab).classList.add('active');
  pantryAiStatus = { text: '', cls: '' };
  document.getElementById('pantryAiStatus').textContent = '';
}

function handlePantryImageSelect(evt) {
  const files = [...(evt.target.files || [])];
  if (!files.length) return;
  let loaded = 0;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) return;
      pantryAiImages.push({ base64: match[2], mediaType: match[1], dataUrl });
      loaded++;
      if (loaded === files.length) {
        const grid = document.getElementById('pantryAiPreviewGrid');
        if (grid) grid.innerHTML = pantryAiImages.map((img, i) => `
          <div class="ai-preview-thumb">
            <img src="${img.dataUrl}" alt="Preview ${i+1}">
            <button class="ai-preview-thumb-remove" onclick="removePantryAiImage(${i})" title="Remove">×</button>
          </div>`).join('');
      }
    };
    reader.readAsDataURL(file);
  });
  pantryAiStatus = { text: '', cls: '' };
}

function removePantryAiImage(idx) {
  pantryAiImages.splice(idx, 1);
  const grid = document.getElementById('pantryAiPreviewGrid');
  if (grid) grid.innerHTML = pantryAiImages.map((img, i) => `
    <div class="ai-preview-thumb">
      <img src="${img.dataUrl}" alt="Preview ${i+1}">
      <button class="ai-preview-thumb-remove" onclick="removePantryAiImage(${i})" title="Remove">×</button>
    </div>`).join('');
}

function setupPantryDropZone() {
  const zone = document.getElementById('pantryAiDropZone');
  if (!zone || zone._dropSetup) return;
  zone._dropSetup = true;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length) handlePantryImageSelect({ target: { files } });
  });
}

async function parsePantryWithAI() {
  const key = localStorage.getItem('ds_api_key');
  if (!key) { openSettings(); return; }

  const activePanel = document.querySelector('#pantryLayout .ai-input-panel.active');
  const isImagePanel = activePanel?.id === 'pantry-ai-panel-image';
  const statusEl = document.getElementById('pantryAiStatus');
  const spinner  = document.getElementById('pantryParseSpinner');
  const btn      = document.getElementById('btnPantryParse');

  if (isImagePanel && !pantryAiImages.length) {
    pantryAiStatus = { text: 'Please select at least one image first.', cls: 'error' };
    statusEl.textContent = pantryAiStatus.text;
    statusEl.className = 'ai-parse-status error';
    return;
  }
  const pastedText = document.getElementById('pantryAiText')?.value.trim() || '';
  if (!isImagePanel && !pastedText) {
    pantryAiStatus = { text: 'Please paste some product info first.', cls: 'error' };
    statusEl.textContent = pantryAiStatus.text;
    statusEl.className = 'ai-parse-status error';
    return;
  }

  btn.disabled = true;
  spinner.style.display = 'inline';
  statusEl.textContent = 'Parsing…';
  statusEl.className = 'ai-parse-status';

  const systemPrompt = `You are a nutrition label parser. Extract product information from nutrition labels, packaging photos, or product descriptions and return ONLY a valid JSON object — no markdown, no explanation.

{
  "name": string,
  "brand": string | null,
  "kcal": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "unitLabel": string,
  "aliases": [string]
}

Rules:
- Extract macros PER SERVING (not per 100g unless that IS the serving size)
- Round all macro values to 1 decimal place
- unitLabel should clearly describe the serving, e.g. "30g scoop", "1 sausage (85g)", "100ml", "1 bar (45g)"
- aliases: 2–4 lowercase shorthand names useful for search, e.g. ["protein powder", "whey", "free soul"]
- Return ONLY the JSON. No other text.`;

  const userContent = isImagePanel
    ? [
        ...pantryAiImages.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })),
        { type: 'text', text: `Extract this product's nutrition info into the specified JSON format.${pantryAiImages.length > 1 ? ' Information may be spread across multiple images — combine it.' : ''}` }
      ]
    : [{ type: 'text', text: 'Extract this product\'s nutrition info into the specified JSON format:\n\n' + pastedText }];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const raw  = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed  = JSON.parse(cleaned);

    pantryAiStatus = { text: '✓ Form pre-filled — review and save!', cls: 'success' };
    pantryShowForm = true;
    pantryEditId   = null;
    renderPantryTab();

    setTimeout(() => {
      const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
      set('pf-name',    parsed.name);
      set('pf-brand',   parsed.brand);
      set('pf-kcal',    parsed.kcal);
      set('pf-protein', parsed.protein);
      set('pf-carbs',   parsed.carbs);
      set('pf-fat',     parsed.fat);
      set('pf-unit',    parsed.unitLabel);
      if (parsed.aliases?.length) {
        const el = document.getElementById('pf-aliases');
        if (el) el.value = parsed.aliases.join(', ');
      }
      document.getElementById('pantryForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

  } catch (err) {
    console.error(err);
    pantryAiStatus = { text: '⚠ ' + (err.message || 'Something went wrong. Check your API key and try again.'), cls: 'error' };
    statusEl.textContent = pantryAiStatus.text;
    statusEl.className = 'ai-parse-status error';
  } finally {
    const b = document.getElementById('btnPantryParse');
    const s = document.getElementById('pantryParseSpinner');
    if (b) b.disabled = false;
    if (s) s.style.display = 'none';
  }
}

function buildPantryForm() {
  const item = pantryEditId !== null ? pantry.find(p => p.id === pantryEditId) : null;
  return `<div class="pantry-form" id="pantryForm">
    <div class="pantry-form-grid">
      <div class="pf-group"><label>Name *</label><input id="pf-name" value="${item?.name||''}" placeholder="e.g. Protein Powder"></div>
      <div class="pf-group"><label>Brand</label><input id="pf-brand" value="${item?.brand||''}" placeholder="e.g. Free Soul"></div>
    </div>
    <div class="pantry-form-grid four">
      <div class="pf-group"><label>Kcal</label><input type="number" id="pf-kcal" value="${item?.kcal||''}" placeholder="105"></div>
      <div class="pf-group"><label>Protein (g)</label><input type="number" id="pf-protein" value="${item?.protein||''}" placeholder="20"></div>
      <div class="pf-group"><label>Carbs (g)</label><input type="number" id="pf-carbs" value="${item?.carbs||''}" placeholder="5"></div>
      <div class="pf-group"><label>Fat (g)</label><input type="number" id="pf-fat" value="${item?.fat||''}" placeholder="2"></div>
    </div>
    <div class="pantry-form-grid">
      <div class="pf-group"><label>Per unit / serving label</label><input id="pf-unit" value="${item?.unitLabel||''}" placeholder="e.g. 30g scoop"></div>
      <div class="pf-group"><label>Aliases (comma-separated)</label><input id="pf-aliases" value="${(item?.aliases||[]).join(', ')}" placeholder="protein powder, whey"></div>
    </div>
    <div class="pantry-form-actions">
      <button class="btn-pf-save" onclick="savePantryItem()">Save</button>
      <button class="btn-pf-cancel" onclick="closePantryForm()">Cancel</button>
    </div>
  </div>`;
}

function openPantryForm(id) {
  pantryShowForm = true;
  pantryEditId = id;
  renderPantryTab();
  setTimeout(() => document.getElementById('pf-name')?.focus(), 50);
}

function closePantryForm() {
  pantryShowForm = false;
  pantryEditId   = null;
  pantryAiStatus = { text: '', cls: '' };
  renderPantryTab();
}

function savePantryItem() {
  const name = document.getElementById('pf-name')?.value.trim();
  if (!name) { alert('Name is required'); return; }
  const item = {
    id:        pantryEditId !== null ? pantryEditId : Date.now(),
    name,
    brand:     document.getElementById('pf-brand')?.value.trim() || '',
    kcal:      parseFloat(document.getElementById('pf-kcal')?.value)    || 0,
    protein:   parseFloat(document.getElementById('pf-protein')?.value) || 0,
    carbs:     parseFloat(document.getElementById('pf-carbs')?.value)   || 0,
    fat:       parseFloat(document.getElementById('pf-fat')?.value)     || 0,
    unitLabel: document.getElementById('pf-unit')?.value.trim()         || 'serving',
    aliases:   document.getElementById('pf-aliases')?.value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) || [],
  };
  if (pantryEditId !== null) {
    const idx = pantry.findIndex(p => p.id === pantryEditId);
    if (idx !== -1) pantry[idx] = item; else pantry.push(item);
  } else {
    pantry.push(item);
  }
  savePantry();
  pantryShowForm = false;
  pantryEditId = null;
  renderPantryTab();
}

function deletePantryItem(id) {
  pantry = pantry.filter(p => p.id !== id);
  savePantry();
  renderPantryTab();
}

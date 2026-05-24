// ─── DISCOVER STATE ──────────────────────────────────────────────────────────
let edamamAppId  = localStorage.getItem('ds_edamam_id')  || '';
let edamamAppKey = localStorage.getItem('ds_edamam_key') || '';
let discoverItems = []; // cached last search results for addDiscoverRecipe()

function saveEdamamKeys() {
  const idEl  = document.getElementById('edamamAppIdInput');
  const keyEl = document.getElementById('edamamAppKeyInput');
  if (idEl?.value.trim())  { edamamAppId  = idEl.value.trim();  localStorage.setItem('ds_edamam_id',  edamamAppId);  }
  if (keyEl?.value.trim()) { edamamAppKey = keyEl.value.trim(); localStorage.setItem('ds_edamam_key', edamamAppKey); }
  const n = document.getElementById('edamamKeysSavedNotice');
  if (n) { n.style.display='inline'; setTimeout(()=>n.style.display='none', 2000); }
}

// ─── DISCOVER SEARCH ─────────────────────────────────────────────────────────
async function searchRecipes() {
  const resultsEl = document.getElementById('discoverResults');
  if (!edamamAppId || !edamamAppKey) {
    resultsEl.innerHTML = `<div class="discover-no-key">
      <p>No Edamam API keys saved yet.</p>
      <p>Set them up in <a onclick="openSettings()">⚙ Settings</a> — it only takes a minute and it's free.</p>
    </div>`;
    return;
  }

  const rawQuery = (document.getElementById('discoverInput')?.value || '').trim();
  if (!rawQuery) return;

  const btn = document.getElementById('btnDiscoverSearch');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Searching…'; }
  resultsEl.innerHTML = '<div class="discover-status">Searching…</div>';

  try {
    const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(rawQuery)}&app_id=${encodeURIComponent(edamamAppId)}&app_key=${encodeURIComponent(edamamAppKey)}&health=gluten-free&health=dairy-free`;
    const res = await fetch(url, { headers: { 'Edamam-Account-User': edamamAppId } });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      const msg = err.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const data = await res.json();
    discoverItems = (data.hits || []).map(h => h.recipe);
    if (!discoverItems.length) {
      resultsEl.innerHTML = '<div class="discover-status">No results found. Try different keywords.</div>';
      return;
    }
    renderDiscoverResults(discoverItems);
  } catch (err) {
    resultsEl.innerHTML = `<div class="discover-status" style="color:#c87070">Search failed: ${err.message}</div>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Search'; }
  }
}

function renderDiscoverResults(items) {
  const el = document.getElementById('discoverResults');
  el.innerHTML = `<div class="discover-results">${items.map((recipe, i) => {
    const thumb = recipe.image || '';
    const site  = recipe.source || '';
    const kcal    = recipe.calories && recipe.yield ? Math.round(recipe.calories / recipe.yield) : null;
    const protein = recipe.totalNutrients?.PROCNT?.quantity && recipe.yield ? Math.round(recipe.totalNutrients.PROCNT.quantity / recipe.yield) : null;
    const macroStr = (kcal || protein) ? [kcal ? `${kcal} kcal` : null, protein ? `${protein}g protein` : null].filter(Boolean).join(' · ') + ' per serving' : '';
    const thumbHtml = thumb
      ? `<img class="discover-thumb" src="${thumb}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<div class="discover-thumb-ph" style="display:none">🍽</div>`
      : `<div class="discover-thumb-ph">🍽</div>`;

    return `<div class="discover-card">
      ${thumbHtml}
      <div class="discover-card-body">
        <div class="discover-card-title">${recipe.label||'Recipe'}</div>
        <div class="discover-card-site">${site}${macroStr ? ` <span class="discover-rich-badge">· ${macroStr}</span>` : ''}</div>
        <div class="discover-card-snippet">${recipe.ingredientLines?.slice(0,3).join(', ')||''}</div>
        <div class="discover-card-actions">
          <button class="btn-discover-add" onclick="addDiscoverRecipe(${i})">＋ Add to Library</button>
          <a class="btn-discover-open" href="${recipe.url}" target="_blank" rel="noopener">Open ↗</a>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function addDiscoverRecipe(idx) {
  const recipe = discoverItems[idx]; if (!recipe) return;

  const lines = [];
  lines.push(`RECIPE SOURCE: ${recipe.url}`);
  lines.push(`TITLE: ${recipe.label||''}`);
  if (recipe.yield)                        lines.push(`SERVINGS: ${recipe.yield}`);
  if (recipe.calories && recipe.yield)     lines.push(`CALORIES PER SERVING: ${Math.round(recipe.calories / recipe.yield)} kcal`);

  const n = recipe.totalNutrients || {};
  const perServing = key => recipe.yield && n[key]?.quantity ? Math.round(n[key].quantity / recipe.yield) : null;
  const macros = [
    n.PROCNT ? `Protein: ${perServing('PROCNT')}g` : null,
    n.CHOCDF ? `Carbs: ${perServing('CHOCDF')}g`   : null,
    n.FAT    ? `Fat: ${perServing('FAT')}g`         : null,
  ].filter(Boolean);
  if (macros.length) lines.push(`MACROS PER SERVING: ${macros.join(', ')}`);
  if (recipe.dietLabels?.length)   lines.push(`DIET: ${recipe.dietLabels.join(', ')}`);
  if (recipe.healthLabels?.length) lines.push(`HEALTH LABELS: ${recipe.healthLabels.join(', ')}`);
  if (recipe.ingredientLines?.length) lines.push(`\nINGREDIENTS:\n${recipe.ingredientLines.join('\n')}`);

  const textBlob = lines.join('\n');

  // Switch to Add Recipe tab, activate text panel, pre-fill textarea
  const addBtn = [...document.querySelectorAll('nav button')].find(b => b.textContent.includes('Add Recipe'));
  if (addBtn) switchTab('add', addBtn);

  const textPanelBtn = document.querySelector('.ai-tab-btn:not(:first-child)');
  if (textPanelBtn) switchAiTab('text', textPanelBtn);

  const ta = document.getElementById('aiTextInput');
  if (ta) { ta.value = textBlob; ta.focus(); }

  const statusEl = document.getElementById('aiParseStatus');
  if (statusEl) { statusEl.textContent = '✓ Rich recipe data loaded — hit Parse!'; statusEl.className = 'ai-parse-status success'; }

  showToast('✓ Recipe data loaded — review and parse');
}

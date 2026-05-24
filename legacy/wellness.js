// ─── WELLNESS STATE ───────────────────────────────────────────────────────────
let supplements  = [];  // [{ id, name, dose, timing, note }]
let suppLog      = {};  // { 'YYYY-MM-DD': [id, ...] } — checked IDs per day
let savedPosts   = [];  // [{ id, title, url, score, sub, flair }]
let suppDate     = (() => new Date().toISOString().slice(0,10))();
let redditSub    = 'PCOS';
let redditCache  = {};  // { sub: [posts] }
let suppFormOpen = false;

try { const s = localStorage.getItem('ds_supplements'); if(s) supplements = JSON.parse(s); } catch(e){}
try { const sl = localStorage.getItem('ds_supp_log');   if(sl) suppLog = JSON.parse(sl); } catch(e){}
try { const sp = localStorage.getItem('ds_saved_posts'); if(sp) savedPosts = JSON.parse(sp); } catch(e){}

function saveSupplements() { try { localStorage.setItem('ds_supplements', JSON.stringify(supplements)); } catch(e){} }
function saveSuppLog()     { try { localStorage.setItem('ds_supp_log', JSON.stringify(suppLog));       } catch(e){} }
function saveSavedPosts()  { try { localStorage.setItem('ds_saved_posts', JSON.stringify(savedPosts));  } catch(e){} }

// ─── WELLNESS / SUPPLEMENT TRACKER ───────────────────────────────────────────
function renderWellnessTab() {
  renderSuppList();
  renderRedditPosts();
  updateSuppDateUI();
}

function updateSuppDateUI() {
  const label = document.getElementById('suppDateLabel');
  const sub   = document.getElementById('suppDateSub');
  if (!label) return;
  const today = new Date().toISOString().slice(0,10);
  const d = new Date(suppDate + 'T12:00:00');
  const isToday = suppDate === today;
  label.textContent = isToday ? 'Today' : d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });

  // Streak: count consecutive days back from today where all supplements were taken
  let streak = 0;
  const cur = new Date(today + 'T12:00:00');
  while (streak < 365) {
    const key = cur.toISOString().slice(0,10);
    const checked = suppLog[key] || [];
    if (supplements.length === 0 || checked.length < supplements.length) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  if (sub) sub.innerHTML = streak > 0
    ? `<span class="supp-streak">🔥 ${streak}-day streak</span>`
    : `Track your daily supplements`;
}

function shiftSuppDate(dir) {
  const d = new Date(suppDate + 'T12:00:00');
  d.setDate(d.getDate() + dir);
  const today = new Date().toISOString().slice(0,10);
  const next = d.toISOString().slice(0,10);
  if (next > today) return; // don't go into future
  suppDate = next;
  updateSuppDateUI();
  renderSuppList();
}

function toggleSuppForm() {
  suppFormOpen = !suppFormOpen;
  const form = document.getElementById('suppForm');
  const btn  = document.getElementById('btnSuppToggle');
  if (!form) return;
  form.style.display = suppFormOpen ? 'block' : 'none';
  btn.style.display  = suppFormOpen ? 'none'  : 'block';
  if (suppFormOpen) document.getElementById('suppName')?.focus();
}

function saveSuppItem() {
  const name = document.getElementById('suppName')?.value.trim();
  if (!name) return;
  const dose   = document.getElementById('suppDose')?.value.trim()   || '';
  const timing = document.getElementById('suppTiming')?.value.trim() || '';
  const note   = document.getElementById('suppNote')?.value.trim()   || '';
  const id = Date.now();
  supplements.push({ id, name, dose, timing, note });
  saveSupplements();
  // Clear form
  ['suppName','suppDose','suppTiming','suppNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  suppFormOpen = false;
  renderSuppList();
  updateSuppDateUI();
  const form = document.getElementById('suppForm');
  const btn  = document.getElementById('btnSuppToggle');
  if (form) form.style.display = 'none';
  if (btn)  btn.style.display  = 'block';
}

function toggleSuppCheck(id) {
  const checked = new Set(suppLog[suppDate] || []);
  if (checked.has(id)) checked.delete(id); else checked.add(id);
  suppLog[suppDate] = [...checked];
  saveSuppLog();
  renderSuppList();
  updateSuppDateUI();
}

function deleteSuppItem(id) {
  supplements = supplements.filter(s => s.id !== id);
  saveSupplements();
  renderSuppList();
  updateSuppDateUI();
}

function renderSuppList() {
  const el = document.getElementById('suppList');
  if (!el) return;
  const checked = new Set(suppLog[suppDate] || []);
  if (!supplements.length) {
    el.innerHTML = `<div class="supp-empty">No supplements added yet. Hit the button below to start your stack.</div>`;
    return;
  }
  el.innerHTML = supplements.map(s => {
    const done = checked.has(s.id);
    const detail = [s.dose, s.timing, s.note].filter(Boolean).join(' · ');
    return `<div class="supp-item">
      <input type="checkbox" class="supp-check" ${done ? 'checked' : ''} onchange="toggleSuppCheck(${s.id})">
      <div class="supp-item-info">
        <div class="supp-item-name${done?' checked':''}">${s.name}</div>
        ${detail ? `<div class="supp-item-detail">${detail}</div>` : ''}
      </div>
      <div class="supp-item-btns">
        <button class="btn-supp-del" onclick="deleteSuppItem(${s.id})" title="Remove">×</button>
      </div>
    </div>`;
  }).join('');
}

// ─── WELLNESS / REDDIT COMMUNITY ──────────────────────────────────────────────
const REDDIT_KEYWORDS = ['supplement','pcos','hormone','nutrition','protein','vitamin','magnesium','inositol','spearmint','omega','thyroid','insulin','period','cycle'];

function setRedditSub(btn) {
  document.querySelectorAll('.btn-reddit-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  redditSub = btn.dataset.sub;
  const refreshBtn = document.getElementById('btnRedditRefresh');
  if (refreshBtn) refreshBtn.style.display = redditSub === 'saved' ? 'none' : '';
  renderRedditPosts();
  if (redditSub !== 'saved' && !redditCache[redditSub]) fetchRedditPosts();
}

async function fetchRedditPosts() {
  const el = document.getElementById('redditPosts');
  if (!el || redditSub === 'saved') return;
  el.innerHTML = `<div class="reddit-status">Loading posts…</div>`;
  try {
    const url = `https://www.reddit.com/r/${redditSub}/search.json?q=${encodeURIComponent('supplement OR nutrition OR hormone')}&restrict_sr=1&sort=top&t=month&limit=25`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const posts = (data?.data?.children || [])
      .map(c => c.data)
      .filter(p => {
        const text = (p.title + ' ' + (p.selftext||'')).toLowerCase();
        return REDDIT_KEYWORDS.some(kw => text.includes(kw));
      })
      .slice(0, 15)
      .map(p => ({
        id:    p.id,
        title: p.title,
        url:   `https://www.reddit.com${p.permalink}`,
        score: p.score,
        sub:   p.subreddit,
        flair: p.link_flair_text || '',
        comments: p.num_comments || 0,
      }));
    redditCache[redditSub] = posts;
    renderRedditPosts();
  } catch(e) {
    el.innerHTML = `<div class="reddit-status">Couldn't load posts — check your connection and try again.</div>`;
  }
}

function renderRedditPosts() {
  const el = document.getElementById('redditPosts');
  if (!el) return;

  if (redditSub === 'saved') {
    if (!savedPosts.length) {
      el.innerHTML = `<div class="reddit-saved-empty">Pin posts you find useful with ⭐ — they'll appear here.</div>`;
      return;
    }
    el.innerHTML = `<div class="reddit-posts">${savedPosts.map(p => redditPostHTML(p, true)).join('')}</div>`;
    return;
  }

  const posts = redditCache[redditSub];
  if (!posts) {
    el.innerHTML = `<div class="reddit-status">Hit ↻ to load top posts from r/${redditSub}.</div>`;
    return;
  }
  if (!posts.length) {
    el.innerHTML = `<div class="reddit-status">No matching posts found. Try refreshing.</div>`;
    return;
  }
  el.innerHTML = `<div class="reddit-posts">${posts.map(p => redditPostHTML(p, false)).join('')}</div>`;
}

function redditPostHTML(p, pinned) {
  const isPinned = pinned || savedPosts.some(s => s.id === p.id);
  return `<div class="reddit-post">
    <div class="reddit-post-title"><a href="${p.url}" target="_blank" rel="noopener">${p.title}</a></div>
    <div class="reddit-post-meta">
      <span class="reddit-post-score">▲ ${p.score.toLocaleString()}</span>
      <span>r/${p.sub}</span>
      <span>${p.comments} comments</span>
      ${p.flair ? `<span class="reddit-post-flair">${p.flair}</span>` : ''}
      <button class="btn-reddit-pin${isPinned?' pinned':''}" onclick="togglePinPost(${JSON.stringify(p).replace(/"/g,'&quot;')},this)" title="${isPinned?'Unpin':'Pin'}">⭐</button>
    </div>
  </div>`;
}

function togglePinPost(p, btn) {
  const idx = savedPosts.findIndex(s => s.id === p.id);
  if (idx >= 0) {
    savedPosts.splice(idx, 1);
    btn.classList.remove('pinned');
  } else {
    savedPosts.push(p);
    btn.classList.add('pinned');
  }
  saveSavedPosts();
  if (redditSub === 'saved') renderRedditPosts();
}

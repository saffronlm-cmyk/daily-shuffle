// ─── MACRO CALCULATOR ────────────────────────────────────────────────────────
// Opens the Mifflin-St Jeor calculator modal and writes results into `targets`
// (owned by track.js). Trigger: `openCalcModal()` (called from Track tab and on
// first Track tab visit if `ds_targets` not yet stored).
let _calcActivity = 1.375;
let _calcGoal = 0;

function openCalcModal() {
  document.getElementById('calcOverlay').classList.add('open');
  calcTargets();
}
function closeCalcModal() {
  document.getElementById('calcOverlay').classList.remove('open');
}
function closeCalcOnOverlay(e) {
  if (e.target === document.getElementById('calcOverlay')) closeCalcModal();
}
function setCalcActivity(btn) {
  document.querySelectorAll('#calcActivityRow .calc-toggle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _calcActivity = parseFloat(btn.dataset.activity);
  calcTargets();
}
function setCalcGoal(btn) {
  document.querySelectorAll('#calcGoalRow .calc-toggle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _calcGoal = parseInt(btn.dataset.goal);
  calcTargets();
}
function calcTargets() {
  const age    = parseFloat(document.getElementById('calcAge').value)    || 25;
  const weight = parseFloat(document.getElementById('calcWeight').value) || 60;
  const height = parseFloat(document.getElementById('calcHeight').value) || 153;
  const sex    = document.getElementById('calcSex').value;

  // Mifflin-St Jeor BMR
  let bmr = sex === 'female'
    ? (10 * weight) + (6.25 * height) - (5 * age) - 161
    : (10 * weight) + (6.25 * height) - (5 * age) + 5;

  const tdee = Math.round(bmr * _calcActivity);
  const kcal = Math.max(1200, tdee + _calcGoal);

  // Protein: 2g per kg for muscle retention
  const protein = Math.round(weight * 2);
  // Fat: ~25% of kcal
  const fat = Math.round((kcal * 0.25) / 9);
  // Carbs: remaining kcal
  const carbs = Math.round((kcal - (protein * 4) - (fat * 9)) / 4);

  document.getElementById('prevKcal').textContent    = kcal;
  document.getElementById('prevProtein').textContent = protein;
  document.getElementById('prevCarbs').textContent   = Math.max(0, carbs);
  document.getElementById('prevFat').textContent     = fat;

  const goalLabel = _calcGoal < 0 ? 'fat loss' : _calcGoal > 0 ? 'muscle gain' : 'maintenance';
  document.getElementById('calcPreviewNote').textContent =
    `TDEE: ~${tdee} kcal · Goal adjustment: ${_calcGoal >= 0 ? '+' : ''}${_calcGoal} kcal · Protein set at 2g/kg for ${goalLabel}.`;

  // Stash for applyCalcTargets
  window._calcResult = { kcal, protein, carbs: Math.max(0, carbs), fat };
}
function applyCalcTargets() {
  if (!window._calcResult) return;
  const r = window._calcResult;
  targets = { ...targets, ...r };
  saveTargets();
  populateTargetInputs();
  renderTrackTab();
  closeCalcModal();
}

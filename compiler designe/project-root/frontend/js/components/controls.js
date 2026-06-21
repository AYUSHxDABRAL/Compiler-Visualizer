// js/components/controls.js

function setControlsEnabled(compiled) {
  el('btnStepBack').disabled = !compiled || State.currentStep <= 0;
  el('btnStepFwd').disabled  = !compiled || State.currentStep >= State.snapshots.length - 1;
  el('btnRun').disabled      = !compiled;
  el('btnReset').disabled    = !compiled;
}

function handleSpeed(val) {
  State.speed = parseInt(val);
  el('speedVal').textContent = `${val}ms`;
}

function handleStepForward() {
  if (State.currentStep >= State.snapshots.length - 1) return;
  State.currentStep++;
  applySnapshot(State.currentStep);
  setControlsEnabled(true);
}

function handleStepBack() {
  if (State.currentStep <= 0) return;
  State.currentStep--;
  applySnapshot(State.currentStep);
  setControlsEnabled(true);
}

async function handleRun() {
  if (State.isRunning) {
    // pause
    State.isRunning = false;
    clearTimeout(State.runTimer);
    el('btnRun').textContent = '▶▶';
    el('btnRun').classList.remove('running');
    return;
  }

  State.isRunning = true;
  el('btnRun').textContent = '⏸';
  el('btnRun').classList.add('running');

  function step() {
    if (!State.isRunning || State.currentStep >= State.snapshots.length - 1) {
      State.isRunning = false;
      el('btnRun').textContent = '▶▶';
      el('btnRun').classList.remove('running');
      setControlsEnabled(true);
      return;
    }
    State.currentStep++;
    applySnapshot(State.currentStep);
    setControlsEnabled(true);
    State.runTimer = setTimeout(step, State.speed);
  }

  step();
}

function handleReset() {
  State.isRunning = false;
  clearTimeout(State.runTimer);
  State.currentStep = 0;
  applySnapshot(0);
  setControlsEnabled(true);
  el('btnRun').textContent = '▶▶';
  el('btnRun').classList.remove('running');
}

function applySnapshot(index) {
  const snap = State.snapshots[index];
  if (!snap) return;

  const prevSnap = State.snapshots[index - 1];
  const prevMemory = prevSnap ? prevSnap.memory : {};

  // symbol table
  renderSymbolTable(snap.memory, prevMemory);

  // stack
  renderStack(snap.stack);

  // highlight IR line
  renderIR(State.irInstructions, snap.instrIndex);

  // highlight pseudocode line — map IR index to pseudocode line
  const pseudoLine = irIndexToPseudoLine(snap.instrIndex);
  renderPseudocode(State.pseudocode, pseudoLine);

  // step bar
  const total = State.snapshots.length - 1;
  const pct   = total > 0 ? Math.round((index / total) * 100) : 0;
  el('stepFill').style.width    = pct + '%';
  el('stepCounter').textContent = `${index} / ${total}`;
  el('stepInfo').textContent    = snap.description || '—';
}

function irIndexToPseudoLine(irIdx) {
  // simple heuristic: pseudocode lines map 1-to-1 with statements
  // IR instructions per statement vary, so we use stored mapping if available
  if (irIdx < 0) return -1;
  return State.irToPseudo ? (State.irToPseudo[irIdx] ?? -1) : -1;
}

function switchTab(name, btn) {
  // deactivate all tabs and content
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  // activate selected
  btn.classList.add('active');
  el(`tab-${name}`).classList.add('active');
}
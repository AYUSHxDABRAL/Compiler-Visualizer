function toggleMode() {
  const current = getMode();
  if (current === 'js') {
    // switching to Python — check backend first
    setMode('python');
    el('btnMode').className = 'btn-mode py-mode';
    el('modeLabel').textContent = 'Python Backend';
    showStatus('loading', 'Connecting to Python backend...');
 
    pingBackend().then(alive => {
      if (alive) {
        showStatus('ok', 'Python backend connected — http://localhost:5000');
      } else {
        showStatus('error', 'Backend not reachable. Run: cd backend && python3 server.py');
      }
    });
  } else {
    setMode('js');
    el('btnMode').className = 'btn-mode js-mode';
    el('modeLabel').textContent = 'Browser Mode (JS)';
    showStatus('ok', 'Browser Mode — JS compiler running locally');
    setTimeout(() => hideStatus(), 3000);
  }
}
 
function showStatus(type, text) {
  const bar = el('statusBar');
  bar.className = `status-bar ${type}`;
  el('statusText').textContent = text;
}
 
function hideStatus() {
  el('statusBar').className = 'status-bar hidden';
}
 
// ─────────────────────────────────────────────
// COMPILE HANDLER
// ─────────────────────────────────────────────
 
async function handleCompile() {
  const code = el('codeEditor').value.trim();
 
  if (!code) {
    showErrors(['No code to compile. Write something first.']);
    return;
  }
 
  // Reset UI
  State.reset();
  clearSymbolTable();
  clearStack();
  clearOutputPanels();
  setControlsEnabled(false);
 
  const mode = getMode();
 
  if (mode === 'python') {
    // ── Python backend mode ────────────────────
    showStatus('loading', 'Compiling via Python backend...');
 
    const result = await compileViaBackend(code);
 
    if (result.errors.length > 0) {
      showErrors(result.errors);
      showStatus('error', `Error — ${result.errors[0]}`);
      return;
    }
 
    // Normalize tokens for renderTokens (backend returns {type,value,line})
    State.tokens         = result.tokens;
    State.ast            = result.ast;
    State.irInstructions = result.irInstructions;
    State.snapshots      = result.snapshots;
    State.pseudocode     = result.pseudocode;
    State.currentStep    = 0;
    State.irToPseudo     = buildIRToPseudoMapFromPseudo(result.pseudocode, result.irInstructions);
 
    // Render all tabs
    renderTokens(result.tokens);
    renderAST(result.ast);
    renderIR(result.irInstructions, -1);
    renderPseudocode(result.pseudocode, -1);
 
    applySnapshot(0);
    setControlsEnabled(true);
    clearErrors();
 
    const steps = result.snapshots.length - 1;
    showStatus('ok', `Compiled via Python · ${steps} steps · ${result.irInstructions.length} IR instructions · [Python]`);
 
  } else {
    // ── Browser JS mode ────────────────────────
    const result = compile(code);
 
    if (result.errors.length > 0) {
      showErrors(result.errors);
      return;
    }
 
    State.tokens         = result.tokens;
    State.ast            = result.ast;
    State.irInstructions = result.irInstructions;
    State.snapshots      = result.snapshots;
    State.pseudocode     = result.pseudocode;
    State.currentStep    = 0;
    State.irToPseudo     = buildIRToPseudoMap(result.ast, result.irInstructions);
 
    renderTokens(result.tokens);
    renderAST(result.ast);
    renderIR(result.irInstructions, -1);
    renderPseudocode(result.pseudocode, -1);
 
    applySnapshot(0);
    setControlsEnabled(true);
    clearErrors();
 
    const steps = result.snapshots.length - 1;
    showStatus('ok', `Compiled · ${steps} steps · ${result.irInstructions.length} IR instructions · [Browser]`);
    setTimeout(() => hideStatus(), 5000);
  }
}
 
// ─────────────────────────────────────────────
// IR → PSEUDOCODE LINE MAPPING
// ─────────────────────────────────────────────
 
function buildIRToPseudoMap(ast, instructions) {
  // JS mode: re-run IRGenerator per statement to count instructions
  const map = {};
  let pseudoIdx = 0, irIdx = 0;
 
  if (!ast || !ast.statements) return map;
 
  ast.statements.forEach(stmt => {
    const tempGen = new IRGenerator();
    tempGen.visit(stmt);
    const count = tempGen.instructions.length;
    for (let i = 0; i < count; i++) {
      map[irIdx] = pseudoIdx;
      irIdx++;
    }
    pseudoIdx++;
  });
 
  return map;
}
 
function buildIRToPseudoMapFromPseudo(pseudocode, irInstructions) {
  // Python backend mode: simple proportional mapping
  // pseudocode has N lines, ir has M instructions
  // map each IR index proportionally to a pseudocode line
  const map = {};
  const N = pseudocode.length;
  const M = irInstructions.length;
  if (!N || !M) return map;
 
  irInstructions.forEach((_, i) => {
    map[i] = Math.min(Math.floor((i / M) * N), N - 1);
  });
 
  return map;
}
 
// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────
 
function showErrors(errors) {
  el('errCount').textContent = errors.length;
  el('errorsPanel').innerHTML = errors.map(e =>
    `<div class="error-item"><span class="error-icon">✕</span><span>${escapeHtml(e)}</span></div>`
  ).join('');
}
 
function clearErrors() {
  el('errorsPanel').innerHTML = '<div class="no-errors">No errors</div>';
  el('errCount').textContent = '0';
}
 
// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
 
window.addEventListener('DOMContentLoaded', () => {
  updateLineNumbers();
  updateCursor();
  // show initial status
  showStatus('ok', 'Browser Mode — JS compiler ready');
  setTimeout(() => hideStatus(), 3000);
});
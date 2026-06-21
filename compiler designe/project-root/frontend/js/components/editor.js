// js/components/editor.js

function handleEditorInput() {
  updateLineNumbers();
  updateCursor();
}

function handleEditorKey(e) {
  // Tab → insert 2 spaces
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = el('codeEditor');
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + 2;
    updateLineNumbers();
  }
}

function updateLineNumbers() {
  const ta    = el('codeEditor');
  const lines = ta.value.split('\n').length;
  const ln    = el('lineNumbers');
  let html = '';
  for (let i = 1; i <= Math.max(lines, 1); i++) html += i + '\n';
  ln.textContent = html;
}

function syncScroll() {
  const ta = el('codeEditor');
  el('lineNumbers').scrollTop = ta.scrollTop;
}

function updateCursor() {
  const ta  = el('codeEditor');
  const val = ta.value.substring(0, ta.selectionStart);
  const row = val.split('\n').length;
  const col = val.split('\n').pop().length + 1;
  el('cursorPos').textContent = `Ln ${row}, Col ${col}`;
}

function loadSample(key) {
  const samples = {
    basic: `int a = 5 + 3;\na = a + 2;\nprint(a);`
  };
  if (!samples[key]) return;
  const ta = el('codeEditor');
  ta.value = samples[key];
  updateLineNumbers();
  updateCursor();
  // reset dropdown
  el('sampleSelect').value = '';
}
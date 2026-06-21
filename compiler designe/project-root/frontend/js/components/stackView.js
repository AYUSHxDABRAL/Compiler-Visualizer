// js/components/stackView.js

function renderStack(stack) {
  const container = el('execStack');
  el('stackDepth').textContent = `depth: ${stack.length}`;

  if (stack.length === 0) {
    container.innerHTML = '<div class="empty-state-sm">Stack is empty</div>';
    return;
  }

  // render top of stack at top (reversed)
  let html = '';
  [...stack].reverse().forEach((val, i) => {
    const isTop = i === 0;
    html += `<div class="stack-frame ${isTop ? 'new' : ''}">${escapeHtml(String(val))}</div>`;
  });

  container.innerHTML = html;
}

function clearStack() {
  el('execStack').innerHTML = '<div class="empty-state-sm">Execute code to see call stack</div>';
  el('stackDepth').textContent = 'depth: 0';
}
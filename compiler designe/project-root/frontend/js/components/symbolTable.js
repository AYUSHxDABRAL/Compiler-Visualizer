// js/components/symbolTable.js

function renderSymbolTable(memory, prevMemory = {}) {
  const container = el('symbolTable');
  const vars = Object.keys(memory);

  el('symCount').textContent = `${vars.length} var${vars.length !== 1 ? 's' : ''}`;

  if (vars.length === 0) {
    container.innerHTML = '<div class="empty-state-sm">No variables declared yet</div>';
    return;
  }

  let html = `
    <table class="sym-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
  `;

  vars.forEach(name => {
    const value   = memory[name];
    const changed = prevMemory[name] !== value;
    const type    = Number.isInteger(value) ? 'int' : 'float';
    html += `
      <tr class="${changed ? 'updated' : ''}">
        <td class="sym-name">${escapeHtml(name)}</td>
        <td class="sym-type">${type}</td>
        <td class="sym-value">${escapeHtml(String(value))}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function clearSymbolTable() {
  el('symbolTable').innerHTML = '<div class="empty-state-sm">Symbol table will populate during execution</div>';
  el('symCount').textContent = '0 vars';
}
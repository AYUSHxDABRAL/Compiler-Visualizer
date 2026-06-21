function renderPseudocode(lines, activeIndex = -1) {
  const container = el('pseudocodeOutput');
  el('pseudoEmpty').style.display = 'none';
 
  if (!lines || lines.length === 0) {
    container.innerHTML = '';
    el('pseudoEmpty').style.display = '';
    return;
  }
 
  let html = '';
  lines.forEach((line, i) => {
    const isActive = i === activeIndex;
    const isDone   = i < activeIndex;
    const cls = isActive ? 'active' : isDone ? 'done' : '';
    html += `
      <div class="pseudo-line ${cls}">
        <span class="pseudo-line-num">${i + 1}</span>
        <span class="pseudo-line-text">${formatPseudoLine(escapeHtml(line.text))}</span>
      </div>
    `;
  });
 
  container.innerHTML = html;
 
  // scroll active line into view
  const activeEl = container.querySelector('.pseudo-line.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}
 
function formatPseudoLine(text) {
  return text
    .replace(/\b(DECLARE|SET|PRINT|IF|ELSE|THEN|END IF|WHILE|DO|END WHILE)\b/g, '<span class="kw">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="val">$1</span>')
    .replace(/(←)/g, '<span class="op">←</span>');
}
 
function renderTokens(tokens) {
  const container = el('tokensOutput');
  el('tokensEmpty').style.display = 'none';
 
  const filtered = tokens.filter(t => t.type !== 'EOF');
  if (filtered.length === 0) { el('tokensEmpty').style.display = ''; return; }
 
  let html = '';
  filtered.forEach(t => {
    html += `
      <div class="token-chip">
        <span class="token-type">${escapeHtml(t.type)}</span>
        <span class="token-val">${escapeHtml(String(t.value ?? ''))}</span>
      </div>
    `;
  });
  container.innerHTML = html;
}
 
// ─────────────────────────────────────────────
// AST TREE VISUALIZER
// ─────────────────────────────────────────────
 
function renderAST(ast) {
  el('astEmpty').style.display = 'none';
  const wrap = el('astOutput');
  if (!ast) { el('astEmpty').style.display = ''; return; }
 
  // 1. Build a layout tree from AST
  const root = buildLayoutTree(ast);
 
  // 2. Assign (x, y) positions using Reingold-Tilford-style BFS layout
  assignPositions(root);
 
  // 3. Compute bounding box
  let maxX = 0, maxY = 0;
  walkLayout(root, n => {
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  });
 
  const NODE_W  = 100;   // node box width
  const NODE_H  = 36;    // node box height
  const PAD     = 40;    // padding around canvas
  const svgW    = maxX + NODE_W + PAD * 2;
  const svgH    = maxY + NODE_H + PAD * 2;
 
  const svg = el('astSvg');
  svg.setAttribute('width',  svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
 
  // Clear previous
  while (svg.firstChild) svg.removeChild(svg.firstChild);
 
  // 4. Draw edges first (so they appear behind nodes)
  walkLayout(root, node => {
    node.children.forEach(child => {
      const x1 = node.x  + NODE_W / 2 + PAD;
      const y1 = node.y  + NODE_H     + PAD;
      const x2 = child.x + NODE_W / 2 + PAD;
      const y2 = child.y             + PAD;
      // Curved bezier connector
      const mx = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'ast-edge');
      path.setAttribute('d', `M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`);
      svg.appendChild(path);
    });
  });
 
  // 5. Draw nodes
  walkLayout(root, node => {
    const cx = node.x + PAD;
    const cy = node.y + PAD;
 
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `ast-node-group ${node.colorClass}`);
    g.setAttribute('transform', `translate(${cx}, ${cy})`);
 
    // rounded rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'ast-node-circle');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width',  NODE_W);
    rect.setAttribute('height', NODE_H);
    rect.setAttribute('rx', 8);
    g.appendChild(rect);
 
    // main label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'ast-node-label');
    text.setAttribute('x', NODE_W / 2);
    text.setAttribute('y', node.sub ? NODE_H / 2 - 7 : NODE_H / 2);
    text.textContent = node.label;
    g.appendChild(text);
 
    // sub label (e.g. variable name, operator, value)
    if (node.sub) {
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('class', 'ast-node-sub');
      sub.setAttribute('x', NODE_W / 2);
      sub.setAttribute('y', NODE_H / 2 + 8);
      sub.textContent = node.sub;
      g.appendChild(sub);
    }
 
    svg.appendChild(g);
  });
}
 
// ── Build a plain layout tree from AST nodes ──
function buildLayoutTree(astNode) {
  if (!astNode || typeof astNode !== 'object') return null;
 
  switch (astNode.kind) {
    case 'Program':
      return {
        label: 'Program', sub: null, colorClass: 'ast-node-program',
        children: astNode.statements.map(buildLayoutTree).filter(Boolean)
      };
 
    case 'VarDecl':
      return {
        label: 'VarDecl', sub: `[${astNode.varType}] ${astNode.name}`,
        colorClass: 'ast-node-stmt',
        children: [buildLayoutTree(astNode.value)].filter(Boolean)
      };
 
    case 'Assignment':
      return {
        label: 'Assign', sub: astNode.name,
        colorClass: 'ast-node-stmt',
        children: [buildLayoutTree(astNode.value)].filter(Boolean)
      };
 
    case 'Print':
      return {
        label: 'Print', sub: null,
        colorClass: 'ast-node-stmt',
        children: [buildLayoutTree(astNode.expression)].filter(Boolean)
      };
 
    case 'If':
      return {
        label: 'If', sub: null,
        colorClass: 'ast-node-stmt',
        children: [
          buildLayoutTree(astNode.condition),
          { label: 'Body', sub: null, colorClass: 'ast-node-stmt',
            children: astNode.body.map(buildLayoutTree).filter(Boolean) },
          astNode.elseBody ? {
            label: 'Else', sub: null, colorClass: 'ast-node-stmt',
            children: astNode.elseBody.map(buildLayoutTree).filter(Boolean)
          } : null
        ].filter(Boolean)
      };
 
    case 'While':
      return {
        label: 'While', sub: null,
        colorClass: 'ast-node-stmt',
        children: [
          buildLayoutTree(astNode.condition),
          { label: 'Body', sub: null, colorClass: 'ast-node-stmt',
            children: astNode.body.map(buildLayoutTree).filter(Boolean) }
        ].filter(Boolean)
      };
 
    case 'BinaryExpr':
      return {
        label: 'Binary', sub: `(${astNode.op})`,
        colorClass: 'ast-node-expr',
        children: [buildLayoutTree(astNode.left), buildLayoutTree(astNode.right)].filter(Boolean)
      };
 
    case 'UnaryExpr':
      return {
        label: 'Unary', sub: `(${astNode.op})`,
        colorClass: 'ast-node-expr',
        children: [buildLayoutTree(astNode.operand)].filter(Boolean)
      };
 
    case 'Number':
      return { label: 'Number', sub: String(astNode.value), colorClass: 'ast-node-leaf', children: [] };
 
    case 'Variable':
      return { label: 'Var', sub: astNode.name, colorClass: 'ast-node-leaf', children: [] };
 
    default:
      return { label: astNode.kind || '?', sub: null, colorClass: 'ast-node-leaf', children: [] };
  }
}
 
// ── Assign x,y positions (top-down level layout) ──
function assignPositions(root) {
  const H_GAP = 120;   // horizontal gap between sibling nodes
  const V_GAP = 90;    // vertical gap between levels
  const NODE_W = 100;
 
  // Step 1: compute subtree widths bottom-up
  function computeWidth(node) {
    if (node.children.length === 0) {
      node.width = NODE_W + 20;
      return node.width;
    }
    node.width = node.children.reduce((sum, c) => sum + computeWidth(c) + 10, 0) - 10;
    node.width = Math.max(node.width, NODE_W + 20);
    return node.width;
  }
  computeWidth(root);
 
  // Step 2: assign positions top-down
  function assignXY(node, left, depth) {
    node.y = depth * V_GAP;
    node.x = left + (node.width - NODE_W) / 2;
 
    let childLeft = left;
    node.children.forEach(child => {
      assignXY(child, childLeft, depth + 1);
      childLeft += child.width + 10;
    });
  }
  assignXY(root, 0, 0);
}
 
// ── Walk all nodes ──
function walkLayout(node, fn) {
  fn(node);
  node.children.forEach(c => walkLayout(c, fn));
}
 
function renderIR(instructions, activeIndex = -1) {
  const container = el('irOutput');
  el('irEmpty').style.display = 'none';
 
  if (!instructions || instructions.length === 0) {
    el('irEmpty').style.display = '';
    return;
  }
 
  let html = '';
  instructions.forEach((instr, i) => {
    const isActive = i === activeIndex;
    const isDone   = i < activeIndex;
    const cls = isActive ? 'active' : isDone ? 'done' : '';
    const arg = instr.arg !== null ? instr.arg : '';
    html += `
      <div class="ir-line ${cls}" id="ir-line-${i}">
        <span class="ir-idx">${i}</span>
        <span class="ir-op">${escapeHtml(instr.op)}</span>
        <span class="ir-arg">${escapeHtml(String(arg))}</span>
      </div>
    `;
  });
 
  container.innerHTML = html;
 
  const activeEl = el(`ir-line-${activeIndex}`);
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}
 
function clearOutputPanels() {
  el('pseudocodeOutput').innerHTML = '';
  el('pseudoEmpty').style.display  = '';
  // clear AST svg
  const svg = el('astSvg');
  if (svg) while (svg.firstChild) svg.removeChild(svg.firstChild);
  el('astEmpty').style.display      = '';
  el('tokensOutput').innerHTML      = '';
  el('tokensEmpty').style.display   = '';
  el('irOutput').innerHTML          = '';
  el('irEmpty').style.display       = '';
}
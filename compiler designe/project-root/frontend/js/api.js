const TT = {
  INT: 'INT', FLOAT: 'FLOAT',
  IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', PRINT: 'PRINT',
  IDENTIFIER: 'IDENTIFIER', NUMBER: 'NUMBER',
  ASSIGN: 'ASSIGN', PLUS: 'PLUS', MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY', DIVIDE: 'DIVIDE',
  EQUAL: 'EQUAL', NOT_EQUAL: 'NOT_EQUAL',
  LESS: 'LESS', LESS_EQUAL: 'LESS_EQUAL',
  GREATER: 'GREATER', GREATER_EQUAL: 'GREATER_EQUAL',
  SEMICOLON: 'SEMICOLON', COMMA: 'COMMA',
  LPAREN: 'LPAREN', RPAREN: 'RPAREN',
  LBRACE: 'LBRACE', RBRACE: 'RBRACE',
  EOF: 'EOF'
};
 
// ─────────────────────────────────────────────
// LEXER
// ─────────────────────────────────────────────
class Lexer {
  constructor(source) {
    this.source  = source;
    this.pos     = 0;
    this.line    = 1;
    this.current = source[0] || null;
  }
 
  advance() {
    this.pos++;
    this.current = this.pos < this.source.length ? this.source[this.pos] : null;
  }
 
  skipWhitespace() {
    while (this.current !== null && /\s/.test(this.current)) {
      if (this.current === '\n') this.line++;
      this.advance();
    }
  }
 
  skipLineComment() {
    while (this.current !== null && this.current !== '\n') this.advance();
  }
 
  number() {
    let result = '';
    while (this.current !== null && /\d/.test(this.current)) {
      result += this.current; this.advance();
    }
    if (this.current === '.') {
      result += '.'; this.advance();
      while (this.current !== null && /\d/.test(this.current)) {
        result += this.current; this.advance();
      }
      return { type: TT.NUMBER, value: parseFloat(result), line: this.line };
    }
    return { type: TT.NUMBER, value: parseInt(result, 10), line: this.line };
  }
 
  identifier() {
    let result = '';
    while (this.current !== null && /[a-zA-Z0-9_]/.test(this.current)) {
      result += this.current; this.advance();
    }
    const keywords = {
      int: TT.INT, float: TT.FLOAT, if: TT.IF,
      else: TT.ELSE, while: TT.WHILE, print: TT.PRINT
    };
    const type = keywords[result] || TT.IDENTIFIER;
    return { type, value: result, line: this.line };
  }
 
  nextToken() {
    while (this.current !== null) {
      // whitespace
      if (/\s/.test(this.current)) { this.skipWhitespace(); continue; }
 
      // line comments
      if (this.current === '/' && this.source[this.pos + 1] === '/') {
        this.skipLineComment(); continue;
      }
 
      // numbers
      if (/\d/.test(this.current)) return this.number();
 
      // identifiers / keywords
      if (/[a-zA-Z_]/.test(this.current)) return this.identifier();
 
      // two-char operators
      const peek = this.source[this.pos + 1];
      if (this.current === '=' && peek === '=') { this.advance(); this.advance(); return { type: TT.EQUAL,         value: '==', line: this.line }; }
      if (this.current === '!' && peek === '=') { this.advance(); this.advance(); return { type: TT.NOT_EQUAL,     value: '!=', line: this.line }; }
      if (this.current === '<' && peek === '=') { this.advance(); this.advance(); return { type: TT.LESS_EQUAL,    value: '<=', line: this.line }; }
      if (this.current === '>' && peek === '=') { this.advance(); this.advance(); return { type: TT.GREATER_EQUAL, value: '>=', line: this.line }; }
 
      // single-char
      const singles = {
        '=': TT.ASSIGN, '+': TT.PLUS,  '-': TT.MINUS,
        '*': TT.MULTIPLY, '/': TT.DIVIDE,
        '<': TT.LESS,    '>': TT.GREATER,
        ';': TT.SEMICOLON, ',': TT.COMMA,
        '(': TT.LPAREN,  ')': TT.RPAREN,
        '{': TT.LBRACE,  '}': TT.RBRACE
      };
      if (singles[this.current]) {
        const t = { type: singles[this.current], value: this.current, line: this.line };
        this.advance(); return t;
      }
 
      throw new Error(`[Lexer] Unknown character '${this.current}' at line ${this.line}`);
    }
    return { type: TT.EOF, value: null, line: this.line };
  }
 
  tokenize() {
    const tokens = [];
    let t;
    do { t = this.nextToken(); tokens.push(t); } while (t.type !== TT.EOF);
    return tokens;
  }
}
 
// ─────────────────────────────────────────────
// PARSER → AST
// ─────────────────────────────────────────────
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos    = 0;
    this.current = tokens[0];
  }
 
  eat(type) {
    if (this.current.type !== type)
      throw new Error(`[Parser] Expected ${type} but got ${this.current.type} ('${this.current.value}') at line ${this.current.line}`);
    const t = this.current;
    this.pos++;
    this.current = this.tokens[this.pos] || { type: TT.EOF, value: null };
    return t;
  }
 
  parse() {
    const stmts = [];
    while (this.current.type !== TT.EOF) stmts.push(this.statement());
    return { kind: 'Program', statements: stmts };
  }
 
  statement() {
    const { type } = this.current;
    if (type === TT.INT || type === TT.FLOAT) return this.varDecl();
    if (type === TT.IDENTIFIER)               return this.assignment();
    if (type === TT.PRINT)                    return this.printStmt();
    if (type === TT.IF)                       return this.ifStmt();
    if (type === TT.WHILE)                    return this.whileStmt();
    throw new Error(`[Parser] Unexpected token ${this.current.type} at line ${this.current.line}`);
  }
 
  varDecl() {
    const varType = this.current.value;
    this.eat(this.current.type); // INT or FLOAT
    const name = this.eat(TT.IDENTIFIER).value;
    this.eat(TT.ASSIGN);
    const value = this.expression();
    this.eat(TT.SEMICOLON);
    return { kind: 'VarDecl', varType, name, value };
  }
 
  assignment() {
    const name = this.eat(TT.IDENTIFIER).value;
    this.eat(TT.ASSIGN);
    const value = this.expression();
    this.eat(TT.SEMICOLON);
    return { kind: 'Assignment', name, value };
  }
 
  printStmt() {
    this.eat(TT.PRINT);
    this.eat(TT.LPAREN);
    const expr = this.expression();
    this.eat(TT.RPAREN);
    this.eat(TT.SEMICOLON);
    return { kind: 'Print', expression: expr };
  }
 
  ifStmt() {
    this.eat(TT.IF);
    this.eat(TT.LPAREN);
    const condition = this.expression();
    this.eat(TT.RPAREN);
    this.eat(TT.LBRACE);
    const body = [];
    while (this.current.type !== TT.RBRACE) body.push(this.statement());
    this.eat(TT.RBRACE);
    let elseBody = null;
    if (this.current.type === TT.ELSE) {
      this.eat(TT.ELSE);
      this.eat(TT.LBRACE);
      elseBody = [];
      while (this.current.type !== TT.RBRACE) elseBody.push(this.statement());
      this.eat(TT.RBRACE);
    }
    return { kind: 'If', condition, body, elseBody };
  }
 
  whileStmt() {
    this.eat(TT.WHILE);
    this.eat(TT.LPAREN);
    const condition = this.expression();
    this.eat(TT.RPAREN);
    this.eat(TT.LBRACE);
    const body = [];
    while (this.current.type !== TT.RBRACE) body.push(this.statement());
    this.eat(TT.RBRACE);
    return { kind: 'While', condition, body };
  }
 
  // expression → term ((+ | -) term)*
  expression() {
    let node = this.term();
    while ([TT.PLUS, TT.MINUS, TT.EQUAL, TT.NOT_EQUAL,
            TT.LESS, TT.LESS_EQUAL, TT.GREATER, TT.GREATER_EQUAL].includes(this.current.type)) {
      const op = this.current.value;
      this.eat(this.current.type);
      node = { kind: 'BinaryExpr', left: node, op, right: this.term() };
    }
    return node;
  }
 
  // term → factor ((* | /) factor)*
  term() {
    let node = this.factor();
    while ([TT.MULTIPLY, TT.DIVIDE].includes(this.current.type)) {
      const op = this.current.value;
      this.eat(this.current.type);
      node = { kind: 'BinaryExpr', left: node, op, right: this.factor() };
    }
    return node;
  }
 
  factor() {
    const t = this.current;
    if (t.type === TT.MINUS) {
      this.eat(TT.MINUS);
      return { kind: 'UnaryExpr', op: '-', operand: this.factor() };
    }
    if (t.type === TT.NUMBER) {
      this.eat(TT.NUMBER);
      return { kind: 'Number', value: t.value };
    }
    if (t.type === TT.IDENTIFIER) {
      this.eat(TT.IDENTIFIER);
      return { kind: 'Variable', name: t.value };
    }
    if (t.type === TT.LPAREN) {
      this.eat(TT.LPAREN);
      const node = this.expression();
      this.eat(TT.RPAREN);
      return node;
    }
    throw new Error(`[Parser] Unexpected factor token ${t.type} at line ${t.line}`);
  }
}
 
// ─────────────────────────────────────────────
// SEMANTIC ANALYZER — type checking only
// ─────────────────────────────────────────────
class SemanticAnalyzer {
  constructor() {
    this.symbols = {}; // name → {type}
  }
 
  analyze(node) { return this.visit(node); }
 
  visit(node) {
    const m = 'visit_' + node.kind;
    if (this[m]) return this[m](node);
    throw new Error(`[Semantic] No visitor for ${node.kind}`);
  }
 
  visit_Program(n)    { n.statements.forEach(s => this.visit(s)); }
 
  visit_VarDecl(n) {
    if (this.symbols[n.name])
      throw new Error(`[Semantic] Variable '${n.name}' already declared`);
    const t = this.visit(n.value);
    this.symbols[n.name] = { type: n.varType || t };
    return n.varType || t;
  }
 
  visit_Assignment(n) {
    if (!this.symbols[n.name])
      throw new Error(`[Semantic] Variable '${n.name}' not declared`);
    return this.visit(n.value);
  }
 
  visit_Print(n)      { return this.visit(n.expression); }
 
  visit_If(n) {
    this.visit(n.condition);
    n.body.forEach(s => this.visit(s));
    if (n.elseBody) n.elseBody.forEach(s => this.visit(s));
  }
 
  visit_While(n) {
    this.visit(n.condition);
    n.body.forEach(s => this.visit(s));
  }
 
  visit_Number(n)     { return Number.isInteger(n.value) ? 'int' : 'float'; }
 
  visit_Variable(n) {
    if (!this.symbols[n.name])
      throw new Error(`[Semantic] Variable '${n.name}' not declared`);
    return this.symbols[n.name].type;
  }
 
  visit_BinaryExpr(n) {
    this.visit(n.left);
    this.visit(n.right);
    return 'int';
  }
 
  visit_UnaryExpr(n)  { return this.visit(n.operand); }
}
 
// ─────────────────────────────────────────────
// IR GENERATOR
// ─────────────────────────────────────────────
class IRGenerator {
  constructor() {
    this.instructions = [];
    this._labelCount  = 0;
  }
 
  newLabel() { return `L${this._labelCount++}`; }
 
  emit(op, arg = null) {
    this.instructions.push({ op, arg });
  }
 
  generate(node) {
    this.visit(node);
    return this.instructions;
  }
 
  visit(node) {
    const m = 'visit_' + node.kind;
    if (this[m]) return this[m](node);
    throw new Error(`[IR] No visitor for ${node.kind}`);
  }
 
  visit_Program(n)    { n.statements.forEach(s => this.visit(s)); }
 
  visit_VarDecl(n)    { this.visit(n.value); this.emit('STORE', n.name); }
  visit_Assignment(n) { this.visit(n.value); this.emit('STORE', n.name); }
  visit_Print(n)      { this.visit(n.expression); this.emit('PRINT'); }
 
  visit_If(n) {
    const elseL = this.newLabel(), endL = this.newLabel();
    this.visit(n.condition);
    this.emit('JUMP_IF_FALSE', elseL);
    n.body.forEach(s => this.visit(s));
    this.emit('JUMP', endL);
    this.emit('LABEL', elseL);
    if (n.elseBody) n.elseBody.forEach(s => this.visit(s));
    this.emit('LABEL', endL);
  }
 
  visit_While(n) {
    const startL = this.newLabel(), endL = this.newLabel();
    this.emit('LABEL', startL);
    this.visit(n.condition);
    this.emit('JUMP_IF_FALSE', endL);
    n.body.forEach(s => this.visit(s));
    this.emit('JUMP', startL);
    this.emit('LABEL', endL);
  }
 
  visit_Number(n)     { this.emit('LOAD_CONST', n.value); }
  visit_Variable(n)   { this.emit('LOAD_VAR', n.name); }
  visit_UnaryExpr(n)  { this.visit(n.operand); this.emit('NEG'); }
 
  visit_BinaryExpr(n) {
    this.visit(n.left);
    this.visit(n.right);
    const ops = { '+':'ADD', '-':'SUB', '*':'MUL', '/':'DIV',
                  '==':'EQ', '!=':'NEQ', '<':'LT', '<=':'LTE', '>':'GT', '>=':'GTE' };
    const op = ops[n.op];
    if (!op) throw new Error(`[IR] Unknown operator ${n.op}`);
    this.emit(op);
  }
}
 
// ─────────────────────────────────────────────
// EXECUTOR — produces snapshots (no side effects)
// ─────────────────────────────────────────────
function buildSnapshots(instructions) {
  const snapshots = [];
  let stack  = [];
  let memory = {};
  const output = [];
 
  // build label index
  const labels = {};
  instructions.forEach((instr, i) => {
    if (instr.op === 'LABEL') labels[instr.arg] = i;
  });
 
  let ip = 0;
  const MAX_STEPS = 10000; // guard against infinite loops
  let steps = 0;
 
  while (ip < instructions.length && steps < MAX_STEPS) {
    steps++;
    const instr = instructions[ip];
    const { op, arg } = instr;
 
    // snapshot BEFORE executing this instruction
    snapshots.push({
      instrIndex:  ip,
      stack:       [...stack],
      memory:      { ...memory },
      output:      [...output],
      description: describeInstr(op, arg, stack, memory)
    });
 
    if (op === 'LOAD_CONST') {
      stack.push(arg);
    } else if (op === 'LOAD_VAR') {
      if (!(arg in memory)) throw new Error(`Runtime: '${arg}' not in memory`);
      stack.push(memory[arg]);
    } else if (op === 'STORE') {
      if (!stack.length) throw new Error('Runtime: stack underflow on STORE');
      memory[arg] = stack.pop();
    } else if (op === 'ADD') {
      const b = stack.pop(), a = stack.pop(); stack.push(a + b);
    } else if (op === 'SUB') {
      const b = stack.pop(), a = stack.pop(); stack.push(a - b);
    } else if (op === 'MUL') {
      const b = stack.pop(), a = stack.pop(); stack.push(a * b);
    } else if (op === 'DIV') {
      const b = stack.pop(), a = stack.pop();
      if (b === 0) throw new Error('Runtime: division by zero');
      stack.push(a / b);
    } else if (op === 'NEG') {
      stack.push(-stack.pop());
    } else if (op === 'EQ')  { const b=stack.pop(),a=stack.pop(); stack.push(a===b?1:0); }
      else if (op === 'NEQ') { const b=stack.pop(),a=stack.pop(); stack.push(a!==b?1:0); }
      else if (op === 'LT')  { const b=stack.pop(),a=stack.pop(); stack.push(a<b?1:0); }
      else if (op === 'LTE') { const b=stack.pop(),a=stack.pop(); stack.push(a<=b?1:0); }
      else if (op === 'GT')  { const b=stack.pop(),a=stack.pop(); stack.push(a>b?1:0); }
      else if (op === 'GTE') { const b=stack.pop(),a=stack.pop(); stack.push(a>=b?1:0); }
    else if (op === 'PRINT') {
      const v = stack.pop();
      output.push(v);
    } else if (op === 'LABEL') {
      // no-op
    } else if (op === 'JUMP') {
      ip = labels[arg];
      continue;
    } else if (op === 'JUMP_IF_FALSE') {
      const v = stack.pop();
      if (!v) { ip = labels[arg]; continue; }
    } else {
      throw new Error(`Runtime: Unknown instruction ${op}`);
    }
 
    ip++;
  }
 
  // final snapshot (after last instruction)
  snapshots.push({
    instrIndex:  -1,
    stack:       [...stack],
    memory:      { ...memory },
    output:      [...output],
    description: 'Execution complete'
  });
 
  return { snapshots, output };
}
 
function describeInstr(op, arg, stack, memory) {
  switch (op) {
    case 'LOAD_CONST':    return `Push constant ${arg} onto stack`;
    case 'LOAD_VAR':      return `Load variable '${arg}' (= ${memory[arg] ?? '?'}) onto stack`;
    case 'STORE':         return `Store top of stack into '${arg}'`;
    case 'ADD':           return `Add top two values on stack`;
    case 'SUB':           return `Subtract top two values on stack`;
    case 'MUL':           return `Multiply top two values on stack`;
    case 'DIV':           return `Divide top two values on stack`;
    case 'NEG':           return `Negate top of stack`;
    case 'PRINT':         return `Print top of stack`;
    case 'LABEL':         return `Label: ${arg}`;
    case 'JUMP':          return `Jump to ${arg}`;
    case 'JUMP_IF_FALSE': return `Jump to ${arg} if top of stack is false`;
    default:              return `${op} ${arg ?? ''}`;
  }
}
 
// ─────────────────────────────────────────────
// AST PRETTY PRINTER
// ─────────────────────────────────────────────
function printAST(node, indent = 0) {
  const pad = '  '.repeat(indent);
  if (!node || typeof node !== 'object') return `${pad}${node}`;
 
  switch (node.kind) {
    case 'Program':
      return `${pad}Program\n` + node.statements.map(s => printAST(s, indent + 1)).join('\n');
    case 'VarDecl':
      return `${pad}VarDecl [${node.varType}] ${node.name}\n${printAST(node.value, indent + 1)}`;
    case 'Assignment':
      return `${pad}Assign ${node.name}\n${printAST(node.value, indent + 1)}`;
    case 'Print':
      return `${pad}Print\n${printAST(node.expression, indent + 1)}`;
    case 'BinaryExpr':
      return `${pad}Binary (${node.op})\n${printAST(node.left, indent+1)}\n${printAST(node.right, indent+1)}`;
    case 'UnaryExpr':
      return `${pad}Unary (${node.op})\n${printAST(node.operand, indent+1)}`;
    case 'Number':
      return `${pad}Number(${node.value})`;
    case 'Variable':
      return `${pad}Var(${node.name})`;
    default:
      return `${pad}${node.kind}`;
  }
}
 
// ─────────────────────────────────────────────
// PSEUDOCODE GENERATOR
// ─────────────────────────────────────────────
function generatePseudocode(ast) {
  const lines = [];
  function visit(node, depth = 0) {
    const pad = '  '.repeat(depth);
    switch (node.kind) {
      case 'Program':
        node.statements.forEach(s => visit(s, depth));
        break;
      case 'VarDecl':
        lines.push({ text: `${pad}DECLARE ${node.varType} ${node.name} ← ${exprToStr(node.value)}`, depth });
        break;
      case 'Assignment':
        lines.push({ text: `${pad}SET ${node.name} ← ${exprToStr(node.value)}`, depth });
        break;
      case 'Print':
        lines.push({ text: `${pad}PRINT ${exprToStr(node.expression)}`, depth });
        break;
      case 'If':
        lines.push({ text: `${pad}IF ${exprToStr(node.condition)} THEN`, depth });
        node.body.forEach(s => visit(s, depth + 1));
        if (node.elseBody) {
          lines.push({ text: `${pad}ELSE`, depth });
          node.elseBody.forEach(s => visit(s, depth + 1));
        }
        lines.push({ text: `${pad}END IF`, depth });
        break;
      case 'While':
        lines.push({ text: `${pad}WHILE ${exprToStr(node.condition)} DO`, depth });
        node.body.forEach(s => visit(s, depth + 1));
        lines.push({ text: `${pad}END WHILE`, depth });
        break;
    }
  }
  visit(ast);
  return lines;
}
 
function exprToStr(node) {
  switch (node.kind) {
    case 'Number':     return String(node.value);
    case 'Variable':   return node.name;
    case 'BinaryExpr': return `${exprToStr(node.left)} ${node.op} ${exprToStr(node.right)}`;
    case 'UnaryExpr':  return `${node.op}${exprToStr(node.operand)}`;
    default:           return '?';
  }
}
 
// ─────────────────────────────────────────────
// MAIN COMPILE FUNCTION (called by main.js)
// ─────────────────────────────────────────────
function compile(sourceCode) {
  const result = {
    tokens: [], ast: null, pseudocode: [],
    irInstructions: [], snapshots: [], output: [],
    errors: []
  };
 
  try {
    // 1. Lex
    const lexer = new Lexer(sourceCode);
    result.tokens = lexer.tokenize();
 
    // 2. Parse
    const parser = new Parser(result.tokens);
    result.ast = parser.parse();
 
    // 3. Semantic
    const sem = new SemanticAnalyzer();
    sem.analyze(result.ast);
 
    // 4. Pseudocode
    result.pseudocode = generatePseudocode(result.ast);
 
    // 5. IR
    const irGen = new IRGenerator();
    result.irInstructions = irGen.generate(result.ast);
 
    // 6. Build snapshots
    const { snapshots, output } = buildSnapshots(result.irInstructions);
    result.snapshots = snapshots;
    result.output    = output;
 
  } catch (e) {
    result.errors.push(e.message);
  }
 
  return result;
}
 
// ─────────────────────────────────────────────
// BACKEND MODE — calls Python Flask server
// ─────────────────────────────────────────────
 
const BACKEND_URL = 'http://localhost:5000';
 
// Current mode: 'js' | 'python'
let _compilerMode = 'js';
 
function getMode()   { return _compilerMode; }
function setMode(m)  { _compilerMode = m; }
 
/**
 * Compile via Python Flask backend.
 * Returns a Promise that resolves to the same shape as compile().
 */
async function compileViaBackend(sourceCode) {
  const result = {
    tokens: [], ast: null, pseudocode: [],
    irInstructions: [], snapshots: [], output: [],
    symbolTable: {}, errors: []
  };
 
  try {
    const res = await fetch(`${BACKEND_URL}/compile`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: sourceCode })
    });
 
    if (!res.ok) {
      result.errors.push(`[Server] HTTP ${res.status} — is the backend running?`);
      return result;
    }
 
    const data = await res.json();
 
    // Map server response fields to frontend State fields
    result.tokens         = data.tokens        || [];
    result.ast            = data.ast           || null;
    result.pseudocode     = data.pseudocode    || [];
    result.irInstructions = (data.ir || []).map(i => ({ op: i.op, arg: i.arg }));
    result.snapshots      = data.snapshots     || [];
    result.symbolTable    = data.symbolTable   || {};
    result.errors         = data.errors        || [];
 
    // Normalize token format (server returns {type,value,line}, JS has same shape)
    // Normalize snapshots (server: instrIndex → instrIndex, same shape)
 
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      result.errors.push('[Server] Cannot connect to backend. Run: python3 server.py');
    } else {
      result.errors.push(`[Server] ${err.message}`);
    }
  }
 
  return result;
}
 
/**
 * Check if backend is reachable.
 * Returns Promise<boolean>
 */
async function pingBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
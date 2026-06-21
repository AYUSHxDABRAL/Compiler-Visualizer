import json
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
 
# ── compiler pipeline imports ─────────────────────
from lexer.lexer import Lexer
from lexer.token_types import TokenType
from parser.parser import Parser
from semantic.semantic_analyzer import SemanticAnalyzer
from ir.ir_generator import IRGenerator
from runtime.executor import Executor
 
app = Flask(__name__)
CORS(app)   # allow browser requests from any origin (index.html, app.html)
 
 
# ─────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────
 
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Pseudocode Visualizer backend running"})
 
 
# ─────────────────────────────────────────────────
# COMPILE ENDPOINT
# ─────────────────────────────────────────────────
 
@app.route("/compile", methods=["POST"])
def compile_code():
    """
    Accepts JSON: { "code": "<source code string>" }
    Returns JSON with:
      tokens        — list of {type, value, line}
      ast           — nested dict representation of the AST
      pseudocode    — list of {text, depth}
      ir            — list of {op, arg}
      snapshots     — list of {instrIndex, stack, memory, output, description}
      symbolTable   — final {name: {type, value}} after full execution
      errors        — list of error strings (empty if no errors)
    """
 
    body = request.get_json(silent=True)
    if not body or "code" not in body:
        return jsonify({"errors": ["Request must include a 'code' field"]}), 400
 
    code = body["code"]
    result = {
        "tokens":      [],
        "ast":         None,
        "pseudocode":  [],
        "ir":          [],
        "snapshots":   [],
        "symbolTable": {},
        "errors":      []
    }
 
    # ── 1. Lex ──────────────────────────────────────
    try:
        lexer  = Lexer(code)
        tokens = lexer.tokenize()
        result["tokens"] = [
            {"type": t.type.name, "value": t.value, "line": t.line}
            for t in tokens
            if t.type != TokenType.EOF
        ]
    except Exception as e:
        result["errors"].append(str(e))
        return jsonify(result)
 
    # ── 2. Parse ─────────────────────────────────────
    try:
        lexer2 = Lexer(code)
        parser = Parser(lexer2)
        ast    = parser.parse()
        result["ast"] = ast_to_dict(ast)
    except Exception as e:
        result["errors"].append(str(e))
        return jsonify(result)
 
    # ── 3. Semantic Analysis ──────────────────────────
    try:
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)
    except Exception as e:
        result["errors"].append(str(e))
        return jsonify(result)
 
    # ── 4. Pseudocode ────────────────────────────────
    try:
        result["pseudocode"] = generate_pseudocode(ast)
    except Exception as e:
        result["errors"].append(f"[Pseudocode] {e}")
 
    # ── 5. IR Generation ─────────────────────────────
    try:
        ir_gen       = IRGenerator()
        instructions = ir_gen.generate(ast)
        result["ir"] = [
            {"op": instr.operation, "arg": instr.argument}
            for instr in instructions
        ]
    except Exception as e:
        result["errors"].append(str(e))
        return jsonify(result)
 
    # ── 6. Build Snapshots (step-by-step execution) ──
    try:
        snapshots, symbol_table = build_snapshots(instructions)
        result["snapshots"]   = snapshots
        result["symbolTable"] = symbol_table
    except Exception as e:
        result["errors"].append(str(e))
 
    return jsonify(result)
 
 
# ─────────────────────────────────────────────────
# AST → DICT (JSON-serialisable)
# ─────────────────────────────────────────────────
 
def ast_to_dict(node):
    """Recursively convert AST node objects to plain dicts."""
    if node is None:
        return None
 
    t = type(node).__name__
 
    if t == "Program":
        return {"kind": "Program",
                "statements": [ast_to_dict(s) for s in node.statements]}
 
    if t == "VariableDeclaration":
        return {"kind": "VarDecl",
                "varType": node.var_type,
                "name":    node.name,
                "value":   ast_to_dict(node.value)}
 
    if t == "Assignment":
        return {"kind": "Assignment",
                "name":  node.name,
                "value": ast_to_dict(node.value)}
 
    if t == "PrintStatement":
        return {"kind": "Print",
                "expression": ast_to_dict(node.expression)}
 
    if t == "IfStatement":
        return {"kind":     "If",
                "condition": ast_to_dict(node.condition),
                "body":      [ast_to_dict(s) for s in node.body],
                "elseBody":  [ast_to_dict(s) for s in node.else_body] if node.else_body else None}
 
    if t == "WhileStatement":
        return {"kind":      "While",
                "condition": ast_to_dict(node.condition),
                "body":      [ast_to_dict(s) for s in node.body]}
 
    if t == "BinaryExpression":
        return {"kind":  "BinaryExpr",
                "left":  ast_to_dict(node.left),
                "op":    node.operator,
                "right": ast_to_dict(node.right)}
 
    if t == "UnaryExpression":
        return {"kind":    "UnaryExpr",
                "op":      node.operator,
                "operand": ast_to_dict(node.operand)}
 
    if t == "Number":
        return {"kind": "Number", "value": node.value}
 
    if t == "Variable":
        return {"kind": "Variable", "name": node.name}
 
    return {"kind": t}
 
 
# ─────────────────────────────────────────────────
# PSEUDOCODE GENERATOR
# ─────────────────────────────────────────────────
 
def generate_pseudocode(ast):
    """Generate human-readable pseudocode lines from the AST."""
    lines = []
 
    def expr_str(node):
        t = type(node).__name__
        if t == "Number":    return str(node.value)
        if t == "Variable":  return node.name
        if t == "BinaryExpression":
            return f"{expr_str(node.left)} {node.operator} {expr_str(node.right)}"
        if t == "UnaryExpression":
            return f"{node.operator}{expr_str(node.operand)}"
        return "?"
 
    def visit(node, depth=0):
        pad = "  " * depth
        t   = type(node).__name__
 
        if t == "Program":
            for s in node.statements:
                visit(s, depth)
 
        elif t == "VariableDeclaration":
            lines.append({"text": f"{pad}DECLARE {node.var_type} {node.name} \u2190 {expr_str(node.value)}", "depth": depth})
 
        elif t == "Assignment":
            lines.append({"text": f"{pad}SET {node.name} \u2190 {expr_str(node.value)}", "depth": depth})
 
        elif t == "PrintStatement":
            lines.append({"text": f"{pad}PRINT {expr_str(node.expression)}", "depth": depth})
 
        elif t == "IfStatement":
            lines.append({"text": f"{pad}IF {expr_str(node.condition)} THEN", "depth": depth})
            for s in node.body:
                visit(s, depth + 1)
            if node.else_body:
                lines.append({"text": f"{pad}ELSE", "depth": depth})
                for s in node.else_body:
                    visit(s, depth + 1)
            lines.append({"text": f"{pad}END IF", "depth": depth})
 
        elif t == "WhileStatement":
            lines.append({"text": f"{pad}WHILE {expr_str(node.condition)} DO", "depth": depth})
            for s in node.body:
                visit(s, depth + 1)
            lines.append({"text": f"{pad}END WHILE", "depth": depth})
 
    visit(ast)
    return lines
 
 
# ─────────────────────────────────────────────────
# SNAPSHOT BUILDER (step-by-step execution trace)
# ─────────────────────────────────────────────────
 
def build_snapshots(instructions):
    """
    Execute IR instructions and capture a snapshot after each one.
    Returns (snapshots_list, final_symbol_table).
    Each snapshot: {instrIndex, stack, memory, output, description}
    """
    snapshots = []
    stack     = []
    memory    = {}
    output    = []
 
    # Pre-build label index
    labels = {}
    for i, instr in enumerate(instructions):
        if instr.operation == "LABEL":
            labels[instr.argument] = i
 
    ip        = 0
    MAX_STEPS = 100_000
 
    for _ in range(MAX_STEPS):
        if ip >= len(instructions):
            break
 
        instr = instructions[ip]
        op    = instr.operation
        arg   = instr.argument
 
        # snapshot BEFORE executing
        snapshots.append({
            "instrIndex":  ip,
            "stack":       list(stack),
            "memory":      dict(memory),
            "output":      list(output),
            "description": describe(op, arg, stack, memory)
        })
 
        jumped = False
 
        if   op == "LOAD_CONST": stack.append(arg)
        elif op == "LOAD_VAR":
            if arg not in memory:
                raise Exception(f"[Runtime] Variable '{arg}' not in memory")
            stack.append(memory[arg])
        elif op == "STORE":
            memory[arg] = stack.pop()
        elif op == "ADD":  b,a = stack.pop(),stack.pop(); stack.append(a+b)
        elif op == "SUB":  b,a = stack.pop(),stack.pop(); stack.append(a-b)
        elif op == "MUL":  b,a = stack.pop(),stack.pop(); stack.append(a*b)
        elif op == "DIV":
            b,a = stack.pop(),stack.pop()
            if b == 0: raise Exception("[Runtime] Division by zero")
            stack.append(a/b)
        elif op == "NEG":  stack.append(-stack.pop())
        elif op == "EQ":   b,a=stack.pop(),stack.pop(); stack.append(1 if a==b else 0)
        elif op == "NEQ":  b,a=stack.pop(),stack.pop(); stack.append(1 if a!=b else 0)
        elif op == "LT":   b,a=stack.pop(),stack.pop(); stack.append(1 if a<b  else 0)
        elif op == "LTE":  b,a=stack.pop(),stack.pop(); stack.append(1 if a<=b else 0)
        elif op == "GT":   b,a=stack.pop(),stack.pop(); stack.append(1 if a>b  else 0)
        elif op == "GTE":  b,a=stack.pop(),stack.pop(); stack.append(1 if a>=b else 0)
        elif op == "PRINT":
            val = stack.pop()
            output.append(val)
        elif op == "LABEL": pass
        elif op == "JUMP":
            ip     = labels[arg]
            jumped = True
        elif op == "JUMP_IF_FALSE":
            val = stack.pop()
            if not val:
                ip     = labels[arg]
                jumped = True
        else:
            raise Exception(f"[Runtime] Unknown instruction '{op}'")
 
        if not jumped:
            ip += 1
 
    # final snapshot
    snapshots.append({
        "instrIndex":  -1,
        "stack":       list(stack),
        "memory":      dict(memory),
        "output":      list(output),
        "description": "Execution complete"
    })
 
    # build symbol table from final memory
    symbol_table = {}
    for name, value in memory.items():
        sym_type = "int" if isinstance(value, int) else "float"
        symbol_table[name] = {"type": sym_type, "value": value}
 
    return snapshots, symbol_table
 
 
def describe(op, arg, stack, memory):
    """Human-readable description of what an instruction does."""
    d = {
        "LOAD_CONST":    f"Push constant {arg} onto stack",
        "LOAD_VAR":      f"Load variable '{arg}' (= {memory.get(arg, '?')}) onto stack",
        "STORE":         f"Store top of stack into '{arg}'",
        "ADD":           "Add top two values on stack",
        "SUB":           "Subtract top two values on stack",
        "MUL":           "Multiply top two values on stack",
        "DIV":           "Divide top two values on stack",
        "NEG":           "Negate top of stack",
        "PRINT":         "Print top of stack",
        "LABEL":         f"Label: {arg}",
        "JUMP":          f"Jump to {arg}",
        "JUMP_IF_FALSE": f"Jump to {arg} if top of stack is false",
        "EQ":  "Check equality (==)",
        "NEQ": "Check not equal (!=)",
        "LT":  "Check less than (<)",
        "LTE": "Check less than or equal (<=)",
        "GT":  "Check greater than (>)",
        "GTE": "Check greater than or equal (>=)",
    }
    return d.get(op, f"{op} {arg or ''}")
 
 
# ─────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────
 
if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    print(f"\n  Pseudocode Visualizer Backend")
    print(f"  Running on http://localhost:{port}")
    print(f"  Press Ctrl+C to stop\n")
    app.run(host="0.0.0.0", port=port, debug=False)
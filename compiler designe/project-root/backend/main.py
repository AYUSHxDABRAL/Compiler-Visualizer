import sys
from lexer.lexer import Lexer
from parser.parser import Parser
from semantic.semantic_analyzer import SemanticAnalyzer
from ir.ir_generator import IRGenerator
from runtime.executor import Executor
 
 
def run(code: str, show_tokens: bool = False, show_ast: bool = False):
    """
    Run the full compiler pipeline on source code string.
    Returns True on success, False on error.
    """
 
    # ── 1. Lex ──────────────────────────────────────
    try:
        lexer  = Lexer(code)
        tokens = lexer.tokenize()
    except Exception as e:
        print(f"[Lexer Error] {e}")
        return False
 
    if show_tokens:
        print("── Tokens ──────────────────────────────")
        for t in tokens:
            print(f"  {t}")
        print()
 
    # ── 2. Parse ─────────────────────────────────────
    try:
        # Re-lex: Parser drives get_next_token() itself
        lexer2 = Lexer(code)
        parser = Parser(lexer2)
        ast    = parser.parse()
    except Exception as e:
        print(f"[Parser Error] {e}")
        return False
 
    if show_ast:
        print("── AST ─────────────────────────────────")
        print(ast)
        print()
 
    # ── 3. Semantic Analysis ─────────────────────────
    try:
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)
    except Exception as e:
        print(f"[Semantic Error] {e}")
        return False
 
    # ── 4. IR Generation ─────────────────────────────
    try:
        ir_gen       = IRGenerator()
        instructions = ir_gen.generate(ast)
    except Exception as e:
        print(f"[IR Error] {e}")
        return False
 
    print("── Generated IR ────────────────────────")
    for i, instr in enumerate(instructions):
        print(f"  {i:>3}  {instr}")
    print()
 
    # ── 5. Execute ───────────────────────────────────
    try:
        print("── Program Output ──────────────────────")
        executor = Executor(instructions)
        executor.run()
        print()
        print("── Final Memory ────────────────────────")
        for name, value in executor.memory.variables.items():
            print(f"  {name} = {value}")
    except Exception as e:
        print(f"[Runtime Error] {e}")
        return False
 
    return True
 
 
def main():
    # ── CLI usage: python3 main.py [file.txt] ────────
    if len(sys.argv) >= 2:
        path = sys.argv[1]
        try:
            with open(path, "r") as f:
                code = f.read()
        except FileNotFoundError:
            print(f"[Error] File not found: {path}")
            sys.exit(1)
    else:
        # Default hardcoded sample — runs when no file is given
        code = """
int a = 5 + 3;
a = a + 2;
print(a);
 
int b = a * 2;
print(b);
 
int x = 10;
int y = 3;
if (x > y) {
    int diff = x - y;
    print(diff);
}
 
int counter = 0;
int limit = 3;
while (counter < limit) {
    counter = counter + 1;
    print(counter);
}
"""
 
    show_tokens = "--tokens" in sys.argv
    show_ast    = "--ast"    in sys.argv
 
    print("── Source Code ─────────────────────────")
    for i, line in enumerate(code.strip().splitlines(), 1):
        print(f"  {i:>3}  {line}")
    print()
 
    success = run(code, show_tokens=show_tokens, show_ast=show_ast)
    sys.exit(0 if success else 1)
 
 
if __name__ == "__main__":
    main()
 
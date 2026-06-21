from ir.ir_instruction import IRInstruction

from parser.ast.program import Program
from parser.ast.statements import VariableDeclaration, Assignment, PrintStatement
from parser.ast.expressions import Number, Variable, BinaryExpression


class IRGenerator:

    def __init__(self):
        self.instructions = []

    def generate(self, node):
        """
        Entry point for IR generation.
        """
        self.visit(node)
        return self.instructions

    def emit(self, operation, argument=None):
        """
        Add instruction to instruction list.
        """
        instr = IRInstruction(operation, argument)
        self.instructions.append(instr)

    def visit(self, node):
        method_name = f"visit_{type(node).__name__}"
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node):
        raise Exception(f"No IR generation method for {type(node).__name__}")

    # -------------------------
    # Program
    # -------------------------

    def visit_Program(self, node):
        for stmt in node.statements:
            self.visit(stmt)

    # -------------------------
    # Statements
    # -------------------------

    def visit_VariableDeclaration(self, node):

        if node.value:
            self.visit(node.value)

        self.emit("STORE", node.name)

    def visit_Assignment(self, node):

        self.visit(node.value)

        self.emit("STORE", node.name)

    def visit_PrintStatement(self, node):

        self.visit(node.expression)

        self.emit("PRINT")

    # -------------------------
    # Expressions
    # -------------------------

    def visit_Number(self, node):

        self.emit("LOAD_CONST", node.value)

    def visit_Variable(self, node):

        self.emit("LOAD_VAR", node.name)

    def visit_BinaryExpression(self, node):

        self.visit(node.left)
        self.visit(node.right)

        if node.operator == "+":
            self.emit("ADD")

        elif node.operator == "-":
            self.emit("SUB")

        elif node.operator == "*":
            self.emit("MUL")

        elif node.operator == "/":
            self.emit("DIV")

        else:
            raise Exception(f"Unsupported operator {node.operator}")
from semantic.symbol_table import SymbolTable
from parser.ast.statements import VariableDeclaration, Assignment, PrintStatement
from parser.ast.expressions import Number, Variable, BinaryExpression
from parser.ast.program import Program


class SemanticAnalyzer:

    def __init__(self):
        self.symbol_table = SymbolTable()

    def analyze(self, node):
        """Entry point for semantic analysis."""
        self.visit(node)

    def visit(self, node):
        """Dynamic dispatch to visit methods."""
        method_name = f"visit_{type(node).__name__}"
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node):
        raise Exception(f"No visit method defined for {type(node).__name__}")

    # -------------------------
    # Program
    # -------------------------

    def visit_Program(self, node):
        for statement in node.statements:
            self.visit(statement)

    # -------------------------
    # Statements
    # -------------------------

    def visit_VariableDeclaration(self, node):

        name = node.name
        var_type = node.var_type

        if self.symbol_table.exists(name):
            raise Exception(f"Variable '{name}' already declared")

        value = None

        if node.value:
            value = self.visit(node.value)

        self.symbol_table.declare(name, var_type, value)

    def visit_Assignment(self, node):

        if not self.symbol_table.exists(node.name):
            raise Exception(f"Variable '{node.name}' not declared")

        value = self.visit(node.value)

        self.symbol_table.update(node.name, value)

    def visit_PrintStatement(self, node):

        self.visit(node.expression)

    # -------------------------
    # Expressions
    # -------------------------

    def visit_Number(self, node):
        return node.value

    def visit_Variable(self, node):

        symbol = self.symbol_table.lookup(node.name)

        return symbol.value

    def visit_BinaryExpression(self, node):

        left = self.visit(node.left)
        right = self.visit(node.right)

        if node.operator == "+":
            return left + right

        if node.operator == "-":
            return left - right

        if node.operator == "*":
            return left * right

        if node.operator == "/":
            return left / right

        raise Exception(f"Unknown operator {node.operator}")
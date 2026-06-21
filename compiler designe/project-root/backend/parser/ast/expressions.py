from parser.ast.base import ASTNode


class Number(ASTNode):

    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return f"Number({self.value})"


class Variable(ASTNode):

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Variable({self.name})"


class BinaryExpression(ASTNode):

    def __init__(self, left, operator, right):
        self.left = left
        self.operator = operator
        self.right = right

    def __repr__(self):
        return f"Binary({self.left} {self.operator} {self.right})"
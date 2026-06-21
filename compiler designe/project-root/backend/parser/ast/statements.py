from parser.ast.base import ASTNode


class VariableDeclaration(ASTNode):

    def __init__(self, var_type, name, value):
        self.var_type = var_type
        self.name = name
        self.value = value

    def __repr__(self):
        return f"VariableDeclaration(type={self.var_type}, name={self.name}, value={self.value})"


class Assignment(ASTNode):

    def __init__(self, name, value):
        self.name = name
        self.value = value

    def __repr__(self):
        return f"Assignment(name={self.name}, value={self.value})"


class PrintStatement(ASTNode):

    def __init__(self, expression):
        self.expression = expression

    def __repr__(self):
        return f"Print({self.expression})"


class IfStatement(ASTNode):

    def __init__(self, condition, body):
        self.condition = condition
        self.body = body

    def __repr__(self):
        return f"If(condition={self.condition}, body={self.body})"


class WhileStatement(ASTNode):

    def __init__(self, condition, body):
        self.condition = condition
        self.body = body

    def __repr__(self):
        return f"While(condition={self.condition}, body={self.body})"
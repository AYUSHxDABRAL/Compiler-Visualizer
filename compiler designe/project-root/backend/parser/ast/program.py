from parser.ast.base import ASTNode


class Program(ASTNode):
    """
    Root node representing the entire program.
    """

    def __init__(self, statements):
        self.statements = statements

    def __repr__(self):
        return f"Program(statements={self.statements})"
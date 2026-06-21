class ASTNode:
    """
    Base class for all AST nodes.
    """

    def __init__(self):
        pass

    def __repr__(self):
        return self.__class__.__name__
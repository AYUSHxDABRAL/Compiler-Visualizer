class IRInstruction:
    """
    Represents a single intermediate representation instruction.
    """

    def __init__(self, operation, argument=None):
        self.operation = operation
        self.argument = argument

    def __repr__(self):

        if self.argument is not None:
            return f"{self.operation} {self.argument}"

        return f"{self.operation}"
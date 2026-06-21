class Symbol:

    def __init__(self, name, var_type, value=None):
        self.name = name
        self.type = var_type
        self.value = value

    def __repr__(self):
        return f"{self.name}: {self.type} = {self.value}"


class SymbolTable:

    def __init__(self):
        self.symbols = {}

    def declare(self, name, var_type, value=None):
        """
        Declare a new variable in the symbol table.
        """

        if name in self.symbols:
            raise Exception(f"Variable '{name}' already declared")

        symbol = Symbol(name, var_type, value)
        self.symbols[name] = symbol

    def lookup(self, name):
        """
        Retrieve variable information.
        """

        symbol = self.symbols.get(name)

        if symbol is None:
            raise Exception(f"Variable '{name}' not declared")

        return symbol

    def update(self, name, value):
        """
        Update variable value during execution.
        """

        symbol = self.lookup(name)
        symbol.value = value

    def exists(self, name):
        """
        Check if variable exists in the table.
        """

        return name in self.symbols

    def __repr__(self):

        return "\n".join(str(symbol) for symbol in self.symbols.values())
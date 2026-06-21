class Memory:
    """
    Represents runtime memory where variable values are stored.
    """

    def __init__(self):
        self.variables = {}

    def store(self, name, value):
        """Store a variable in memory."""
        self.variables[name] = value

    def load(self, name):
        """Retrieve variable value."""
        if name not in self.variables:
            raise Exception(f"Variable '{name}' not found in memory")

        return self.variables[name]

    def update(self, name, value):
        """Update existing variable value."""
        if name not in self.variables:
            raise Exception(f"Variable '{name}' not found")

        self.variables[name] = value

    def snapshot(self):
        """Return copy of memory state."""
        return dict(self.variables)

    def __repr__(self):
        return str(self.variables)
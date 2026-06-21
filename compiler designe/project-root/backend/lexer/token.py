class Token:
    """
    Represents a single token produced by the lexer.
    """

    def __init__(self, token_type, value=None, line=1):
        self.type = token_type
        self.value = value
        self.line = line

    def __repr__(self):
        """
        Debug representation of the token.
        Example:
        Token(TokenType.IDENTIFIER, 'a', line=1)
        """
        return f"Token({self.type}, {repr(self.value)}, line={self.line})"
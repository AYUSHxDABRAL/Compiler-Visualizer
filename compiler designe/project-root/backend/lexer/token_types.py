from enum import Enum, auto


class TokenType(Enum):
    # Keywords
    INT = auto()
    FLOAT = auto()
    IF = auto()
    ELSE = auto()
    WHILE = auto()
    PRINT = auto()

    # Identifiers & literals
    IDENTIFIER = auto()
    NUMBER = auto()

    # Operators
    ASSIGN = auto()
    PLUS = auto()
    MINUS = auto()
    MULTIPLY = auto()
    DIVIDE = auto()

    # Comparison operators
    EQUAL = auto()
    NOT_EQUAL = auto()
    LESS = auto()
    LESS_EQUAL = auto()
    GREATER = auto()
    GREATER_EQUAL = auto()

    # Symbols
    SEMICOLON = auto()
    COMMA = auto()

    # Parentheses
    LPAREN = auto()
    RPAREN = auto()

    # Block symbols
    LBRACE = auto()
    RBRACE = auto()

    # End of file
    EOF = auto()
from lexer.token import Token
from lexer.token_types import TokenType


class Lexer:
    def __init__(self, source_code):
        self.source = source_code
        self.position = 0
        self.current_char = self.source[self.position] if self.source else None
        self.line = 1

    def advance(self):
        """Move to the next character."""
        self.position += 1

        if self.position >= len(self.source):
            self.current_char = None
        else:
            self.current_char = self.source[self.position]

    def skip_whitespace(self):
        """Skip spaces and newlines."""
        while self.current_char is not None and self.current_char.isspace():
            if self.current_char == "\n":
                self.line += 1
            self.advance()

    def number(self):
        """Parse numeric literals."""
        result = ""

        while self.current_char is not None and self.current_char.isdigit():
            result += self.current_char
            self.advance()

        return Token(TokenType.NUMBER, int(result), self.line)

    def identifier(self):
        """Parse identifiers and keywords."""
        result = ""

        while self.current_char is not None and (
            self.current_char.isalnum() or self.current_char == "_"
        ):
            result += self.current_char
            self.advance()

        keywords = {
            "int": TokenType.INT,
            "float": TokenType.FLOAT,
            "if": TokenType.IF,
            "else": TokenType.ELSE,
            "while": TokenType.WHILE,
            "print": TokenType.PRINT,
        }

        token_type = keywords.get(result, TokenType.IDENTIFIER)

        return Token(token_type, result, self.line)

    def get_next_token(self):
        """Return the next token from the source code."""

        while self.current_char is not None:

            # Skip whitespace
            if self.current_char.isspace():
                self.skip_whitespace()
                continue

            # Identifier or keyword
            if self.current_char.isalpha() or self.current_char == "_":
                return self.identifier()

            # Number
            if self.current_char.isdigit():
                return self.number()

            # Operators
            if self.current_char == "+":
                self.advance()
                return Token(TokenType.PLUS, "+", self.line)

            if self.current_char == "-":
                self.advance()
                return Token(TokenType.MINUS, "-", self.line)

            if self.current_char == "*":
                self.advance()
                return Token(TokenType.MULTIPLY, "*", self.line)

            if self.current_char == "/":
                self.advance()
                return Token(TokenType.DIVIDE, "/", self.line)

            if self.current_char == "=":
                self.advance()
                return Token(TokenType.ASSIGN, "=", self.line)

            # Symbols
            if self.current_char == ";":
                self.advance()
                return Token(TokenType.SEMICOLON, ";", self.line)

            if self.current_char == "(":
                self.advance()
                return Token(TokenType.LPAREN, "(", self.line)

            if self.current_char == ")":
                self.advance()
                return Token(TokenType.RPAREN, ")", self.line)

            if self.current_char == "{":
                self.advance()
                return Token(TokenType.LBRACE, "{", self.line)

            if self.current_char == "}":
                self.advance()
                return Token(TokenType.RBRACE, "}", self.line)

            raise Exception(f"Invalid character '{self.current_char}' at line {self.line}")

        return Token(TokenType.EOF, None, self.line)
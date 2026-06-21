from lexer.token_types import TokenType
from parser.ast.program import Program
from parser.ast.statements import VariableDeclaration, Assignment, PrintStatement
from parser.ast.expressions import Number, Variable, BinaryExpression


class Parser:

    def __init__(self, lexer):
        self.lexer = lexer
        self.current_token = self.lexer.get_next_token()

    def eat(self, token_type):
        """Consume the expected token."""
        if self.current_token.type == token_type:
            self.current_token = self.lexer.get_next_token()
        else:
            raise Exception(
                f"Unexpected token {self.current_token.type}, expected {token_type}"
            )

    # -------------------------
    # Program
    # -------------------------

    def parse(self):
        statements = []

        while self.current_token.type != TokenType.EOF:
            stmt = self.statement()
            statements.append(stmt)

        return Program(statements)

    # -------------------------
    # Statements
    # -------------------------

    def statement(self):

        if self.current_token.type == TokenType.INT:
            return self.variable_declaration()

        if self.current_token.type == TokenType.IDENTIFIER:
            return self.assignment()

        if self.current_token.type == TokenType.PRINT:
            return self.print_statement()

        raise Exception(f"Invalid statement at {self.current_token}")

    def variable_declaration(self):

        self.eat(TokenType.INT)

        name = self.current_token.value
        self.eat(TokenType.IDENTIFIER)

        self.eat(TokenType.ASSIGN)

        value = self.expression()

        self.eat(TokenType.SEMICOLON)

        return VariableDeclaration("int", name, value)

    def assignment(self):

        name = self.current_token.value
        self.eat(TokenType.IDENTIFIER)

        self.eat(TokenType.ASSIGN)

        value = self.expression()

        self.eat(TokenType.SEMICOLON)

        return Assignment(name, value)

    def print_statement(self):

        self.eat(TokenType.PRINT)
        self.eat(TokenType.LPAREN)

        expr = self.expression()

        self.eat(TokenType.RPAREN)
        self.eat(TokenType.SEMICOLON)

        return PrintStatement(expr)

    # -------------------------
    # Expressions
    # -------------------------

    def expression(self):

        node = self.term()

        while self.current_token.type in (TokenType.PLUS, TokenType.MINUS):

            operator = self.current_token.value

            if self.current_token.type == TokenType.PLUS:
                self.eat(TokenType.PLUS)
            else:
                self.eat(TokenType.MINUS)

            right = self.term()

            node = BinaryExpression(node, operator, right)

        return node

    def term(self):

        node = self.factor()

        while self.current_token.type in (TokenType.MULTIPLY, TokenType.DIVIDE):

            operator = self.current_token.value

            if self.current_token.type == TokenType.MULTIPLY:
                self.eat(TokenType.MULTIPLY)
            else:
                self.eat(TokenType.DIVIDE)

            right = self.factor()

            node = BinaryExpression(node, operator, right)

        return node

    def factor(self):

        token = self.current_token

        if token.type == TokenType.NUMBER:
            self.eat(TokenType.NUMBER)
            return Number(token.value)

        if token.type == TokenType.IDENTIFIER:
            self.eat(TokenType.IDENTIFIER)
            return Variable(token.value)

        if token.type == TokenType.LPAREN:
            self.eat(TokenType.LPAREN)
            node = self.expression()
            self.eat(TokenType.RPAREN)
            return node

        raise Exception(f"Invalid expression {token}")
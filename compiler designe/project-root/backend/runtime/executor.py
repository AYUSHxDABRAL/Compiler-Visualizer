from runtime.memory import Memory


class Executor:
    """
    Executes IR instructions step-by-step.
    """

    def __init__(self, instructions):
        self.instructions = instructions
        self.memory = Memory()
        self.stack = []
        self.instruction_pointer = 0

    def run(self):
        """
        Execute all instructions sequentially.
        """

        while self.instruction_pointer < len(self.instructions):

            instr = self.instructions[self.instruction_pointer]

            operation = instr.operation
            argument = instr.argument

            if operation == "LOAD_CONST":
                self.stack.append(argument)

            elif operation == "LOAD_VAR":
                value = self.memory.load(argument)
                self.stack.append(value)

            elif operation == "STORE":
                value = self.stack.pop()

                if argument in self.memory.variables:
                    self.memory.update(argument, value)
                else:
                    self.memory.store(argument, value)

            elif operation == "ADD":
                b = self.stack.pop()
                a = self.stack.pop()
                self.stack.append(a + b)

            elif operation == "SUB":
                b = self.stack.pop()
                a = self.stack.pop()
                self.stack.append(a - b)

            elif operation == "MUL":
                b = self.stack.pop()
                a = self.stack.pop()
                self.stack.append(a * b)

            elif operation == "DIV":
                b = self.stack.pop()
                a = self.stack.pop()
                self.stack.append(a / b)

            elif operation == "PRINT":
                value = self.stack.pop()
                print("OUTPUT:", value)

            else:
                raise Exception(f"Unknown instruction {operation}")

            self.instruction_pointer += 1
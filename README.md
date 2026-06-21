# Compiler Visualizer

## Overview

Compiler Visualizer is an educational compiler-based system designed to help students understand how a compiler processes source code. The project accepts C-like code as input and demonstrates each phase of compilation, including lexical analysis, syntax analysis, semantic analysis, intermediate representation generation, and execution visualization.

The system provides a graphical interface that allows users to observe compiler internals such as tokens, Abstract Syntax Trees (AST), symbol tables, execution snapshots, and program flow in real time.

---

## Features

* Lexical Analysis (Token Generation)
* Recursive Descent Parsing
* Abstract Syntax Tree (AST) Generation
* Semantic Analysis
* Symbol Table Management
* Intermediate Representation (IR) Generation
* Step-by-Step Execution Visualization
* Execution Snapshot Tracking
* Real-Time Variable State Monitoring
* Frontend and Backend Integration

---

## Architecture

```text
Source Code
    ↓
Lexer
    ↓
Tokens
    ↓
Parser
    ↓
AST
    ↓
Semantic Analyzer
    ↓
IR Generator
    ↓
Execution Engine
    ↓
Visualization Layer
```

---

## Technology Stack

### Backend

* Python
* Flask
* JSON APIs

### Frontend

* HTML5
* CSS3
* JavaScript

---

## Project Structure

```text
Compiler-Visualizer/
│
├── frontend/
│   ├── html
│   ├── css
│   └── js
│
├── backend/
│   ├── lexer/
│   ├── parser/
│   ├── semantic/
│   ├── ir/
│   └── runtime/
│
└── server.py
```

---

## How It Works

1. User enters C-like source code.
2. Lexer converts source code into tokens.
3. Parser validates syntax and generates an AST.
4. Semantic Analyzer performs symbol validation and scope checking.
5. IR Generator converts AST into intermediate instructions.
6. Execution Engine executes instructions step by step.
7. Execution snapshots are sent to the frontend.
8. Frontend visualizes compiler phases and execution flow.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/compiler-visualizer.git
cd compiler-visualizer
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend

```bash
python server.py
```

### Open Frontend

Open:

```text
frontend/index.html
```

or run through a local web server.

---

## Example Input

```c
int x = 5;
int y = 10;

x = x + y;

print(x);
```

---

## Learning Outcomes

This project demonstrates:

* Compiler Design Fundamentals
* Lexical Analysis
* Recursive Descent Parsing
* AST Construction
* Semantic Analysis
* Symbol Table Management
* Intermediate Representation
* Execution Engines
* Frontend-Backend Communication

---

## Future Enhancements

* Conditional Statements (if/else)
* Loop Support
* Function Definitions
* Array Handling
* Optimization Passes
* Bytecode Generation
* Assembly Code Generation

---



## License

This project is developed for educational and learning purposes.

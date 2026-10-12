# CodeGuardian AI — Intelligent Code Review & Bug Prediction

**CodeGuardian AI** is a modern, enterprise-grade, full-stack application that helps software developers detect bugs, security vulnerabilities (CWE/CVE), code smells, and potential system failures before deployment.

Featuring a cybersecurity-inspired UI, an interactive **Monaco Editor**, real-time debounced AST parsing, Bandit static analysis, an explainable severity scoring engine, automated AI fix generation with unified diffs, duplicate issue clustering, and unit test synthesis (pytest, Jest, JUnit 5, Go test).

---

## Architecture Overview

```
                                      ┌─────────────────────────────────────┐
                                      │        CodeGuardian Frontend        │
                                      │  React 19 + Vite + Tailwind + Monaco│
                                      └──────────────────┬──────────────────┘
                                                         │ HTTP / JSON
                                                         ▼
                                      ┌─────────────────────────────────────┐
                                      │       FastAPI Application Core      │
                                      │  Auth (JWT) | Endpoints | Schemas   │
                                      └──────┬───────────┬───────────┬──────┘
                                             │           │           │
                 ┌───────────────────────────┘           │           └───────────────────────────┐
                 ▼                                       ▼                                       ▼
   ┌───────────────────────────┐           ┌───────────────────────────┐           ┌───────────────────────────┐
   │    Static Analyzers       │           │  Scoring & Dedup Services │           │    AI Fix & Test Gen      │
   │  - Python AST Parser      │           │  - Transparent Quality    │           │  - LLM Reasoning (Gemini) │
   │  - Bandit Security Runner │           │    Score (0-100)          │           │  - Unified Diff Synthesis │
   │  - Polyglot Regex Matrix  │           │  - Duplicate Clustering   │           │  - Unit Test Synthesis    │
   │    (JS, TS, Java, C++, Go)│           │  - Risk Breakdown Index   │           │    (pytest/Jest/JUnit/Go) │
   └───────────────────────────┘           └───────────────────────────┘           └───────────────────────────┘
```

---

## Key Features

1. **AI Bug Detection:** Detects potential runtime crashes, null pointer exceptions, unhandled boundary conditions, and logical flaws.
2. **Security Vulnerability Scanner:** Detects SQL Injection (CWE-89), Cross-Site Scripting (CWE-79), Command Injection (CWE-78), Hardcoded Credentials (CWE-798), Broken Cryptography (CWE-327/328), and Insecure Deserialization (CWE-502).
3. **Code Smell Detection:** Identifies duplicated logic, excessive cyclomatic nesting, unclosed stream leaks, empty catch blocks, and maintainability concerns.
4. **AI-Powered Fix Suggestions:** Generates explanations, safety analysis, potential side effects, and unified before/after diffs before applying changes to the editor.
5. **Explainable Severity Scoring:** Calculates a transparent 0–100 Code Quality Score and Risk Index based on actual weighted penalties per finding.
6. **Duplicate Bug Detection:** Clusters similar findings across source lines using normalized rule IDs and Jaccard similarity.
7. **Automatic Test Case Generation:** Synthesizes test suites covering normal cases, boundary conditions, malicious payloads, null handling, and regression guards in pytest, Jest, JUnit 5, or Go.
8. **Real-Time Code Analysis:** Debounced background worker (~800ms) updates Monaco Editor marker squigglies as code is typed.
9. **Developer Security Dashboard:** Features interactive Recharts KPI cards, severity distribution donut charts, language breakdown bars, and weekly trend graphs.
10. **Analysis History & Regression Diff:** Stores metadata, enables side-by-side comparison between two scans, and provides downloadable standalone HTML and JSON audit reports.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide Icons, Recharts, Vite 6.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (Async), aiosqlite / PostgreSQL, Bandit, Pydantic v2, Python-Jose (JWT), bcrypt.
- **Machine Learning Module (`ml/`):** Pipeline for fine-tuning CodeBERT on CodeXGLUE and Big-Vul vulnerability datasets.

---

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
pytest -v

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000` (Swagger UI at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be accessible at: `http://localhost:5173`.

---

## Running Automated Tests

Run backend unit and integration test suite:
```bash
cd backend
.\venv\Scripts\pytest.exe -v
```
All 13 test suites verify:
- Python AST dangerous calls, eval RCE, and mutable arguments
- Polyglot SQL injection, DOM XSS, and command injection
- Transparent scoring engine and duplicate bug clustering
- AI fix assistant and test generator synthesis
- API endpoints: `/api/health`, `/api/analyses/analyze`, `/api/auth/register`, `/api/auth/login`, `/api/settings`.

---

## Security & Sandbox Policy

- **Zero Untrusted Execution:** Uploaded and submitted code is strictly parsed using static AST parsers and regex analysis. It is **never** executed directly on the host server.
- **Request Limiting:** HTTP request bodies exceeding 2MB are automatically rejected.
- **Zero Secrets Logging:** API keys and credentials are stored securely in server environment variables and never logged or exposed to the client browser.

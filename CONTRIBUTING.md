# Contributing to IntelliDoc AI

Thank you for your interest in contributing to **IntelliDoc AI** (*"Upload. Understand. Ask. Verify. Compare."*)! We welcome contributions from engineers, researchers, and designers.

---

## 1. Code of Conduct

We expect all contributors to maintain a respectful, welcoming, and harassment-free environment for everyone.

---

## 2. Architecture Overview

IntelliDoc AI is organized into three decoupled services:
- **`frontend/`**: React 19 + TypeScript + Vite + Tailwind CSS design system.
- **`backend/`**: Spring Boot 3.4.2 + Java 17 + Spring Security (JWT) + JPA/PostgreSQL + Redis.
- **`ai-service/`**: FastAPI (Python 3.11) + ChromaDB + SentenceTransformers / LangChain / LiteLLM / Gemini.

---

## 3. Local Development Setup

### Prerequisites
- Node.js 20+ & npm 10+
- Java JDK 17+ & Maven
- Python 3.10+
- Docker & Docker Compose (optional, for containerized run)

### Running Services

1. **AI Service**:
   ```bash
   cd ai-service
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. **Backend**:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 4. Testing Requirements

All contributions must pass the respective test suites before submitting a PR:

### Backend Tests
```bash
cd backend
./mvnw test
```

### AI Service Tests
```bash
cd ai-service
python -m pytest tests -v
```

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

---

## 5. Branching & Commit Conventions

- **Branch Naming**:
  - `feat/feature-name` (new functionality)
  - `fix/bug-description` (bug fixes)
  - `docs/documentation-changes` (docs only)
  - `refactor/component-name` (refactoring without behavioral changes)
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add multi-document comparison table`
  - `fix: resolve token overlap calculation in verification engine`
  - `test: add unit tests for AuthService refresh token`

---

## 6. Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Ensure all tests pass across backend, AI service, and frontend.
3. Open a Pull Request with a clear summary of changes, linked issues, and screenshots/walkthroughs for UI updates.
4. A maintainer will review your code. Once approved and CI passes, your PR will be squash-merged.

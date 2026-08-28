# 🧠 IntelliDoc AI

### AI-Powered Document Intelligence, Summarization & RAG Assistant

<p align="center">
  <img src="https://img.shields.io/badge/AI-Document%20Intelligence-purple?style=for-the-badge" alt="AI Document Intelligence"/>
  <img src="https://img.shields.io/badge/RAG-Enabled-blue?style=for-the-badge" alt="RAG"/>
  <img src="https://img.shields.io/badge/LLM-Powered-green?style=for-the-badge" alt="LLM"/>
  <img src="https://img.shields.io/badge/Java-Spring%20Boot-orange?style=for-the-badge&logo=springboot" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/React-TypeScript-blue?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Python-FastAPI-yellow?style=for-the-badge&logo=python" alt="FastAPI"/>
</p>

<p align="center">
  <strong>Upload. Understand. Ask. Verify. Compare.</strong>
</p>

<p align="center">
  IntelliDoc AI transforms complex documents into structured summaries,
  evidence-grounded answers, insights, and interactive knowledge.
</p>

---

## 📌 Overview

**IntelliDoc AI** is a full-stack AI-powered document intelligence platform designed to help users understand and interact with large and complex documents.

Unlike traditional document summarizers that simply generate a short summary, IntelliDoc AI combines **Large Language Models, Retrieval-Augmented Generation (RAG), semantic embeddings, vector search, and evidence verification** to provide reliable and context-aware document analysis.

Users can upload documents, generate adaptive summaries, ask questions, retrieve supporting evidence, verify AI-generated claims, compare multiple documents, and create personalized study material.

---

## 🎯 Problem Statement

Modern users often work with large volumes of information such as:

* Research papers
* Academic materials
* Business reports
* Technical documentation
* Project reports
* Policy documents
* Resumes
* Presentations

Manually reading and analyzing these documents is time-consuming.

Traditional AI summarization tools also have limitations:

* Generic summaries
* Limited context
* Hallucinated information
* Lack of source references
* Poor handling of multiple documents
* Difficulty extracting actionable insights

**IntelliDoc AI addresses these challenges by turning static documents into interactive, searchable, and evidence-grounded knowledge sources.**

---

## 💡 Solution

IntelliDoc AI follows a complete document intelligence pipeline:

```text
Document Upload
      │
      ▼
File Validation
      │
      ▼
Text Extraction
      │
      ▼
Text Cleaning & Processing
      │
      ▼
Semantic Chunking
      │
      ▼
Embedding Generation
      │
      ▼
Vector Database
      │
      ├───────────────┐
      ▼               ▼
Summarization      RAG Retrieval
      │               │
      ▼               ▼
Structured          Relevant
Insights            Context
                      │
                      ▼
                     LLM
                      │
              ┌───────┴────────┐
              ▼                ▼
         AI Response      Evidence Check
              │                │
              └───────┬────────┘
                      ▼
              Verified Response
```

---

# ✨ Key Features

## 📄 1. Multi-Format Document Processing

Upload and process multiple document formats:

* PDF
* DOCX
* PPTX
* TXT

The processing pipeline extracts content while preserving useful metadata such as:

* Page number
* Section
* Slide number
* Document ID
* Chunk ID

---

## 🧠 2. Adaptive AI Summarization

IntelliDoc AI automatically identifies the type of document and generates a suitable summary structure.

### Supported Document Types

* Research Paper
* Academic Notes
* Business Report
* Technical Documentation
* Resume
* Project Report
* Policy Document
* General Document

### Summary Length

* Brief
* Standard
* Detailed

### Explanation Level

* Beginner
* Student
* Professional
* Expert

For example, a research paper can be summarized as:

```text
Research Problem
       ↓
Objective
       ↓
Methodology
       ↓
Dataset
       ↓
Results
       ↓
Limitations
       ↓
Conclusion
```

---

# 💬 3. RAG-Based Document Chat

Interact with uploaded documents using natural language.

Example questions:

```text
What is the main objective of this document?

What methodology was used?

What are the key findings?

What are the limitations?

Explain the conclusion in simple terms.
```

The system uses Retrieval-Augmented Generation instead of blindly passing the complete document to the LLM.

```text
User Question
      ↓
Question Embedding
      ↓
Semantic Search
      ↓
Top-K Relevant Chunks
      ↓
Context Construction
      ↓
LLM
      ↓
Grounded Answer
```

---

# 🔎 4. Source-Cited AI Answers

AI responses can include supporting document references.

Example:

```text
Answer:

The proposed system uses a Transformer-based architecture
for document classification.

Sources:

📄 Page 8
📄 Page 11
```

Each document chunk maintains metadata such as:

```text
document_id
page_number
section
chunk_id
source
```

This makes AI responses easier to inspect and validate.

---

# 🛡️ 5. AI Evidence Verification

One of the core differentiating features of IntelliDoc AI is its evidence verification layer.

Instead of trusting every generated response, the system evaluates whether the answer is supported by retrieved document evidence.

```text
User Question
      ↓
RAG Retrieval
      ↓
LLM Answer
      ↓
Claim Extraction
      ↓
Evidence Matching
      ↓
Verification
      ↓
Final Response
```

### Verification States

| Status                 | Meaning                                 |
| ---------------------- | --------------------------------------- |
| ✅ Supported            | Claim is supported by document evidence |
| ⚠️ Partially Supported | Only part of the claim is supported     |
| ❌ Unsupported          | Sufficient evidence was not found       |

This helps reduce the risk of unsupported AI-generated information.

---

# 📚 6. Multi-Document Intelligence

Create collections containing multiple documents.

Example:

```text
AI Research Collection
│
├── Research_Paper_01.pdf
├── Research_Paper_02.pdf
├── Research_Paper_03.pdf
└── Research_Paper_04.pdf
```

Users can ask questions across the entire collection.

Example:

> Compare the methodologies used in these research papers.

The system retrieves information from multiple documents and generates a structured comparison.

---

# 🎓 7. AI Study Mode

Convert documents into personalized study material.

Generate:

* MCQs
* Short-answer questions
* Long-answer questions
* Viva questions
* Flashcards
* Important definitions
* Key concepts

Difficulty levels:

```text
Easy
Medium
Hard
```

The generated questions and explanations remain grounded in the uploaded document.

---

# 📊 8. Document Intelligence Dashboard

The platform provides document-level analytics.

### Metrics

* Page count
* Word count
* Character count
* Estimated reading time
* Number of sections
* Number of chunks
* Important keywords
* Key concepts

Example:

```text
┌─────────────────────────────────────┐
│         DOCUMENT INTELLIGENCE       │
├─────────────────────────────────────┤
│ Pages          42                   │
│ Words          18,432               │
│ Reading Time   1h 20m               │
│ Sections       12                   │
│ Key Concepts   37                   │
└─────────────────────────────────────┘
```

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │   TypeScript/Vite    │
                         └──────────┬───────────┘
                                    │
                               REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Spring Boot       │
                         │      Backend         │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
        PostgreSQL            Authentication          AI Service
                                                           │
                                                           ▼
                                                  ┌────────────────┐
                                                  │ Python FastAPI │
                                                  └───────┬────────┘
                                                          │
                           ┌──────────────────────────────┼───────────────────────┐
                           │                              │                       │
                           ▼                              ▼                       ▼
                    Document Parser                  Embeddings                 LLM
                           │                              │                       │
                           │                              ▼                       │
                           │                       Vector Database              │
                           │                              │                       │
                           └──────────────────────────────┼───────────────────────┘
                                                          ▼
                                                    RAG Pipeline
                                                          │
                                                          ▼
                                               Evidence Verification
```

---

# 🧰 Technology Stack

## Frontend

| Technology   | Purpose               |
| ------------ | --------------------- |
| React        | User Interface        |
| TypeScript   | Type-safe development |
| Vite         | Frontend tooling      |
| Tailwind CSS | UI styling            |
| Axios        | API communication     |
| React Router | Client-side routing   |

## Backend

| Technology      | Purpose                        |
| --------------- | ------------------------------ |
| Java            | Backend development            |
| Spring Boot     | REST API framework             |
| Spring Security | Authentication & authorization |
| Spring Data JPA | Database interaction           |
| JWT             | Stateless authentication       |
| PostgreSQL      | Relational database            |

## AI Service

| Technology      | Purpose                     |
| --------------- | --------------------------- |
| Python          | AI/NLP development          |
| FastAPI         | AI microservice             |
| LLM             | Natural language generation |
| Embeddings      | Semantic representation     |
| RAG             | Context-aware generation    |
| Vector Database | Semantic retrieval          |

## DevOps

| Technology     | Purpose                     |
| -------------- | --------------------------- |
| Git            | Version control             |
| GitHub         | Source code management      |
| Docker         | Containerization            |
| Docker Compose | Multi-service orchestration |

---

# 📁 Project Structure

```text
intellidoc-ai/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── backend/
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── intellidoc/
│           │           ├── controller/
│           │           ├── service/
│           │           ├── repository/
│           │           ├── entity/
│           │           ├── dto/
│           │           ├── security/
│           │           ├── exception/
│           │           └── config/
│           │
│           └── resources/
│
├── ai-service/
│   └── app/
│       ├── api/
│       ├── loaders/
│       ├── embeddings/
│       ├── vectorstore/
│       ├── rag/
│       ├── summarizer/
│       ├── verification/
│       └── main.py
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── screenshots/
│
├── uploads/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

# 🔄 Document Processing Pipeline

### 1. Upload

User uploads a supported document.

### 2. Validation

The system validates:

* File type
* MIME type
* File size
* File integrity

### 3. Extraction

Text is extracted from the document.

### 4. Metadata Processing

Page, section, slide, and document metadata are preserved where available.

### 5. Chunking

Large documents are divided into manageable semantic chunks.

### 6. Embedding Generation

Each chunk is converted into a vector representation.

### 7. Vector Storage

Embeddings and metadata are stored in the vector database.

### 8. AI Processing

The system generates:

* Summary
* Key points
* Keywords
* Insights

### 9. RAG Retrieval

Relevant chunks are retrieved when the user asks a question.

### 10. Evidence Verification

Generated claims are checked against retrieved evidence.

---

# 🧠 RAG Architecture

Traditional LLM approach:

```text
Document → LLM → Answer
```

IntelliDoc AI:

```text
Document
   ↓
Text Extraction
   ↓
Chunking
   ↓
Embeddings
   ↓
Vector Database
   ↓
Semantic Retrieval
   ↓
Relevant Context
   ↓
LLM
   ↓
Grounded Answer
   ↓
Evidence Verification
```

### Why RAG?

RAG provides:

* Better contextual retrieval
* Large-document support
* Source references
* Domain-specific responses
* Reduced hallucination risk

---

# 🔐 Security

Security is treated as a core part of the platform.

### Implemented Security Practices

* JWT authentication
* Password hashing
* Authorization
* Input validation
* File validation
* File-size restrictions
* Secure file handling
* CORS configuration
* Environment-based secrets
* API key protection

### Environment Variables

Never commit secrets such as:

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
JWT_SECRET=
DATABASE_PASSWORD=
```

Use `.env` files or secure deployment environment variables.

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following are installed:

* Java 17+
* Node.js 20+
* Python 3.11+
* PostgreSQL
* Git
* Docker *(recommended)*

---

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/intellidoc-ai.git

cd intellidoc-ai
```

---

## 2. Configure Environment Variables

Copy the example configuration:

```bash
cp .env.example .env
```

Configure the required values:

```env
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=

JWT_SECRET=

AI_PROVIDER=
LLM_API_KEY=

EMBEDDING_MODEL=
VECTOR_DB_URL=

AI_SERVICE_URL=

CHUNK_SIZE=
CHUNK_OVERLAP=
TOP_K=
SIMILARITY_THRESHOLD=
```

---

# 3. Start Database

Using Docker:

```bash
docker compose up -d postgres
```

Or configure PostgreSQL locally.

---

# 4. Start AI Service

```bash
cd ai-service

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux/macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the service:

```bash
uvicorn app.main:app --reload --port 8000
```

---

# 5. Start Spring Boot Backend

```bash
cd backend
```

### Linux/macOS

```bash
./mvnw spring-boot:run
```

### Windows

```bash
mvnw.cmd spring-boot:run
```

---

# 6. Start Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🐳 Docker

For a complete containerized setup:

```bash
docker compose up --build
```

The Docker environment can run:

```text
Frontend
Backend
AI Service
PostgreSQL
Vector Database
```

---

# 🔌 API Overview

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

## Documents

```http
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/{id}
DELETE /api/documents/{id}
GET    /api/documents/{id}/status
```

## AI

```http
POST /api/documents/{id}/summarize
POST /api/documents/{id}/chat
POST /api/documents/{id}/verify
POST /api/documents/{id}/study-material
```

## Collections

```http
POST /api/collections
GET  /api/collections

POST /api/collections/{id}/documents
POST /api/collections/{id}/chat
POST /api/collections/{id}/compare
```

---

# 🧪 Testing

Testing is performed at multiple levels.

## Backend

* Authentication tests
* Authorization tests
* Controller tests
* Service tests
* Repository tests
* API integration tests

## AI Service

* Document extraction tests
* Chunking tests
* Embedding tests
* Retrieval tests
* RAG tests
* Summarization tests
* Evidence verification tests

## Frontend

* Component tests
* Upload workflow tests
* Chat tests
* Authentication tests
* UI state tests

---

# 📈 Performance & Scalability

The system is designed to support large document workloads.

### Performance considerations

* Asynchronous document processing
* Batch embedding generation
* Configurable chunk size
* Configurable retrieval count
* Database indexing
* Pagination
* Cached summaries
* Background processing
* Vector search optimization

Large documents are not blindly sent to the LLM in a single request.

---

# 🖥️ Application Workflow

```text
Landing Page
     ↓
Register / Login
     ↓
Dashboard
     ↓
Upload Document
     ↓
Document Processing
     ↓
AI Summary
     ↓
Document Insights
     ↓
RAG Chat
     ↓
Source Citations
     ↓
Evidence Verification
     ↓
Study Mode
     ↓
Multi-Document Collections
     ↓
Document Comparison
```

---

# 📸 Screenshots

> Add screenshots of the actual application here.

### Landing Page

![Landing Page](screenshots/landing.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Document Analysis

![Document Analysis](screenshots/document-analysis.png)

### RAG Chat

![RAG Chat](screenshots/rag-chat.png)

### Evidence Verification

![Evidence Verification](screenshots/evidence-verification.png)

### Document Comparison

![Document Comparison](screenshots/document-comparison.png)

---

# 🗺️ Roadmap

## Phase 1 — Foundation

* [ ] Project architecture
* [ ] Database setup
* [ ] Authentication
* [ ] User management

## Phase 2 — Document Intelligence

* [ ] PDF processing
* [ ] DOCX processing
* [ ] PPTX processing
* [ ] TXT processing
* [ ] Metadata extraction
* [ ] Document analytics

## Phase 3 — AI Summarization

* [ ] Document classification
* [ ] Adaptive summarization
* [ ] Key point extraction
* [ ] Keyword extraction
* [ ] Insight generation

## Phase 4 — RAG

* [ ] Text chunking
* [ ] Embedding generation
* [ ] Vector database
* [ ] Semantic search
* [ ] RAG chatbot
* [ ] Source citations

## Phase 5 — AI Reliability

* [ ] Claim extraction
* [ ] Evidence matching
* [ ] Hallucination detection
* [ ] Evidence confidence

## Phase 6 — Advanced Features

* [ ] Multi-document collections
* [ ] Document comparison
* [ ] AI study mode
* [ ] Flashcards
* [ ] MCQ generation

## Phase 7 — Production

* [ ] Automated testing
* [ ] Docker
* [ ] CI/CD
* [ ] Monitoring
* [ ] Security audit
* [ ] Cloud deployment

---

# 🔮 Future Enhancements

Planned future capabilities include:

* 🌍 Multilingual document summarization
* 🎙️ Voice-based document interaction
* 🕸️ Knowledge graph generation
* 📷 OCR for scanned documents
* ✍️ Handwritten document analysis
* 🔗 Citation graph generation
* 🔍 Advanced document version comparison
* 🧠 Local/private LLM support
* 👥 Team collaboration
* 🔐 Enterprise access control
* 📊 Advanced AI evaluation
* 📑 Automatic presentation generation

---

# 📊 AI Evaluation

The project will evaluate AI quality using measurable metrics instead of relying only on subjective output.

Potential metrics include:

| Metric                | Purpose                                   |
| --------------------- | ----------------------------------------- |
| Retrieval Precision   | Measures relevance of retrieved chunks    |
| Retrieval Recall      | Measures coverage of relevant information |
| Answer Grounding      | Measures evidence support                 |
| Verification Accuracy | Measures claim verification quality       |
| Summary Quality       | Evaluates generated summaries             |
| Response Latency      | Measures AI response time                 |

> Performance numbers should only be published after reproducible benchmarking.

---

# 🧑‍💻 Engineering Principles

IntelliDoc AI follows several engineering principles:

### Functionality First

A feature is considered complete only when it works end-to-end.

### Evidence Over Assumption

AI responses should be grounded in retrieved document content whenever document-based answers are requested.

### Security by Design

Secrets, authentication, authorization, and file handling are treated as core engineering concerns.

### Modular Architecture

The frontend, backend, AI service, database, and vector storage are separated into maintainable components.

### Test Before Release

Important functionality should be validated through automated tests and end-to-end testing.

### No Fake AI

Development/mock responses must be clearly identified and must never be presented as real AI inference.

---

# 🤝 Contributing

Contributions are welcome.

### Development Workflow

```bash
git checkout -b feature/your-feature

git add .

git commit -m "feat: add document comparison"

git push origin feature/your-feature
```

Then create a Pull Request.

### Contribution Guidelines

* Follow the existing project architecture.
* Write clean and maintainable code.
* Add tests for important features.
* Do not commit API keys or credentials.
* Update documentation when necessary.
* Use meaningful commit messages.

---

# 🐛 Bug Reports

If you find a bug:

1. Check existing issues.
2. Create a new issue.
3. Describe the problem clearly.
4. Provide reproduction steps.
5. Attach screenshots or logs when useful.

---

# 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

# 👨‍💻 Author

**Your Name**

AI Engineer • Full-Stack Developer • Java • Spring Boot • React • LLM • RAG

### Technical Interests

* Artificial Intelligence
* Generative AI
* Large Language Models
* Retrieval-Augmented Generation
* NLP
* Backend Engineering
* Full-Stack Development
* Software Architecture

---

# ⭐ Project Highlights

```text
┌──────────────────────────────────────────────┐
│              INTELLIDOC AI                   │
├──────────────────────────────────────────────┤
│                                              │
│  📄 Document Processing                      │
│  🧠 Adaptive AI Summarization                │
│  💬 RAG Document Chat                        │
│  🔎 Source-Cited Answers                     │
│  🛡️ Evidence Verification                   │
│  📚 Multi-Document Intelligence              │
│  🎓 AI Study Mode                            │
│  📊 Document Analytics                       │
│                                              │
│  React + Spring Boot + Python + PostgreSQL   │
│  LLM + Embeddings + Vector Search + RAG      │
│                                              │
└──────────────────────────────────────────────┘
```

<p align="center">

### 🚀 IntelliDoc AI

**Turning static documents into intelligent, searchable knowledge.**

⭐ Star the repository if you find the project interesting.

</p>

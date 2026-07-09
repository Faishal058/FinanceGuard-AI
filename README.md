# FinanceGuard AI — Enterprise Multi-Agent Financial Intelligence Platform

FinanceGuard AI is an enterprise-grade, AI-powered financial advisory and intelligence platform. It transforms raw financial data and documents into personalized, secure, and compliance-vetted financial guidance.

The architecture is built on a **decoupled multi-agent orchestration framework**, utilizes high-performance **semantic search**, and enforces **real-time AI safety guardrails** to handle sensitive financial operations securely.

---

## 🚀 Key Architectural Features

1. **Multi-Agent Orchestration Engine**
   * Uses a custom typescript workflow system modeled after **Mastra orchestration pipelines**.
   * Manages 5 specialized AI agents running in parallel or sequence with branching, state persistence, and exponential backoff retry policies.
2. **Retrieval-Augmented Generation (RAG)**
   * Implements semantic memory retrieval using **Qdrant Vector Database** and **OpenAI Embeddings (`text-embedding-3-large`)**.
   * Retains financial document context and session memory cross-session, with a robust SQLite database fallback.
3. **AI Safety, Privacy & Compliance (LLM Guardrails)**
   * Integrated **Enkrypt AI** safety client that screens prompts/outputs in real-time.
   * Redacts sensitive PII (SSNs, credit card numbers, emails) and intercepts prompt injection attempts.
   * Enforces regulatory compliance (e.g., preventing individual stock ticker recommendations like `AAPL` or `TSLA`).
4. **Cloud-Native & Production-Ready**
   * Infrastructure-as-code setup using **Terraform** to provision AWS VPC, EKS (Kubernetes), and ElastiCache Redis.
   * Fully containerized using **Docker** and **Docker Compose**.
   * CI/CD automation configured via **GitHub Actions** for security scans (Trivy), linting, unit testing, and Docker builds.

---

## 📁 Directory Structure & Code Paths

The project follows a clean monorepo-style structure, isolating the Next.js client, server-side agent logic, database adapters, and deployment infrastructure.

```
FinanceGuard/
├── .github/workflows/          # CI/CD pipelines (Jest, Linting, Trivy scan, Docker build)
│   └── ci.yml
├── terraform/                  # Cloud infrastructure (AWS VPC, EKS, ElastiCache Redis)
│   └── main.tf
├── Dockerfile                  # Production multi-stage Docker build
├── docker-compose.yml          # Local container orchestration (App, Qdrant, Redis)
└── frontend/                   # Main Application Directory
    ├── app/                    # Next.js App Router (Frontend Pages & REST APIs)
    │   ├── (app)/              # Logged-in workspace dashboards (Advisor, Risk, Observability, Workflows)
    │   ├── (auth)/             # Login and signup flows
    │   ├── api/v2/             # REST APIs (Agent workflows, Document upload, User data)
    │   └── page.tsx            # Cinematic Landing Page Design
    ├── components/             # Reusable UI Components (Glassmorphism design system)
    └── lib/                    # Shared Libraries
        ├── backend/            # Backend Services & Agent Logic
        │   ├── agents/         # 5 Specialized AI Agent prompts and solvers
        │   │   ├── advisor.ts          # Synthesizer & Financial Strategist Agent
        │   │   ├── forecast.ts         # Probabilistic ML Forecast Agent
        │   │   ├── ingest.ts           # Document parsing & OCR agent
        │   │   ├── profile-builder.ts  # Context constructor & ratio builder agent
        │   │   └── risk.ts             # Exposure & compliance warning agent
        │   ├── db.ts           # Relational DB driver (LibSQL client)
        │   ├── enkrypt.ts      # Enkrypt AI safety guardrails (PII redaction, compliance)
        │   ├── qdrant.ts       # Qdrant vector client & embedding generator
        │   └── workflow.ts     # Mastra-style state machine and parallel orchestrator
        └── animations.ts       # Framer Motion transitions & curves
```

* **Frontend Codebase:** Head to the [`/frontend`](./frontend) directory to view the page routers and dashboard layout components.
* **Backend Codebase:** Head to [`/frontend/lib/backend`](./frontend/lib/backend) to view the orchestration logic, agent definitions, and database managers.

---

## 🛠️ Technology Stack

* **LLMs & Embeddings:** OpenAI (`gpt-4o`), OpenAI Embeddings (`text-embedding-3-large`)
* **Agent Framework:** Mastra architecture concepts (State machine, Parallel execution, Step-retries)
* **Databases:** LibSQL (SQLite framework), Qdrant (Vector Database), Redis (Session Cache)
* **AI Evaluation & Safety:** Enkrypt AI Guardrails
* **UI/UX Framework:** Next.js 16, React 19, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
* **Infrastructure & Ops:** Docker, Docker Compose, Terraform (AWS VPC/EKS/Redis), GitHub Actions CI/CD (Trivy Security scanner)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v20+), PNPM, and Docker installed.

### 2. Environment Setup
Create a `.env` file inside the `frontend` folder:
```env
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional_qdrant_key
JWT_SECRET=super_secret_session_key
```

### 3. Local Development (Next.js server)
To run the server locally outside of Docker:
```bash
cd frontend
pnpm install
npx next dev
```
Open [http://localhost:3000](http://localhost:3000) to view the platform.

### 4. Running via Docker Compose
To boot the application alongside the local Qdrant and Redis services:
```bash
docker-compose up --build
```
This spins up:
* **App Server** on port `3000`
* **Qdrant DB** on port `6333`
* **Redis Instance** on port `6379`

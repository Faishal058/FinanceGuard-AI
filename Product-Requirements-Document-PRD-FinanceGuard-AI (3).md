# Product Requirements Document (PRD): FinanceGuard AI

## 1. Executive Summary
FinanceGuard AI is an enterprise-grade, AI-powered financial advisory platform designed to provide actionable insights into financial health while maintaining the highest standards of safety, compliance, and data privacy. By leveraging a decoupled multi-agent orchestration framework (Mastra), a high-performance vector database (Qdrant), and a robust safety layer (Enkrypt AI), the system transforms raw financial data into personalized guidance. The architecture follows 12-factor app principles, ensuring scalability, observability, and security for sensitive financial operations.

## 2. Problem Statement
Traditional financial tools are often static, while generic AI chatbots lack the necessary context, memory, and safety guardrails required for financial advice. Users need a system that can ingest complex documents (bank statements, loans), build a persistent profile, identify risks, and model future scenarios without risking PII exposure or receiving hallucinated, non-compliant financial advice.

## 3. Goals & Objectives
*   **Automated Intelligence:** Convert raw financial documents into structured profiles using specialized agents.
*   **Zero-Trust Safety:** Validate every input and output for hallucinations and compliance via Enkrypt AI.
*   **Scalable Architecture:** Transition from a monolithic runtime to a decoupled, microservices-based system.
*   **Auditability:** Implement full distributed tracing for every agent interaction to meet regulatory standards.
*   **Compliance-First Advisory:** Provide structural financial guidance while strictly avoiding regulated investment advice (e.g., specific stock picks).

## 4. Target Users / Stakeholders
*   **Retail Users:** Individuals seeking debt optimization and savings strategies.
*   **Small Business Owners:** Users requiring cash flow analysis and risk detection.
*   **Compliance Officers:** Stakeholders requiring audit trails of AI-generated advice.
*   **Technical Operators:** Developers managing the microservices and observability stack.

## 5. Functional Requirements (IEEE 830 Traceability Matrix)

| Req ID | Requirement Description | Primary Service | Data Store | Safety Check | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-1** | Document Ingestion & Parsing | Ingest Service | Qdrant (Docs) | PII Redaction | Integration Test (PDF-to-JSON) |
| **FR-2** | Financial Profile Generation | Profile Service | LibSQL (Profiles) | Compliance Scan | Schema Validation (Zod) |
| **FR-3** | Risk Identification & Alerting | Risk Service | LibSQL (Audit) | Hallucination Check | Unit Test (Ratio Accuracy) |
| **FR-4** | Scenario Forecasting | Forecast Service | LibSQL (Balances) | Compliance Scan | Monte Carlo Simulation Audit |
| **FR-5** | Multi-Tenant Context Retrieval | Advisor Service | Qdrant (Memory) | Metadata Filtering | Security Penetration Test |
| **FR-6** | Cross-Session Memory | Mastra Orchestrator | Qdrant (Memory) | PII Redaction | Session Recall Test |
| **FR-7** | Safety Guardrail Enforcement | Enkrypt Service | LibSQL (Audit) | Injection/PII/Halluc. | Safety Score Threshold Test |
| **FR-8** | Real-time Observability | Observability Platform | ClickHouse/Langfuse | OTel Propagation | Trace Correlation Audit |

## 6. Non-Functional Requirements
*   **Security:** TLS 1.3 for transit; AES-256-GCM for data-at-rest. mTLS for inter-service communication with Enkrypt AI.
*   **Performance:** End-to-end pipeline latency < 10s. API Gateway must support 100+ RPS using Token Bucket rate limiting.
*   **Scalability:** Stateless microservices deployable via K8s/Containers; asynchronous task distribution via Redis Streams.
*   **Reliability:** 99.9% uptime; Mastra workflow state persistence in Redis for graceful recovery.
*   **Observability:** 100% trace coverage using W3C Trace Context and OpenTelemetry.

## 7. System Architecture Overview
The system utilizes a **Decoupled Multi-Agent Microservices** pattern.
1.  **Edge Layer:** Next.js Frontend and Enterprise Gateway (Kong/Envoy) handle Auth and Rate Limiting.
2.  **Orchestration Layer:** Mastra Workflow Engine manages state and publishes tasks to Redis Streams.
3.  **Agent Layer:** Five independent microservices (Python/Mastra) process specialized tasks.
4.  **Security Layer:** Enkrypt AI provides a "sandwich" guardrail (Input/Output).
5.  **Data Layer:** Dual-storage strategy using Qdrant (Vector) and LibSQL (Relational).

## 8. Tech Stack
*   **Orchestration:** Mastra Framework, Node.js, Redis Streams.
*   **Agents:** Python, LlamaIndex, Scikit-learn, NumPy, LangGraph.
*   **Databases:** Qdrant Cloud (Vector), LibSQL/Turso (Relational), Redis (Cache).
*   **Security:** Enkrypt AI, JWT/OAuth2, TLS 1.3.
*   **Observability:** OpenTelemetry, Langfuse, Arize Phoenix.
*   **Frontend:** Next.js 14, Tailwind CSS, Recharts.

## 9. Data Requirements (LibSQL DDL)

```sql
-- User Profiles Table
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY,
    net_worth REAL,
    debt_to_income_ratio REAL,
    risk_tolerance_score INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session State Table (Mastra Persistence)
CREATE TABLE session_state (
    session_id TEXT PRIMARY KEY,
    user_id TEXT,
    current_step TEXT,
    context_blob JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

-- Safety Audit Logs
CREATE TABLE safety_audit_logs (
    audit_id TEXT PRIMARY KEY,
    trace_id TEXT,
    user_id TEXT,
    agent_name TEXT,
    pii_score REAL,
    hallucination_score REAL,
    compliance_status TEXT, -- 'ALLOWED', 'BLOCKED', 'REDACTED'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 10. API Specifications

### 10.1 Enterprise Gateway (Next.js/Kong)
*   **Endpoint:** `POST /api/v1/query`
*   **Headers:**
    *   `Authorization: Bearer <JWT>`
    *   `X-Trace-Id: <W3C-Trace-Context>`
*   **Rate Limit:** 10 requests per minute (Token Bucket: Burst 5).

### 10.2 Enkrypt AI Guardrail API
*   **Endpoint:** `POST https://api.enkryptai.com/guardrails/validate`
*   **Payload Schema:**
```json
{
  "text": "User's financial advice output...",
  "detectors": ["hallucination", "pii", "financial_compliance"],
  "context": {
    "user_id": "u123",
    "trace_id": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
  }
}
```

## 11. Security Requirements
*   **Multi-Tenancy:** Qdrant queries MUST include a metadata filter: `{"user_id": {"match": {"value": "$USER_ID"}}}`.
*   **Encryption:** All database volumes encrypted with AES-256-GCM.
*   **Auth:** OAuth2 with PKCE for frontend; mTLS for internal service-to-service calls.

## 12. Observability & Tracing
**Context Propagation Flow:**
1. Gateway generates `trace_id`.
2. Mastra injects `trace_id` into Redis Stream message metadata.
3. Agent extracts `trace_id` and creates child spans for LLM calls.
4. Enkrypt AI receives `trace_id` to correlate safety scores with the specific request.

**W3C JSON Span Attribute Example:**
```json
{
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "attributes": {
    "gen_ai.system": "openai",
    "gen_ai.usage.tokens": 512,
    "app.finance.user_id": "user_99",
    "app.safety.hallucination_score": 0.04
  }
}
```

## 13. Agent System Instructions (CRISPE Framework)

### 13.1 Ingest Agent
*   **Capacity:** Data Extraction Specialist.
*   **Role:** Convert unstructured financial documents into clean JSON.
*   **Instruction:** Parse PDF/CSV, redact PII locally, and chunk text for vectorization.
*   **Schema:** `TransactionList` (Date, Amount, Category, Merchant).
*   **Power:** Access to `pdf-parse` and Qdrant Upsert.
*   **Executive:** Do not infer missing data; flag unreadable sections.

### 13.2 Profile Builder Agent
*   **Capacity:** Financial Data Architect.
*   **Role:** Aggregate transactions into a high-level financial profile.
*   **Instruction:** Calculate monthly burn rate, net worth, and DTI.
*   **Schema:** Zod-validated `UserProfile` object.
*   **Power:** Read access to Qdrant; Write access to LibSQL.
*   **Executive:** Update profile only when new data exceeds 5% variance.

### 13.3 Risk Agent
*   **Capacity:** Risk Compliance Officer.
*   **Role:** Identify financial vulnerabilities.
*   **Instruction:** Compare user profile against standard risk benchmarks (e.g., DTI > 40%).
*   **Schema:** `RiskReport` (FlagType, Severity, Description).
*   **Power:** Access to LibSQL `user_profiles`.
*   **Executive:** Only flag risks; do not suggest specific financial products.

### 13.4 Forecast Agent
*   **Capacity:** Predictive Modeler.
*   **Role:** Simulate future financial states.
*   **Instruction:** Run Monte Carlo simulations based on current savings and interest rates.
*   **Schema:** `ForecastData` (Timeline, ProbabilityDistribution, Balance).
*   **Power:** Access to NumPy/Scikit-learn.
*   **Executive:** Always include a "Confidence Interval" in the output.

### 13.5 Advisor Agent
*   **Capacity:** Senior Financial Strategist.
*   **Role:** Synthesize all agent data into a final user response.
*   **Instruction:** Combine Profile, Risk, and Forecast data with Qdrant memory to answer user queries.
*   **Schema:** Markdown with Executive Summary, Citations, and Action Items.
*   **Power:** Read access to all DBs; Final call to Enkrypt AI Output Guard.
*   **Executive:** **STRICT GUARDRAIL:** You are strictly forbidden from recommending specific stock tickers (e.g., AAPL, TSLA), mutual funds, or specific investment products. Focus exclusively on structural advice (e.g., "Increase emergency fund," "Prioritize high-interest debt").

## 14. Success Metrics
*   **Safety:** 0% PII leakage to LLM providers.
*   **Accuracy:** < 1% hallucination rate (verified by Enkrypt AI).
*   **Latency:** P95 response time < 8 seconds.
*   **Engagement:** > 80% of users follow at least one "Action Item."

## 15. Open Questions & Risks
*   **Risk:** Latency overhead from Redis Streams + Enkrypt AI API. *Mitigation:* Implement parallel execution for Risk and Forecast agents.
*   **Risk:** LLM cost management. *Mitigation:* Token Bucket rate limiting and prompt caching.
*   **Question:** Should we support multi-currency conversion? *Decision:* Phase 2 requirement.
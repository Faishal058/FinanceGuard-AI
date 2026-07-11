# Technical Architecture & Judges Walkthrough: FinanceGuard AI

This document provides a comprehensive overview of the **FinanceGuard AI** system architecture, data flows, and design decisions for hackathon judges and evaluation panels.

---

## 1. System Architecture Overview

FinanceGuard AI is an enterprise-grade agentic financial assistant designed to ingest, process, assess, and forecast personal financial positions securely and in real-time.

```
       ┌────────────────────────────────────────────────────────┐
       │                 Next.js Web Interface                  │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼  HTTP POST /api/v2/query
       ┌────────────────────────────────────────────────────────┐
       │                Quality Gates Evaluator                 │
       │     (Evaluates compliance, bias, hallucination)        │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │ (Fallback)
         ▼ (If Redis Online)                               ▼ (If Vercel/Serverless)
┌────────────────────────────────┐               ┌────────────────────────────────┐
│   Redis Streams Task Queue     │               │   Inline Request execution     │
│   (Asynchronous event worker)  │               │   (Synchronous response loop)  │
└────────────────┬───────────────┘               └─────────┬──────────────────────┘
                 │                                         │
                 └──────────────────┬──────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Mastra Agentic Orchestrator                           │
│  Ingest Agent ➔ Profile Builder ➔ Risk Auditor ➔ Forecast Agent ➔ Advisor Agent │
└──────┬──────────────────────┬──────────────────────┬──────────────────────┬─────┘
       │                      │                      │                      │
       ▼                      ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  OpenRouter  │      │ Qdrant Cloud │      │  Enkrypt AI  │      │ Turso Cloud  │
│ (LLM Engine) │      │ (Vector DB)  │      │ (Guardrails) │      │ (Relational) │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

---

## 2. Core Strengths (What makes this project unique?)

### 🚀 Dual-Mode Runtime Routing (Serverless vs Async Queue)
* **The Problem**: Real-time agent loops (running 5 sequential steps + vector searches) can exceed standard HTTP timeouts on serverless platforms (like Vercel) and overload systems.
* **Our Solution**: 
  * If **Redis** is online, the route acts as an event publisher, pushing jobs to a **Redis Stream** group (`workflow_tasks`) processed by blocking background worker processes.
  * If **Redis is offline** (e.g. running on Vercel's free serverless tier), it automatically falls back to **inline thread execution**. This ensures you can deploy for free, yet scale to high throughput in production with zero code changes.

### 🛡️ Multi-Gate Safety Pipeline (Enkrypt AI & Local Guardrails)
* Every input query and generated report is processed by a **Quality Gate Pipeline** checking 8 distinct dimensions:
  1. **Hallucination** (LLM metric)
  2. **Compliance** (Investment advice check)
  3. **Bias & Toxicity** (Fairness check)
  4. **PII Leakage** (SSNs, Card Numbers, Emails, Phone Numbers)
  5. **Context Confidence** (RAG density)
  6. **Latency Constraints**
  7. **Token Bounds**
  8. **Strict Schema Integrity** (JSON shape validation)
* It maps real-time metrics to actions (e.g., `BLOCK`, `RETRY_STRICT`, `LOG_WARNING`, or `ESCALATE_TO_HUMAN`).
* If credentials are not set, it falls back to a custom **local regex-based scanner** to redact PII and flag ticker recommendations for free.

### 📝 Dynamic Prompt Registry (Zero Redeployment Configurations)
* System prompts, temperatures, and model constraints are not hardcoded. 
* They are version-tracked inside the database using a **Prompt Registry**. If a prompt needs to be tweaked or optimized, it can be updated directly in the database, and the running agents will consume the new prompt instantly without needing a code redeployment.

---

## 3. The 5-Agent Pipeline (Mastra Orchestration)

We leverage the **Mastra SDK** to manage five specialized agents working in sequence:

1. **Ingest Agent**: Parses bank statements and transaction files. Converts unstructured text into structured JSON lists.
2. **Profile Builder**: Processes the raw JSON list, aggregating transactions to compute income, burn rate, recurring expenses, and debt-to-income ratios.
3. **Risk Auditor**: Evaluates user profiles against financial thresholds to flag risks (e.g. high debt, low savings).
4. **Forecast Agent**: Runs simulations to project balance horizons over 12 months.
5. **Advisor Agent**: Performs a semantic search against **Qdrant** for context. Combines retrieved statement data, risk profiles, and forecast projections to write tailored, compliant advice.

---

## 4. Technology Stack & Integrations

* **Agentic Framework**: `@mastra/core` (Mastra Agents, Workflows).
* **LLM Engine**: **OpenRouter** (routing to Google's **Gemini 2.5 Flash** for fast, free-tier processing).
* **Vector Store**: **Qdrant Cloud** (storing document chunks and conversational user memory with `text-embedding-3-large` representation).
* **Relational Database**: **Turso Cloud** (LibSQL serverless engine).
* **Guardrails Platform**: **Enkrypt AI API** (validating guardrails and policy compliance).
* **Event Broker**: **Redis Streams & Pub/Sub** (handling background task queues).

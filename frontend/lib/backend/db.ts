import { createClient, Client } from '@libsql/client'
import { PromptRegistry } from './prompt-registry'

// Absolute path to the SQLite file in the workspace root
const dbPath = 'd:/FinanceGuard/financeguard.db'
const dbUrl = `file:${dbPath}`

let clientInstance: Client | null = null

export function getDbClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({ url: dbUrl })
  }
  return clientInstance
}

export async function initDb() {
  const db = getDbClient()
  
  // User Profiles
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      role TEXT DEFAULT 'user',
      net_worth REAL DEFAULT 0.0,
      debt_to_income_ratio REAL DEFAULT 0.0,
      risk_tolerance_score INTEGER DEFAULT 5,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Session State Table (Mastra Persistence)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS session_state (
      session_id TEXT PRIMARY KEY,
      user_id TEXT,
      current_step TEXT,
      context_blob TEXT, -- JSON string
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // Safety Audit Logs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS safety_audit_logs (
      audit_id TEXT PRIMARY KEY,
      trace_id TEXT,
      user_id TEXT,
      agent_name TEXT,
      pii_score REAL,
      hallucination_score REAL,
      compliance_status TEXT, -- 'ALLOWED', 'BLOCKED', 'REDACTED'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // User Consent Records (GDPR Art. 7 / CCPA §1798.100)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS consent_records (
      consent_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      consent_type TEXT NOT NULL,        -- 'data_processing', 'memory_storage', 'financial_analysis', 'advisory_output', 'marketing'
      purpose TEXT NOT NULL,             -- Specific purpose for which consent is granted
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'WITHDRAWN', 'EXPIRED'
      granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      withdrawn_at DATETIME,
      expires_at DATETIME,
      ip_address TEXT,                   -- IP at time of consent for audit
      user_agent TEXT,                   -- Browser/device at time of consent
      consent_version TEXT NOT NULL,     -- Version of consent form presented
      legal_basis TEXT NOT NULL,         -- 'consent', 'legitimate_interest', 'contractual_necessity'
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // Data Retention Log
  await db.execute(`
    CREATE TABLE IF NOT EXISTS data_retention_log (
      retention_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data_category TEXT NOT NULL,       -- 'raw_document', 'profile', 'audit_log', 'vector_embedding', 'session_state', 'conversation_memory'
      data_store TEXT NOT NULL,          -- 'libsql', 'qdrant', 'redis', 'object_storage'
      action TEXT NOT NULL,              -- 'RETAINED', 'SCHEDULED_DELETION', 'DELETED', 'ARCHIVED'
      retention_policy TEXT NOT NULL,    -- '30_day', '365_day', 'indefinite_with_consent', 'immediate_on_withdrawal'
      scheduled_deletion_at DATETIME,
      actual_deletion_at DATETIME,
      deletion_certificate_id TEXT,      -- Proof of deletion for compliance audit
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // Prompt Version Store
  await db.execute(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      prompt_id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,          -- 'ingest', 'profile_builder', 'risk', 'forecast', 'advisor'
      version TEXT NOT NULL,             -- Semantic version: '2.3.1'
      prompt_text TEXT NOT NULL,
      model_id TEXT NOT NULL,            -- 'gpt-4o', 'gpt-4o-mini', etc.
      temperature REAL NOT NULL,
      top_p REAL NOT NULL,
      max_tokens INTEGER NOT NULL,
      presence_penalty REAL DEFAULT 0.0,
      frequency_penalty REAL DEFAULT 0.0,
      stop_sequences TEXT,               -- JSON string array
      output_schema TEXT NOT NULL,       -- JSON Schema string
      few_shot_examples TEXT NOT NULL,   -- JSON string array of example input/output pairs
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'DEPRECATED', 'EXPERIMENTAL'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,
      experiment_id TEXT,                -- Links to A/B experiment if applicable
      performance_baseline TEXT,         -- JSON string
      UNIQUE(agent_name, version)
    );
  `)

  // Evaluation Results
  await db.execute(`
    CREATE TABLE IF NOT EXISTS evaluation_results (
      eval_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      model_version TEXT NOT NULL,
      golden_dataset_version TEXT,
      hallucination_score REAL,
      compliance_score REAL,
      bias_score REAL,
      safety_score REAL,
      latency_ms INTEGER,
      token_count INTEGER,
      cost_usd REAL,
      quality_gate_passed BOOLEAN NOT NULL,
      drift_detected BOOLEAN DEFAULT FALSE,
      drift_type TEXT,                    -- 'semantic', 'prompt', 'embedding', NULL
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Deletion Certificates
  await db.execute(`
    CREATE TABLE IF NOT EXISTS deletion_certificates (
      certificate_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      requested_at DATETIME NOT NULL,
      completed_at DATETIME,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
      stores_purged TEXT NOT NULL,       -- JSON string ["libsql", "qdrant", "redis", "object_storage", "backups"]
      verification_hash TEXT,            -- SHA-256 of deletion manifest
      auditor_id TEXT,                   -- Automated or human auditor
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // Documents Metadata Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents_metadata (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,                -- 'pdf', 'spreadsheet', 'statement', 'other'
      size REAL NOT NULL,                -- in MB
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,              -- 'processing', 'completed', 'failed'
      chunks INTEGER DEFAULT 0,
      embeddings INTEGER DEFAULT 0,
      file_path TEXT,
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // User Authentication Table (with passwords hashed)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_auth (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      mfa_secret TEXT,
      mfa_enabled BOOLEAN DEFAULT FALSE,
      refresh_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
    );
  `)

  // Seed default prompts if empty
  await PromptRegistry.initializeAndSeed()
}

/* User Types */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: Date
}

/* Financial Types */
export interface FinancialAccount {
  id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'loan' | 'credit-card'
  balance: number
  currency: string
  riskScore?: number
}

export interface FinancialTransaction {
  id: string
  accountId: string
  date: Date
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
}

export interface FinancialHealth {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  debtRatio: number
  healthScore: number
  trend: 'up' | 'down' | 'stable'
}

/* Agent Types */
export interface Agent {
  id: string
  name: string
  type: 'portfolio' | 'risk' | 'forecast' | 'advisor' | 'memory' | 'compliance'
  status: 'active' | 'idle' | 'processing' | 'error'
  lastActivity: Date
  confidenceScore: number
  description: string
}

export interface AgentResponse {
  id: string
  agentId: string
  timestamp: Date
  content: string
  confidence: number
  sources: string[]
  metadata?: Record<string, unknown>
}

/* Workflow Types */
export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  duration?: number
  error?: string
}

export interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  steps: WorkflowStep[]
  startTime: Date
  endTime?: Date
  duration?: number
  traceId: string
}

/* Document Types */
export interface Document {
  id: string
  name: string
  type: 'pdf' | 'spreadsheet' | 'statement' | 'other'
  size: number
  uploadedAt: Date
  status: 'processing' | 'completed' | 'failed'
  chunks?: number
  embeddings?: number
  error?: string
}

/* Memory Types */
export interface Memory {
  id: string
  content: string
  type: 'fact' | 'insight' | 'pattern' | 'recommendation'
  confidence: number
  createdAt: Date
  relatedDocuments: string[]
  embedding?: number[]
}

/* Risk Analysis Types */
export interface RiskMetric {
  name: string
  value: number
  threshold: number
  status: 'safe' | 'warning' | 'critical'
}

export interface RiskAnalysis {
  id: string
  accountId: string
  timestamp: Date
  overallScore: number
  metrics: RiskMetric[]
  recommendations: string[]
  trend: number[] // Historical trend
}

/* Chat Types */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  sources?: string[]
  metadata?: Record<string, unknown>
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  agentId?: string
}

/* Notification Types */
export interface Notification {
  id: string
  userId: string
  type: 'alert' | 'info' | 'success' | 'warning'
  title: string
  message: string
  read: boolean
  createdAt: Date
  action?: {
    label: string
    href: string
  }
}

/* Analytics Types */
export interface AnalyticsEvent {
  id: string
  userId: string
  type: string
  properties: Record<string, unknown>
  timestamp: Date
}

/* Settings Types */
export interface UserSettings {
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    dataCollection: boolean
    analytics: boolean
  }
}

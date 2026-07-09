import type { 
  User,
  FinancialHealth,
  Agent,
  FinancialAccount,
  Document,
} from '@/lib/types'

// Fixed reference time to avoid SSR/client hydration mismatch
const BASE_TIME = new Date('2024-12-21T14:00:00.000Z').getTime()

export const mockUser: User = {
  id: 'user-1',
  email: 'alex@example.com',
  name: 'Alexandra Morgan',
  role: 'user',
  createdAt: new Date('2024-01-15'),
}

export const mockFinancialHealth: FinancialHealth = {
  netWorth: 485230,
  totalAssets: 612450,
  totalLiabilities: 127220,
  monthlyIncome: 8500,
  monthlyExpenses: 3200,
  savingsRate: 0.62,
  debtRatio: 0.208,
  healthScore: 78,
  trend: 'up',
}

export const mockAccounts: FinancialAccount[] = [
  {
    id: 'acc-1',
    name: 'Primary Checking',
    type: 'checking',
    balance: 45230,
    currency: 'USD',
    riskScore: 15,
  },
  {
    id: 'acc-2',
    name: 'Emergency Fund',
    type: 'savings',
    balance: 125000,
    currency: 'USD',
    riskScore: 8,
  },
  {
    id: 'acc-3',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 342220,
    currency: 'USD',
    riskScore: 45,
  },
  {
    id: 'acc-4',
    name: 'Mortgage',
    type: 'loan',
    balance: -89000,
    currency: 'USD',
    riskScore: 12,
  },
  {
    id: 'acc-5',
    name: 'Credit Card',
    type: 'credit-card',
    balance: -3220,
    currency: 'USD',
    riskScore: 25,
  },
]

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Portfolio Builder',
    type: 'portfolio',
    status: 'active',
    lastActivity: new Date(BASE_TIME),
    confidenceScore: 0.92,
    description: 'Analyzes and optimizes investment portfolios',
  },
  {
    id: 'agent-2',
    name: 'Risk Analyzer',
    type: 'risk',
    status: 'active',
    lastActivity: new Date(BASE_TIME - 300000),
    confidenceScore: 0.88,
    description: 'Identifies and quantifies financial risks',
  },
  {
    id: 'agent-3',
    name: 'Forecaster',
    type: 'forecast',
    status: 'processing',
    lastActivity: new Date(BASE_TIME - 60000),
    confidenceScore: 0.85,
    description: 'Predicts future financial scenarios',
  },
  {
    id: 'agent-4',
    name: 'Financial Advisor',
    type: 'advisor',
    status: 'active',
    lastActivity: new Date(BASE_TIME - 600000),
    confidenceScore: 0.91,
    description: 'Provides personalized financial recommendations',
  },
  {
    id: 'agent-5',
    name: 'Memory Explorer',
    type: 'memory',
    status: 'idle',
    lastActivity: new Date(BASE_TIME - 900000),
    confidenceScore: 0.87,
    description: 'Retrieves and connects financial insights',
  },
  {
    id: 'agent-6',
    name: 'Compliance Monitor',
    type: 'compliance',
    status: 'active',
    lastActivity: new Date(BASE_TIME - 120000),
    confidenceScore: 0.94,
    description: 'Ensures regulatory compliance',
  },
]

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: '2024_Tax_Return.pdf',
    type: 'pdf',
    size: 2.4,
    uploadedAt: new Date('2024-12-15'),
    status: 'completed',
    chunks: 128,
    embeddings: 128,
  },
  {
    id: 'doc-2',
    name: 'Bank_Statements_Q4.pdf',
    type: 'pdf',
    size: 1.8,
    uploadedAt: new Date('2024-12-20'),
    status: 'completed',
    chunks: 84,
    embeddings: 84,
  },
  {
    id: 'doc-3',
    name: 'Investment_Portfolio.xlsx',
    type: 'spreadsheet',
    size: 0.85,
    uploadedAt: new Date('2024-12-18'),
    status: 'completed',
    chunks: 42,
    embeddings: 42,
  },
  {
    id: 'doc-4',
    name: 'Mortgage_Agreement.pdf',
    type: 'pdf',
    size: 0.95,
    uploadedAt: new Date('2024-12-10'),
    status: 'completed',
    chunks: 56,
    embeddings: 56,
  },
  {
    id: 'doc-5',
    name: 'Insurance_Policy.pdf',
    type: 'pdf',
    size: 1.2,
    uploadedAt: new Date('2024-12-05'),
    status: 'processing',
  },
]

export const mockDashboardMetrics = {
  monthlyIncome: [
    { month: 'Jan', value: 7500 },
    { month: 'Feb', value: 8200 },
    { month: 'Mar', value: 7800 },
    { month: 'Apr', value: 8500 },
    { month: 'May', value: 8200 },
    { month: 'Jun', value: 8500 },
  ],
  netWorthTrend: [
    { date: '1/1', value: 450000 },
    { date: '2/1', value: 458000 },
    { date: '3/1', value: 465000 },
    { date: '4/1', value: 472000 },
    { date: '5/1', value: 478000 },
    { date: '6/1', value: 485230 },
  ],
  assetAllocation: [
    { name: 'Stocks', value: 38, fill: '#4f46e5' },
    { name: 'Bonds', value: 25, fill: '#06b6d4' },
    { name: 'Real Estate', value: 22, fill: '#8b5cf6' },
    { name: 'Cash', value: 9, fill: '#ec4899' },
    { name: 'Other', value: 6, fill: '#f59e0b' },
  ],
  riskDistribution: [
    { name: 'Low Risk', value: 35, color: '#22c55e' },
    { name: 'Medium Risk', value: 45, color: '#f59e0b' },
    { name: 'High Risk', value: 20, color: '#ef4444' },
  ],
}

export const mockActivityFeed = [
  {
    id: '1',
    type: 'transaction',
    title: 'Investment Purchase',
    description: 'Purchased 50 shares of AAPL at $192.50',
    timestamp: new Date(BASE_TIME - 3600000),
    icon: 'TrendingUp',
  },
  {
    id: '2',
    type: 'alert',
    title: 'Risk Alert',
    description: 'Portfolio volatility increased by 5%',
    timestamp: new Date(BASE_TIME - 7200000),
    icon: 'AlertTriangle',
  },
  {
    id: '3',
    type: 'insight',
    title: 'AI Recommendation',
    description: 'Advisor suggests rebalancing your portfolio',
    timestamp: new Date(BASE_TIME - 10800000),
    icon: 'Lightbulb',
  },
  {
    id: '4',
    type: 'document',
    title: 'Document Processed',
    description: 'Tax return has been analyzed and filed',
    timestamp: new Date(BASE_TIME - 86400000),
    icon: 'FileText',
  },
]

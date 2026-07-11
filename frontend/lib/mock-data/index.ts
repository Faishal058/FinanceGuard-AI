import type { 
  User,
  FinancialHealth,
  Agent,
  FinancialAccount,
  Document,
} from '@/lib/types'

const BASE_TIME = Date.now()

export const mockUser: User = {
  id: '',
  email: '',
  name: '',
  role: 'user',
  createdAt: new Date(),
}

export const mockFinancialHealth: FinancialHealth = {
  netWorth: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
  debtRatio: 0,
  healthScore: 0,
  trend: 'stable',
}

export const mockAccounts: FinancialAccount[] = []

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

export const mockDocuments: Document[] = []

export const mockDashboardMetrics = {
  monthlyIncome: [],
  netWorthTrend: [],
  assetAllocation: [],
  riskDistribution: [],
}

export const mockActivityFeed = []

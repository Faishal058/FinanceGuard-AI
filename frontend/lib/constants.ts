export const APP_NAME = 'FinanceGuard AI'
export const APP_DESCRIPTION = 'Enterprise Financial Intelligence Platform'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  WORKSPACE: '/workspace',
  DOCUMENTS: '/documents',
  RISK_ANALYSIS: '/risk-analysis',
  FORECAST: '/forecast',
  ADVISOR: '/advisor',
  MEMORY: '/memory',
  AGENTS: '/agents',
  WORKFLOWS: '/workflows',
  SAFETY: '/safety',
  OBSERVABILITY: '/observability',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  ADMIN: '/admin',
}

export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'AI Workspace',
    href: ROUTES.WORKSPACE,
    icon: 'MessageSquare',
  },
  {
    label: 'Documents',
    href: ROUTES.DOCUMENTS,
    icon: 'FileText',
  },
  {
    label: 'Risk Analysis',
    href: ROUTES.RISK_ANALYSIS,
    icon: 'AlertTriangle',
  },
  {
    label: 'Forecast',
    href: ROUTES.FORECAST,
    icon: 'TrendingUp',
  },
  {
    label: 'Advisor',
    href: ROUTES.ADVISOR,
    icon: 'Lightbulb',
  },
  {
    label: 'Memory',
    href: ROUTES.MEMORY,
    icon: 'Brain',
  },
  {
    label: 'Agents',
    href: ROUTES.AGENTS,
    icon: 'Zap',
  },
  {
    label: 'Workflows',
    href: ROUTES.WORKFLOWS,
    icon: 'Workflow',
  },
  {
    label: 'Safety',
    href: ROUTES.SAFETY,
    icon: 'Shield',
  },
  {
    label: 'Observability',
    href: ROUTES.OBSERVABILITY,
    icon: 'Eye',
  },
]

export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'loan', label: 'Loan' },
  { value: 'credit-card', label: 'Credit Card' },
]

export const AGENT_TYPES = [
  { value: 'portfolio', label: 'Portfolio Builder' },
  { value: 'risk', label: 'Risk Analyzer' },
  { value: 'forecast', label: 'Forecaster' },
  { value: 'advisor', label: 'Financial Advisor' },
  { value: 'memory', label: 'Memory Explorer' },
  { value: 'compliance', label: 'Compliance Monitor' },
]

export const AGENT_STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export const RISK_STATUS_COLORS = {
  safe: 'text-green-400',
  warning: 'text-yellow-400',
  critical: 'text-red-400',
}

export const HEALTH_SCORE_BREAKPOINTS = [
  { min: 0, max: 20, label: 'Poor', color: '#ef4444' },
  { min: 20, max: 40, label: 'Fair', color: '#f59e0b' },
  { min: 40, max: 60, label: 'Good', color: '#eab308' },
  { min: 60, max: 80, label: 'Very Good', color: '#84cc16' },
  { min: 80, max: 100, label: 'Excellent', color: '#22c55e' },
]

export const ANIMATION_DURATION = {
  fast: 150,
  base: 300,
  slow: 500,
}

export const TOAST_DURATION = 3000

export const PAGINATION_SIZE = 20

export const DEBOUNCE_DELAY = 300

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
}

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ACCEPTED_FILE_TYPES = ['.pdf', '.csv', '.xlsx', '.xls', '.doc', '.docx']

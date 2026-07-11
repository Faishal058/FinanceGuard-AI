'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MetricCard } from '@/components/common/metric-card'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader, ConfidenceBar } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Progress, CircularProgress } from '@/components/ui/progress'
import { mockFinancialHealth, mockAgents, mockActivityFeed, mockDashboardMetrics } from '@/lib/mock-data'
import { formatCurrency, formatPercent, formatRelativeTime } from '@/lib/utils'
import { pageVariants, containerVariants, itemVariants, cardHoverProps } from '@/lib/animations'
import { ApiClient } from '@/lib/api-client'
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  DollarSign, TrendingUp, Activity, Target,
  Zap, ArrowRight, Sparkles, Brain, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

/* ─────────────────────────────────────────────────────────
   CHART TOOLTIP STYLE
───────────────────────────────────────────────────────── */
const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}
const labelStyle = { color: '#f8fafc', fontWeight: 600, fontSize: 12 }
const itemStyle = { color: '#94a3b8', fontSize: 12 }

/* ─────────────────────────────────────────────────────────
   AGENT STATUS ROW
───────────────────────────────────────────────────────── */
const agentIcons: Record<string, string> = {
  portfolio: '📈', risk: '⚡', forecast: '🔮',
  advisor: '💡', memory: '🧠', compliance: '🛡️',
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fg_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const res = await ApiClient.get('/api/v2/dashboard')
        setData(res)
      } catch (e) {
        console.error('Failed to load dashboard metrics from API', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const health = data?.metrics || mockFinancialHealth
  const topAgents = mockAgents.slice(0, 4)
  const recentActivity = data?.activityFeed || mockActivityFeed.slice(0, 4)
  const netWorthTrend = data?.netWorthTrend || mockDashboardMetrics.netWorthTrend
  const assetAllocation = data?.assetAllocation || mockDashboardMetrics.assetAllocation


  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page Header ── */}
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.name.split(' ')[0]}. Here's your complete financial overview.` : "Welcome back, Alexandra. Here's your complete financial overview."}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
              Ask AI
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />} glow>
              Run Analysis
            </Button>
          </div>
        }
      />

      {/* ── Key Metrics ── */}
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        <MetricCard
          label="Net Worth"
          value={formatCurrency(health.netWorth)}
          icon={DollarSign}
          trend="up"
          trendValue="+$7,230 this month"
          variant="gradient"
        />
        <MetricCard
          label="Monthly Income"
          value={formatCurrency(health.monthlyIncome)}
          icon={TrendingUp}
          trend="stable"
          trendValue="No change"
        />
        <MetricCard
          label="Financial Health"
          value={health.healthScore}
          subvalue="/ 100"
          icon={Activity}
          trend="up"
          trendValue="+3 pts this week"
        />
        <MetricCard
          label="Savings Rate"
          value={formatPercent(health.savingsRate)}
          icon={Target}
          trend="up"
          trendValue="+2% from last month"
        />
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        variants={containerVariants}
      >
        {/* Net Worth Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <SectionHeader
                title="Net Worth Trend"
                description="6-month portfolio growth"
              />
              <span className="text-sm font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg">
                +7.8%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={netWorthTrend}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle}
                  formatter={(v: number) => [formatCurrency(v), 'Net Worth']}
                />
                <Area
                  type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2}
                  fill="url(#netWorthGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Health Score Ring + Asset Allocation */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full flex flex-col gap-6">
            {/* Health Ring */}
            <div className="flex flex-col items-center gap-3">
              <SectionHeader title="Health Score" className="w-full" />
              <CircularProgress
                value={health.healthScore}
                size={120}
                strokeWidth={8}
                color="#6366f1"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{health.healthScore}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </CircularProgress>
              <p className="text-sm font-medium text-success">Very Good</p>
            </div>

            {/* Asset Allocation Pie */}
            <div>
              <SectionHeader title="Asset Mix" className="mb-3" />
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={65}
                    paddingAngle={3} dataKey="value"
                  >
                    {assetAllocation.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle}
                    formatter={(v: number) => [`${v}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {assetAllocation.map(a => (
                  <div key={a.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: a.fill }} />
                    <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                    <span className="text-xs font-medium text-foreground ml-auto">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Financial Summary ── */}
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
        variants={containerVariants}
      >
        {[
          { label: 'Total Assets', value: formatCurrency(health.totalAssets), pct: 100, color: 'bg-primary' },
          { label: 'Total Liabilities', value: formatCurrency(health.totalLiabilities), pct: (health.totalLiabilities / health.totalAssets) * 100, color: 'bg-destructive' },
          { label: 'Monthly Expenses', value: formatCurrency(health.monthlyExpenses), pct: (health.monthlyExpenses / health.monthlyIncome) * 100, color: 'bg-warning' },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard>
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{item.value}</p>
              <Progress value={item.pct} variant="gradient" size="xs" className="mt-3" />
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Agents + Activity ── */}
      <motion.div
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        variants={containerVariants}
      >
        {/* Active Agents */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="AI Agents" description="Live status of your financial agents" />
              <Link href={ROUTES.AGENTS}>
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                  View all
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {topAgents.map(agent => (
                <motion.div
                  key={agent.id}
                  {...cardHoverProps}
                  className="flex items-center gap-4 rounded-xl bg-surface-2 p-4 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                    {agentIcons[agent.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">{agent.name}</p>
                      <StatusBadge status={agent.status} size="xs" />
                    </div>
                    <ConfidenceBar value={agent.confidenceScore} size="sm" className="mt-2" />
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(agent.lastActivity)}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Activity + Safety */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-5">
          {/* Safety */}
          <GlassCard variant="gradient" padding="md">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-5 w-5 text-success" />
              <SectionHeader title="AI Safety" description="Enkrypt guardrails status" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Input Safety', value: 99 },
                { label: 'Output Safety', value: 97 },
                { label: 'Compliance', value: 95 },
                { label: 'Bias Detection', value: 98 },
              ].map(item => (
                <Progress key={item.label} value={item.value} variant="success"
                  size="sm" label={item.label} showLabel />
              ))}
            </div>
          </GlassCard>

          {/* Activity */}
          <GlassCard padding="md">
            <SectionHeader title="Recent Activity" className="mb-4" />
            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/60 shrink-0 ring-2 ring-primary/20" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    <p className="text-xs text-tertiary mt-1">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <GlassCard padding="md">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground mr-2">Quick Actions:</p>
            {[
              { label: 'Run Analysis', href: ROUTES.RISK_ANALYSIS, variant: 'default' as const, icon: <Zap className="h-3.5 w-3.5" /> },
              { label: 'View Forecast', href: ROUTES.FORECAST, variant: 'outline' as const, icon: <TrendingUp className="h-3.5 w-3.5" /> },
              { label: 'Ask Advisor', href: ROUTES.WORKSPACE, variant: 'outline' as const, icon: <Brain className="h-3.5 w-3.5" /> },
              { label: 'Upload Docs', href: ROUTES.DOCUMENTS, variant: 'ghost' as const, icon: null },
            ].map(action => (
              <Link key={action.label} href={action.href}>
                <Button variant={action.variant} size="sm" leftIcon={action.icon ?? undefined}>
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

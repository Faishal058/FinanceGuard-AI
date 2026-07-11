'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { MetricCard } from '@/components/common/metric-card'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader, ConfidenceBar } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { TrendingUp, Target, Calendar, Download, Settings, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
}

export default function ForecastPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)
  const [forecastData, setForecastData] = useState<any>(null)

  const fetchForecast = async () => {
    try {
      setLoading(true)
      const res = await ApiClient.get('/api/v2/forecast')
      if (res && res.hasData) {
        setHasDocs(true)
        setForecastData(res)
      } else {
        setHasDocs(false)
        setForecastData(null)
      }
    } catch (e) {
      console.error(e)
      setHasDocs(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!hasDocs || !forecastData) {
    return (
      <motion.div
        className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader
          title="Forecast"
          description="Model future financial scenarios based on historical transaction profiles"
        />
        <EmptyState
          preset="folder"
          title="No Forecasts Modeled"
          description="Please upload your bank statement or CSV files in the Documents page to trigger the AI Forecast Agent."
          action={{
            label: "Go to Documents",
            onClick: () => window.location.href = "/documents",
            variant: "gradient"
          }}
        />
      </motion.div>
    )
  }

  const { summary, profile, forecastChartData } = forecastData

  const scenarios = [
    {
      title: 'Pessimistic',
      value: formatCurrency(summary.pessimistic6m),
      change: `+${(parseFloat(summary.projectedGrowthPct) * 0.4).toFixed(1)}%`,
      color: 'text-destructive',
      bg: 'bg-destructive/8',
      border: 'border-destructive/20',
      badge: 'danger' as const,
      confidence: 0.72,
      desc: 'Conservative estimates, market downturn scenario',
    },
    {
      title: 'Realistic',
      value: formatCurrency(summary.realistic6m),
      change: `+${summary.projectedGrowthPct}%`,
      color: 'text-secondary',
      bg: 'bg-secondary/8',
      border: 'border-secondary/20',
      badge: 'secondary' as const,
      confidence: 0.88,
      desc: 'Based on current trends and historical averages',
    },
    {
      title: 'Optimistic',
      value: formatCurrency(summary.optimistic6m),
      change: `+${(parseFloat(summary.projectedGrowthPct) * 1.5).toFixed(1)}%`,
      color: 'text-success',
      bg: 'bg-success/8',
      border: 'border-success/20',
      badge: 'success' as const,
      confidence: 0.65,
      desc: 'Favorable market conditions and higher savings rate',
    },
  ]

  // Calculate dynamic goals based on real profile data
  const dynamicGoals = [
    { label: 'Retirement Fund Target', target: Math.max(500000, profile.netWorth * 2), current: profile.netWorth, color: 'primary' },
    { label: 'Emergency Fund (6m Buffer)', target: profile.totalExpenses * 6, current: Math.min(profile.totalExpenses * 6, profile.netWorth * 0.25), color: 'success' },
    { label: 'Debt Repayment buffer', target: profile.totalExpenses * 3, current: Math.min(profile.totalExpenses * 3, profile.netWorth * 0.1), color: 'warning' },
  ]

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Financial Forecast"
        description="AI-powered 6-month projections based on your financial data and market conditions"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchForecast} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Refresh
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} glow>
              Export Report
            </Button>
          </div>
        }
      />

      {/* ── Scenario Cards ── */}
      <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-3" variants={containerVariants}>
        {scenarios.map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard className={`border ${s.border} ${s.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{s.title} Scenario</p>
                <Badge variant={s.badge} size="sm">{s.change}</Badge>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-2 mb-4">{s.desc}</p>
              <ConfidenceBar value={s.confidence} size="sm" label="AI Confidence" />
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Forecast Chart ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-start justify-between mb-6">
            <SectionHeader
              title="Net Worth Projection"
              description="6-month scenario comparison"
            />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-success inline-block" />Optimistic</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-secondary inline-block" />Realistic</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-destructive inline-block" />Pessimistic</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={forecastChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#f8fafc' }}
                formatter={(v: any) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v), '']}
              />
              <Line type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} dot={false} name="Optimistic" strokeDasharray="6 3" />
              <Line type="monotone" dataKey="realistic" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 3 }} name="Realistic" />
              <Line type="monotone" dataKey="pessimistic" stroke="#f43f5e" strokeWidth={2} dot={false} name="Pessimistic" strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      {/* ── Goals Progress ── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {dynamicGoals.map((goal, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{goal.label}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(goal.current / 1000).toFixed(1)}K of ${(goal.target / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
              <Progress
                value={goal.target > 0 ? (goal.current / goal.target) * 100 : 0}
                variant="gradient"
                size="md"
                showLabel
                animated
              />
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Key Metrics ── */}
      <motion.div className="grid grid-cols-1 gap-5 sm:grid-cols-4" variants={containerVariants}>
        <MetricCard label="Projected Growth" value={`+${summary.projectedGrowthPct}%`} icon={TrendingUp} trend="up" trendValue="Realistic scenario" />
        <MetricCard label="Time to Goal" value="5.2 yrs" icon={Calendar} trend="stable" trendValue="Accumulator target" />
        <MetricCard label="Monthly Surplus" value={formatCurrency(summary.monthlySurplus)} icon={Target} trend={summary.monthlySurplus > 0 ? 'up' : 'down'} trendValue={summary.monthlySurplus > 0 ? 'Positive cashflow' : 'Negative cashflow'} />
        <MetricCard label="Savings rate" value={`${profile.savingsRate.toFixed(1)}%`} icon={TrendingUp} trend="up" trendValue="Assessed benchmark" />
      </motion.div>
    </motion.div>
  )
}

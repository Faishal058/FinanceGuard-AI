'use client'

import { motion } from 'framer-motion'
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
import { TrendingUp, Target, Calendar, Download, Settings } from 'lucide-react'

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
}

const forecastData = [
  { month: 'Now', optimistic: 485230, realistic: 485230, pessimistic: 485230 },
  { month: 'Jan', optimistic: 500000, realistic: 490000, pessimistic: 468000 },
  { month: 'Feb', optimistic: 520000, realistic: 498000, pessimistic: 472000 },
  { month: 'Mar', optimistic: 545000, realistic: 510000, pessimistic: 480000 },
  { month: 'Apr', optimistic: 575000, realistic: 530000, pessimistic: 490000 },
  { month: 'May', optimistic: 610000, realistic: 555000, pessimistic: 505000 },
  { month: 'Jun', optimistic: 650000, realistic: 585000, pessimistic: 520000 },
]

const goals = [
  { label: 'Retirement Fund', target: 1000000, current: 485230, color: 'primary' },
  { label: 'Emergency Fund', target: 51000, current: 45230, color: 'success' },
  { label: 'Down Payment', target: 100000, current: 67000, color: 'warning' },
]

export default function ForecastPage() {
  const scenarios = [
    {
      title: 'Pessimistic',
      value: '$520,000',
      change: '+7.2%',
      color: 'text-destructive',
      bg: 'bg-destructive/8',
      border: 'border-destructive/20',
      badge: 'danger' as const,
      confidence: 0.72,
      desc: 'Conservative estimates, market downturn scenario',
    },
    {
      title: 'Realistic',
      value: '$585,000',
      change: '+20.5%',
      color: 'text-secondary',
      bg: 'bg-secondary/8',
      border: 'border-secondary/20',
      badge: 'secondary' as const,
      confidence: 0.88,
      desc: 'Based on current trends and historical averages',
    },
    {
      title: 'Optimistic',
      value: '$650,000',
      change: '+34.0%',
      color: 'text-success',
      bg: 'bg-success/8',
      border: 'border-success/20',
      badge: 'success' as const,
      confidence: 0.65,
      desc: 'Favorable market conditions and higher savings rate',
    },
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
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />}>
              Parameters
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
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#f8fafc' }}
                formatter={(v: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v), '']}
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
        {goals.map((goal, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{goal.label}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(goal.current / 1000).toFixed(0)}K of ${(goal.target / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
              <Progress
                value={(goal.current / goal.target) * 100}
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
        <MetricCard label="Projected Growth" value="+20.5%" icon={TrendingUp} trend="up" trendValue="Realistic scenario" />
        <MetricCard label="Time to Goal" value="7.5 yrs" icon={Calendar} trend="stable" trendValue="Retirement goal" />
        <MetricCard label="Monthly Surplus" value="$5,300" icon={Target} trend="up" trendValue="+$200 this month" />
        <MetricCard label="Compound Return" value="8.4%" icon={TrendingUp} trend="up" trendValue="Annualized" />
      </motion.div>
    </motion.div>
  )
}

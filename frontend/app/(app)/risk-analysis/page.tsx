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
import { cn } from '@/lib/utils'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import {
  AlertTriangle, TrendingDown, Shield, Activity,
  RefreshCw, Download, Info,
} from 'lucide-react'

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
}

const riskMetrics = [
  { category: 'Volatility', value: 45 },
  { category: 'Concentration', value: 62 },
  { category: 'Liquidity', value: 38 },
  { category: 'Credit', value: 28 },
  { category: 'Interest Rate', value: 35 },
  { category: 'Operational', value: 22 },
]

const riskBreakdown = [
  { risk: 'Low Risk', count: 35, fill: '#10b981' },
  { risk: 'Medium Risk', count: 45, fill: '#f59e0b' },
  { risk: 'High Risk', count: 20, fill: '#f43f5e' },
]

const heatmapItems = [
  { title: 'Market Risk', score: 45, level: 'medium' },
  { title: 'Credit Risk', score: 28, level: 'low' },
  { title: 'Liquidity Risk', score: 38, level: 'medium' },
  { title: 'Operational Risk', score: 22, level: 'low' },
  { title: 'Concentration Risk', score: 62, level: 'high' },
  { title: 'Regulatory Risk', score: 18, level: 'low' },
]

const levelConfig = {
  low: { badge: 'success' as const, bar: 'success', label: 'Low' },
  medium: { badge: 'warning' as const, bar: 'warning', label: 'Medium' },
  high: { badge: 'danger' as const, bar: 'danger', label: 'High' },
}

export default function RiskAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)

  useEffect(() => {
    async function checkDocs() {
      try {
        const res = await ApiClient.get('/api/v2/dashboard')
        if (res && res.metrics && res.metrics.documentCount > 0) {
          setHasDocs(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    checkDocs()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!hasDocs) {
    return (
      <motion.div
        className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader
          title="Risk Analysis"
          description="Comprehensive AI-powered portfolio risk assessment and monitoring"
        />
        <EmptyState
          preset="alerts"
          title="No Risk Analysis Available"
          description="Please upload your bank statement or CSV files in the Documents page to trigger the AI Risk Auditor Agent."
          action={{
            label: "Go to Documents",
            onClick: () => window.location.href = "/documents",
            variant: "gradient"
          }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Risk Analysis"
        description="Comprehensive AI-powered portfolio risk assessment and monitoring"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Refresh
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} glow>
              Export
            </Button>
          </div>
        }
      />

      {/* ── Key Metrics ── */}
      <motion.div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" variants={containerVariants}>
        <MetricCard label="Overall Risk Score" value="42" subvalue="/ 100"
          icon={AlertTriangle} trend="up" trendValue="+3 pts this week" trendPositiveIsUp={false} />
        <MetricCard label="Portfolio Beta" value="0.92"
          icon={Activity} trend="stable" trendValue="Neutral" />
        <MetricCard label="Value at Risk (95%)" value="$23,450"
          icon={TrendingDown} trend="down" trendValue="-2% from last month" trendPositiveIsUp={false} />
        <MetricCard label="Sharpe Ratio" value="1.28"
          icon={Shield} trend="up" trendValue="+0.1 improvement" />
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" variants={containerVariants}>
        {/* Risk Radar */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader title="Risk Profile Radar" description="Multi-dimensional risk assessment" className="mb-5" />
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskMetrics}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#475569', fontSize: 11 }}
                />
                <Radar
                  name="Risk Level" dataKey="value"
                  stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader title="Risk Distribution" description="Asset allocation by risk level" className="mb-5" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskBreakdown} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="risk" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
                  formatter={(v: number) => [`${v}%`, 'Allocation']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {riskBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Risk Heat Map ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <SectionHeader
              title="Risk Heat Map"
              description="Individual risk category scores"
            />
            <div className="flex items-center gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <Badge key={level} variant={levelConfig[level].badge} size="sm" dot>
                  {levelConfig[level].label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heatmapItems.map(item => {
              const cfg = levelConfig[item.level as keyof typeof levelConfig]
              return (
                <div
                  key={item.title}
                  className="rounded-xl bg-surface-2 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <Badge variant={cfg.badge} size="sm">{item.score}</Badge>
                  </div>
                  <Progress
                    value={item.score}
                    variant={cfg.bar as any}
                    size="md"
                    animated
                  />
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {item.level === 'high' ? 'Requires immediate attention' :
                       item.level === 'medium' ? 'Monitor closely' : 'Within acceptable range'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* ── AI Recommendations ── */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="gradient">
          <SectionHeader
            title="AI Risk Recommendations"
            description="Powered by FinanceGuard AI agents"
            className="mb-5"
          />
          <div className="space-y-3">
            {[
              { title: 'Reduce Concentration Risk', desc: 'Your top 3 holdings represent 62% of your portfolio. Consider diversifying.', confidence: 0.92, priority: 'high' },
              { title: 'Add Defensive Assets', desc: 'Market volatility is elevated. Adding 5-10% to bonds may reduce overall risk.', confidence: 0.85, priority: 'medium' },
              { title: 'Review Interest Rate Exposure', desc: 'Rising rates could impact your fixed income holdings by up to 3.5%.', confidence: 0.78, priority: 'low' },
            ].map((rec, i) => (
              <div key={i} className="rounded-xl bg-surface-2/60 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <Badge
                        variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'secondary'}
                        size="sm"
                      >
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.desc}</p>
                  </div>
                </div>
                <ConfidenceBar value={rec.confidence} size="sm" />
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

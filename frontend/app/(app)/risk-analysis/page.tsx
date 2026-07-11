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

const levelConfig = {
  low: { badge: 'success' as const, bar: 'success', label: 'Low' },
  medium: { badge: 'warning' as const, bar: 'warning', label: 'Medium' },
  high: { badge: 'danger' as const, bar: 'danger', label: 'High' },
}

export default function RiskAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)
  const [riskData, setRiskData] = useState<any>(null)

  const fetchRiskData = async () => {
    try {
      setLoading(true)
      const res = await ApiClient.get('/api/v2/risk')
      if (res && res.hasData) {
        setHasDocs(true)
        setRiskData(res)
      } else {
        setHasDocs(false)
        setRiskData(null)
      }
    } catch (e) {
      console.error('Failed to fetch risk data', e)
      setHasDocs(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiskData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!hasDocs || !riskData) {
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

  const { profile, riskReport } = riskData
  const score = riskReport?.overall_risk_score || 10

  // 1. Calculate dynamic Radar chart metrics based on real profile values
  const dtiVal = profile?.dti || 0
  const savingsRate = profile?.savingsRate || 0
  
  const volatility = Math.min(100, Math.max(15, Math.round(score * 1.1)))
  const concentration = 40 + Math.round((profile?.riskTolerance || 5) * 6)
  const liquidity = Math.min(100, Math.max(10, Math.round(100 - savingsRate)))
  const credit = Math.min(100, Math.round(dtiVal * 120))
  const interestRate = 35
  const operational = Math.min(100, Math.max(10, Math.round(score * 0.5)))

  const dynamicRiskMetrics = [
    { category: 'Volatility', value: volatility },
    { category: 'Concentration', value: concentration },
    { category: 'Liquidity', value: liquidity },
    { category: 'Credit', value: credit },
    { category: 'Interest Rate', value: interestRate },
    { category: 'Operational', value: operational },
  ]

  // 2. Calculate dynamic Risk Distribution
  const highRiskAllocation = Math.min(60, Math.round(dtiVal * 100))
  const lowRiskAllocation = Math.min(80, Math.max(10, Math.round(savingsRate * 1.5)))
  const medRiskAllocation = Math.max(10, 100 - highRiskAllocation - lowRiskAllocation)

  const dynamicRiskBreakdown = [
    { risk: 'Low Risk', count: lowRiskAllocation, fill: '#10b981' },
    { risk: 'Medium Risk', count: medRiskAllocation, fill: '#f59e0b' },
    { risk: 'High Risk', count: highRiskAllocation, fill: '#f43f5e' },
  ]

  // 3. Dynamic Heatmap categories
  const dtiLevel = dtiVal > 0.43 ? 'high' : dtiVal >= 0.35 ? 'medium' : 'low'
  const savingsLevel = savingsRate < 10 ? 'high' : savingsRate < 20 ? 'medium' : 'low'
  const overallLevel = score > 60 ? 'high' : score > 30 ? 'medium' : 'low'

  const dynamicHeatmapItems = [
    { title: 'Debt burden (DTI)', score: Math.min(100, Math.round(dtiVal * 100)), level: dtiLevel },
    { title: 'Liquidity drain', score: Math.min(100, Math.max(0, Math.round(100 - savingsRate))), level: savingsLevel },
    { title: 'Overall risk score', score: score, level: overallLevel },
  ]

  // 4. Transform riskReport.risk_flags into AI Recommendation cards
  const recommendations = (riskReport?.risk_flags || []).map((flag: any) => {
    let priority = 'low'
    if (flag.severity === 'CRITICAL' || flag.severity === 'HIGH') priority = 'high'
    else if (flag.severity === 'MEDIUM') priority = 'medium'

    return {
      title: flag.flag_type.replace(/_/g, ' '),
      desc: flag.description,
      confidence: riskReport?.confidence_score || 0.92,
      priority,
    }
  })

  // Fallback recommendations if list is empty
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Healthy Risk Profile',
      desc: 'All analyzed risk indices (DTI, Savings rate, liquidity ratio) are currently within acceptable limits.',
      confidence: 0.95,
      priority: 'low',
    })
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
            <Button variant="outline" size="sm" onClick={fetchRiskData} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
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
        <MetricCard
          label="Overall Risk Score"
          value={score.toString()}
          subvalue="/ 100"
          icon={AlertTriangle}
          trend={score > 50 ? 'up' : 'stable'}
          trendValue={score > 50 ? 'Elevated exposure' : 'Moderate'}
          trendPositiveIsUp={false}
        />
        <MetricCard
          label="Debt-to-Income"
          value={`${(dtiVal * 100).toFixed(1)}%`}
          icon={Activity}
          trend={dtiVal > 0.35 ? 'up' : 'down'}
          trendValue={dtiVal > 0.35 ? 'Critical range' : 'Healthy ratio'}
          trendPositiveIsUp={false}
        />
        <MetricCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={TrendingDown}
          trend={savingsRate > 20 ? 'up' : 'down'}
          trendValue={savingsRate > 20 ? 'Target achieved' : 'Action suggested'}
        />
        <MetricCard
          label="Risk Tolerance"
          value={(profile?.riskTolerance || 5).toString()}
          subvalue="/ 10"
          icon={Shield}
          trend="stable"
          trendValue="Assessed configuration"
        />
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" variants={containerVariants}>
        {/* Risk Radar */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader title="Risk Profile Radar" description="Multi-dimensional risk assessment" className="mb-5" />
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={dynamicRiskMetrics}>
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
              <BarChart data={dynamicRiskBreakdown} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="risk" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
                  formatter={(v: any) => [`${v}%`, 'Allocation']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {dynamicRiskBreakdown.map((entry, i) => (
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
            {dynamicHeatmapItems.map(item => {
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
            description="Powered by autonomous risk auditor agents"
            className="mb-5"
          />
          <div className="space-y-3">
            {recommendations.map((rec: any, i: number) => (
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

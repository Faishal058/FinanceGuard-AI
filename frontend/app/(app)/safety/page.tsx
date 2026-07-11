'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader, ConfidenceBar } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CircularProgress } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { Shield, ShieldCheck, AlertTriangle, Eye, Lock, FileCheck, RefreshCw, CheckCircle2 } from 'lucide-react'

const resultConfig = {
  pass: { badge: 'success' as const, icon: CheckCircle2, color: 'text-success' },
  warn: { badge: 'warning' as const, icon: AlertTriangle, color: 'text-warning' },
  block: { badge: 'danger' as const, icon: Shield, color: 'text-destructive' },
}

export default function SafetyPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)
  const [safetyData, setSafetyData] = useState<any>(null)

  const fetchSafety = async () => {
    try {
      setLoading(true)
      const res = await ApiClient.get('/api/v2/safety')
      if (res && res.hasData) {
        setHasDocs(true)
        setSafetyData(res)
      } else {
        setHasDocs(false)
        setSafetyData(null)
      }
    } catch (e) {
      console.error(e)
      setHasDocs(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSafety()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!hasDocs || !safetyData) {
    return (
      <motion.div
        className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader
          title="AI Safety"
          description="Compliance audit trails and real-time validation layers"
        />
        <EmptyState
          preset="alerts"
          title="No Safety Audits Logged"
          description="Please upload your bank statement or CSV files in the Documents page to trigger the AI Safety Guardrail Pipeline."
          action={{
            label: "Go to Documents",
            onClick: () => window.location.href = "/documents",
            variant: "gradient"
          }}
        />
      </motion.div>
    )
  }

  const { overallScore, stats, guardrails, auditLog } = safetyData

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="AI Safety"
        description="Enkrypt AI guardrails monitoring — real-time safety, compliance, and bias detection for all AI outputs"
        actions={
          <Button variant="outline" size="sm" onClick={fetchSafety} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      {/* ── Overall Score + Stats ── */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-4" variants={containerVariants}>
        {/* Score Ring */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <GlassCard variant="gradient" className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall Safety</p>
            <CircularProgress value={overallScore} size={140} strokeWidth={10} color="#10b981">
              <div className="text-center">
                <p className="text-3xl font-bold text-success tabular-nums">{overallScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </CircularProgress>
            <Badge variant="success" size="md" dot>Enterprise Grade</Badge>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
            {[
              { icon: ShieldCheck, label: 'Total Checks', value: stats.totalChecks.toString(), sub: 'Today', color: 'text-success' },
              { icon: AlertTriangle, label: 'Warnings / Redacts', value: stats.warnings.toString(), sub: 'Compliance logs', color: 'text-warning' },
              { icon: Lock, label: 'Blocked requests', value: stats.blocked.toString(), sub: 'Safety blocks', color: 'text-destructive' },
            ].map((s, i) => (
              <GlassCard key={i} padding="md" className="flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-surface-3 flex items-center justify-center">
                    <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.7} />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Guardrail Status ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <SectionHeader
            title="Enkrypt Guardrails"
            description="Real-time status of all safety layers"
            className="mb-6"
            action={<Badge variant="success" size="sm" dot pulse>All Active</Badge>}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guardrails.map((g: any) => (
              <div key={g.name} className="rounded-xl bg-surface-2 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.description}</p>
                  </div>
                  <span className="text-sm font-bold text-success shrink-0">{g.score}%</span>
                </div>
                <Progress value={g.score} variant="success" size="sm" animated />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{g.checks.toLocaleString()} checks</span>
                  {g.blocked > 0 && (
                    <span className="text-warning">{g.blocked} flagged</span>
                  )}
                  {g.blocked === 0 && (
                    <span className="text-success">0 issues</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Audit Log ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-5">
            <SectionHeader title="Audit Log" description="Recent safety events" />
            <Button variant="ghost" size="xs" leftIcon={<FileCheck className="h-3 w-3" />}>
              Export Log
            </Button>
          </div>
          <div className="space-y-2">
            {auditLog.map((log: any, i: number) => {
              const cfg = resultConfig[log.result as keyof typeof resultConfig]
              const Icon = cfg.icon
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl bg-surface-2 p-3.5">
                  <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{log.time}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{log.event}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {log.detail}</span>
                  </div>
                  <Badge variant="outline" size="sm">{log.agent}</Badge>
                  <Badge variant={cfg.badge} size="sm">{log.result.toUpperCase()}</Badge>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { Workflow, CheckCircle2, XCircle, Clock, Play, Plus, RotateCcw } from 'lucide-react'

const workflows = [
  {
    id: 'wf-1', name: 'Full Portfolio Analysis', status: 'completed', duration: '2m 14s',
    lastRun: '5 min ago', traceId: 'tr_abc123',
    steps: [
      { name: 'Document Ingestion', status: 'completed', duration: '12s' },
      { name: 'Qdrant Embedding', status: 'completed', duration: '8s' },
      { name: 'Risk Analysis Agent', status: 'completed', duration: '45s' },
      { name: 'Portfolio Optimization', status: 'completed', duration: '62s' },
      { name: 'Report Generation', status: 'completed', duration: '7s' },
    ],
  },
  {
    id: 'wf-2', name: 'Tax Document Processing', status: 'running', duration: '1m 32s',
    lastRun: 'Now', traceId: 'tr_def456',
    steps: [
      { name: 'PDF Extraction', status: 'completed', duration: '5s' },
      { name: 'Entity Recognition', status: 'completed', duration: '18s' },
      { name: 'Tax Calculation Agent', status: 'running', duration: '—' },
      { name: 'Compliance Check', status: 'pending', duration: '—' },
      { name: 'Summary Generation', status: 'pending', duration: '—' },
    ],
  },
  {
    id: 'wf-3', name: 'Market Risk Assessment', status: 'failed', duration: '0m 48s',
    lastRun: '2 hours ago', traceId: 'tr_ghi789',
    steps: [
      { name: 'Market Data Fetch', status: 'completed', duration: '3s' },
      { name: 'Volatility Analysis', status: 'completed', duration: '22s' },
      { name: 'Risk Model Agent', status: 'failed', duration: '23s' },
      { name: 'Alert Generation', status: 'pending', duration: '—' },
    ],
  },
]

const stepStatusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-success" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />
  if (status === 'running') return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  return <div className="h-4 w-4 rounded-full border-2 border-border" />
}

export default function WorkflowsPage() {
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
        className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader
          title="Workflows"
          description="Multi-step AI orchestration pipelines powered by Mastra with full OpenTelemetry tracing"
        />
        <EmptyState
          preset="agents"
          title="No Active Workflows"
          description="Please upload your bank statement or CSV files in the Documents page to trigger the Mastra agent execution workflows."
          action={{
            label: "Go to Documents",
            onClick: () => window.location.href = "/documents",
            variant: "gradient"
          }}
        />
      </motion.div>
    )
  }
  const total = workflows.length
  const completed = workflows.filter(w => w.status === 'completed').length
  const running = workflows.filter(w => w.status === 'running').length
  const failed = workflows.filter(w => w.status === 'failed').length

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Workflows"
        description="Multi-step AI orchestration pipelines powered by Mastra with full OpenTelemetry tracing"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
              Retry Failed
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} glow>
              New Workflow
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={containerVariants}>
        {[
          { label: 'Total Workflows', value: total, color: 'text-foreground' },
          { label: 'Completed', value: completed, color: 'text-success' },
          { label: 'Running', value: running, color: 'text-primary' },
          { label: 'Failed', value: failed, color: 'text-destructive' },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard padding="md" className="text-center">
              <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Workflow Cards */}
      <div className="space-y-5">
        {workflows.map(wf => (
          <motion.div key={wf.id} variants={itemVariants}>
            <GlassCard>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Workflow className="h-5 w-5 text-primary" strokeWidth={1.7} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{wf.name}</h3>
                      <StatusBadge status={wf.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {wf.duration}
                      </span>
                      <span className="text-xs text-tertiary">•</span>
                      <span className="text-xs text-muted-foreground">{wf.lastRun}</span>
                      <span className="text-xs text-tertiary">•</span>
                      <span className="text-xs font-mono text-muted-foreground">{wf.traceId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="xs">View Trace</Button>
                  {wf.status === 'failed' && (
                    <Button variant="outline" size="xs" leftIcon={<RotateCcw className="h-3 w-3" />}>
                      Retry
                    </Button>
                  )}
                  {wf.status !== 'running' && (
                    <Button variant="ghost" size="icon-sm">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2.5">
                {wf.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="shrink-0">{stepStatusIcon(step.status)}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <p className={cn(
                        'text-sm',
                        step.status === 'completed' ? 'text-foreground' :
                        step.status === 'running' ? 'text-primary font-medium' :
                        step.status === 'failed' ? 'text-destructive' :
                        'text-muted-foreground'
                      )}>{step.name}</p>
                      {step.status === 'running' && (
                        <Badge variant="primary" size="sm" dot pulse>Running</Badge>
                      )}
                    </div>
                    {step.duration !== '—' && (
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{step.duration}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {wf.status === 'running' && (
                <Progress
                  value={(wf.steps.filter(s => s.status === 'completed').length / wf.steps.length) * 100}
                  variant="gradient"
                  size="xs"
                  animated
                  className="mt-4"
                />
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

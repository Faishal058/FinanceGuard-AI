'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { Workflow, CheckCircle2, XCircle, Clock, RotateCcw, RefreshCw } from 'lucide-react'

const stepStatusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-success" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />
  if (status === 'running') return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  return <div className="h-4 w-4 rounded-full border-2 border-border" />
}

const statusColor = (status: string) => {
  if (status === 'completed') return 'text-success bg-success/10'
  if (status === 'failed') return 'text-destructive bg-destructive/10'
  if (status === 'running') return 'text-primary bg-primary/10'
  return 'text-muted-foreground bg-muted/10'
}

export default function WorkflowsPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0, running: 0, failed: 0 })

  async function loadData(isSilent = false) {
    try {
      if (!isSilent) setRefreshing(true)
      const [dashRes, wfRes] = await Promise.all([
        ApiClient.get('/api/v2/dashboard'),
        ApiClient.get('/api/v2/workflows').catch(() => null),
      ])
      if (dashRes?.metrics?.documentCount > 0) {
        setHasDocs(true)
      } else {
        setHasDocs(false)
      }
      if (wfRes?.workflows) {
        setWorkflows(wfRes.workflows)
        setStats(wfRes.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

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
        variants={pageVariants} initial="hidden" animate="visible"
      >
        <PageHeader
          title="Workflows"
          description="Multi-step AI orchestration pipelines powered by Mastra with full OpenTelemetry tracing"
        />
        <EmptyState
          preset="agents"
          title="No Active Workflows"
          description="Upload your bank statement or CSV files in the Documents page to trigger the Mastra agent execution workflows."
          action={{ label: 'Go to Documents', onClick: () => window.location.href = '/documents', variant: 'gradient' }}
        />
      </motion.div>
    )
  }

  if (hasDocs && workflows.length === 0) {
    return (
      <motion.div
        className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
        variants={pageVariants} initial="hidden" animate="visible"
      >
        <PageHeader
          title="Workflows"
          description="Multi-step AI orchestration pipelines powered by Mastra with full OpenTelemetry tracing"
          actions={
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
              onClick={() => loadData(false)}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          }
        />
        <EmptyState
          preset="agents"
          title="No Workflows Run Yet"
          description="Ask a question in the AI Workspace to trigger the financial advisory pipeline and see it logged here."
          action={{ label: 'Go to Workspace', onClick: () => window.location.href = '/workspace', variant: 'gradient' }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants} initial="hidden" animate="visible"
    >
      <PageHeader
        title="Workflows"
        description="Multi-step AI orchestration pipelines powered by Mastra with full OpenTelemetry tracing"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => loadData(false)}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {/* Stats */}
      <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-4" variants={containerVariants}>
        {[
          { label: 'Total Workflows', value: stats.total },
          { label: 'Completed', value: stats.completed },
          { label: 'Running', value: stats.running },
          { label: 'Failed', value: stats.failed },
        ].map(s => (
          <motion.div key={s.label} variants={itemVariants}>
            <GlassCard padding="md" className="text-center">
              <p className="text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Workflow List */}
      <motion.div className="space-y-4" variants={containerVariants}>
        {workflows.map(wf => (
          <motion.div key={wf.id} variants={itemVariants}>
            <GlassCard padding="md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <Workflow className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{wf.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(wf.status)}`}>
                        {wf.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {wf.duration} · {wf.lastRun}
                      {wf.traceId && <span className="ml-2 font-mono opacity-60">· {wf.traceId}</span>}
                    </p>
                    {wf.errorMessage && (
                      <p className="text-xs text-destructive mt-1 font-mono">Error: {wf.errorMessage}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-4 space-y-2">
                {wf.steps.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    {stepStatusIcon(step.status)}
                    <span className="flex-1 text-sm text-foreground">{step.name}</span>
                    {step.status !== 'pending' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {step.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar for running workflows */}
              {wf.status === 'running' && (
                <div className="mt-4 h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

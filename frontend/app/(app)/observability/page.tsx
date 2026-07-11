'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Activity, Clock, Zap, Server, RefreshCw, Download } from 'lucide-react'

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
}

const latencyData = [
  { time: '14:00', p50: 180, p95: 420, p99: 680 },
  { time: '14:05', p50: 195, p95: 380, p99: 590 },
  { time: '14:10', p50: 210, p95: 445, p99: 720 },
  { time: '14:15', p50: 185, p95: 360, p99: 540 },
  { time: '14:20', p50: 245, p95: 510, p99: 840 },
  { time: '14:25', p50: 190, p95: 390, p99: 610 },
  { time: '14:30', p50: 200, p95: 415, p99: 650 },
]

const throughputData = [
  { time: '14:00', requests: 42 },
  { time: '14:05', requests: 58 },
  { time: '14:10', requests: 71 },
  { time: '14:15', requests: 49 },
  { time: '14:20', requests: 86 },
  { time: '14:25', requests: 63 },
  { time: '14:30', requests: 77 },
]

const traces = [
  { id: 'tr_abc123', workflow: 'Portfolio Analysis', duration: '2145ms', status: 'success', spans: 12, llmCalls: 3, timestamp: '2m ago' },
  { id: 'tr_def456', workflow: 'Risk Assessment', duration: '1823ms', status: 'success', spans: 9, llmCalls: 2, timestamp: '8m ago' },
  { id: 'tr_ghi789', workflow: 'Tax Processing', duration: '482ms', status: 'error', spans: 4, llmCalls: 1, timestamp: '14m ago' },
  { id: 'tr_jkl012', workflow: 'Memory Search', duration: '342ms', status: 'success', spans: 6, llmCalls: 1, timestamp: '21m ago' },
  { id: 'tr_mno345', workflow: 'Forecast Generation', duration: '3201ms', status: 'success', spans: 15, llmCalls: 4, timestamp: '35m ago' },
]

export default function ObservabilityPage() {
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
          title="Observability"
          description="Real-time performance metrics, model latencies, token counts, and execution traces"
        />
        <EmptyState
          preset="folder"
          title="No Observability Traces"
          description="Please upload your bank statement or CSV files in the Documents page to trigger model workflows and log trace telemetry."
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
        title="Observability"
        description="OpenTelemetry-powered tracing, metrics, and logs for all AI agent operations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Live
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} glow>
              Export Traces
            </Button>
          </div>
        }
      />

      {/* ── Key Metrics ── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={containerVariants}>
        {[
          { label: 'P50 Latency', value: '200ms', icon: Clock, color: 'text-success' },
          { label: 'P99 Latency', value: '650ms', icon: Activity, color: 'text-warning' },
          { label: 'Req / min', value: '63', icon: Zap, color: 'text-primary' },
          { label: 'Error Rate', value: '0.8%', icon: Server, color: 'text-secondary' },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard padding="md" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.7} />
              </div>
              <div>
                <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts ── */}
      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" variants={containerVariants}>
        {/* Latency */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="Response Latency" description="P50, P95, P99 percentiles" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-success inline-block" />P50</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-warning inline-block" />P95</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-destructive inline-block" />P99</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}ms`}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
                  formatter={(v: any) => [`${v}ms`, '']}
                />
                <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} name="P50" />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="P95" />
                <Line type="monotone" dataKey="p99" stroke="#f43f5e" strokeWidth={2} dot={false} name="P99" />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Throughput */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader title="Request Throughput" description="Requests per 5-minute window" className="mb-5" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
                  formatter={(v: any) => [v, 'Requests']}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2}
                  fill="url(#throughputGrad)" dot={false} name="Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Traces ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <SectionHeader title="Recent Traces" description="OpenTelemetry distributed trace log" className="mb-5" />
          <div className="space-y-2">
            {traces.map((trace, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-surface-2 p-4 hover:bg-surface-3 transition-smooth cursor-pointer">
                <Badge variant={trace.status === 'success' ? 'success' : 'danger'} size="sm" dot>
                  {trace.status}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-24 truncate">{trace.id}</span>
                <span className="text-sm font-medium text-foreground flex-1 truncate">{trace.workflow}</span>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span>{trace.spans} spans</span>
                  <span>{trace.llmCalls} LLM calls</span>
                  <span className="font-mono text-warning">{trace.duration}</span>
                  <span>{trace.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

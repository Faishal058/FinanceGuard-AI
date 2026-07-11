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
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Activity, Clock, Zap, Server, RefreshCw, Download } from 'lucide-react'

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
}
const labelStyle = { color: '#f8fafc', fontWeight: 600, fontSize: 12 }
const itemStyle = { color: '#94a3b8', fontSize: 12 }

export default function ObservabilityPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasDocs, setHasDocs] = useState(false)
  const [obsData, setObsData] = useState<any>(null)

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true)
      const [dashRes, obsRes] = await Promise.all([
        ApiClient.get('/api/v2/dashboard'),
        ApiClient.get('/api/v2/observability').catch(() => null),
      ])

      if (dashRes?.metrics?.documentCount > 0) {
        setHasDocs(true)
      } else {
        setHasDocs(false)
      }

      if (obsRes?.hasData) {
        setObsData(obsRes)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    if (!obsData?.traces) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obsData.traces, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `financeguard_traces_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!hasDocs || !obsData) {
    return (
      <motion.div
        className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
        variants={pageVariants} initial="hidden" animate="visible"
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

  const { stats, traces, latencyHistory, throughputHistory } = obsData

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants} initial="hidden" animate="visible"
    >
      <PageHeader
        title="Observability"
        description="OpenTelemetry-powered tracing, metrics, and logs for all AI agent operations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(false)}
              disabled={refreshing}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Refreshing...' : 'Live'}
            </Button>
            <Button variant="gradient" size="sm" onClick={handleExport} leftIcon={<Download className="h-3.5 w-3.5" />} glow>
              Export Traces
            </Button>
          </div>
        }
      />

      {/* ── Key Metrics ── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={containerVariants}>
        {[
          { label: 'P50 Latency', value: stats.p50, icon: Clock, color: 'text-success' },
          { label: 'P99 Latency', value: stats.p99, icon: Activity, color: 'text-warning' },
          { label: 'Req / min', value: stats.reqPerMin.toString(), icon: Zap, color: 'text-primary' },
          { label: 'Error Rate', value: stats.errorRate, icon: Server, color: 'text-secondary' },
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyHistory} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" width={75} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                  <Area type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorP50)" name="P50 Latency" />
                  <Area type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="P95 Latency" />
                  <Area type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorP99)" name="P99 Latency" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Throughput */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader title="Throughput" description="Requests per minute" className="mb-5" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughputHistory} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                  <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Requests" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Active Traces ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <SectionHeader title="Active Traces" description="Live execution paths monitored by Enkrypt quality gates" className="mb-5" />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Trace ID</th>
                  <th className="py-3.5 px-4 font-semibold">Workflow Agent</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Spans</th>
                  <th className="py-3.5 px-4 font-semibold text-center">LLM Calls</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {traces.map((t: any) => (
                  <tr key={t.id} className="hover:bg-surface-2/30 transition-smooth">
                    <td className="py-3.5 px-4 font-mono text-xs text-tertiary">{t.id}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{t.workflow}</td>
                    <td className="py-3.5 px-4 text-center text-muted-foreground">{t.spans}</td>
                    <td className="py-3.5 px-4 text-center text-muted-foreground">{t.llmCalls}</td>
                    <td className="py-3.5 px-4 text-muted-foreground tabular-nums">{t.duration}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.status === 'success' ? 'success' : 'danger'} size="sm" dot>
                        {t.status === 'success' ? 'success' : 'failed'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-tertiary">{t.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

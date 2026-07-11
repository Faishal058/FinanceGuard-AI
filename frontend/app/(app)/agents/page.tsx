'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfidenceBar } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockAgents } from '@/lib/mock-data'
import { pageVariants, containerVariants, itemVariants, cardHoverProps } from '@/lib/animations'
import { formatRelativeTime } from '@/lib/utils'
import { Zap, Activity, Clock, CheckCircle, Play, RotateCcw, Settings } from 'lucide-react'

const agentIcons: Record<string, string> = {
  portfolio: '📈', risk: '⚡', forecast: '🔮',
  advisor: '💡', memory: '🧠', compliance: '🛡️',
}

const agentDescriptions: Record<string, { detail: string; tasks: string[] }> = {
  portfolio: { detail: 'Analyzes and optimizes investment portfolios using modern portfolio theory.', tasks: ['Portfolio rebalancing', 'Asset allocation', 'Performance tracking'] },
  risk: { detail: 'Identifies, quantifies and monitors financial risks across all asset classes.', tasks: ['VaR calculation', 'Stress testing', 'Risk scoring'] },
  forecast: { detail: 'Predicts future financial scenarios using historical data and ML models.', tasks: ['Net worth projection', 'Income forecasting', 'Goal modeling'] },
  advisor: { detail: 'Provides personalized financial recommendations based on your complete profile.', tasks: ['Recommendation generation', 'Goal planning', 'Tax optimization'] },
  memory: { detail: 'Retrieves and connects insights across all your financial documents and history.', tasks: ['Document indexing', 'Memory retrieval', 'Insight generation'] },
  compliance: { detail: 'Ensures regulatory compliance and monitors for potential risk events.', tasks: ['Regulation monitoring', 'Alert generation', 'Audit trails'] },
}

const performanceStats = [
  { label: 'Total Requests Today', value: '1,247', color: 'text-primary', icon: Activity },
  { label: 'Success Rate', value: '94.2%', color: 'text-success', icon: CheckCircle },
  { label: 'Avg Response Time', value: '245ms', color: 'text-warning', icon: Clock },
  { label: 'System Uptime', value: '99.95%', color: 'text-secondary', icon: Zap },
]

export default function AgentsPage() {
  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="AI Agents"
        description="Monitor and manage your autonomous financial AI agents powered by Mastra"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
              Restart All
            </Button>
            <Button variant="gradient" size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} glow>
              Deploy Agent
            </Button>
          </div>
        }
      />

      {/* ── Performance Overview ── */}
      <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-4" variants={containerVariants}>
        {performanceStats.map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard padding="md" className="text-center">
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} strokeWidth={1.7} />
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Agents Grid ── */}
      <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
        {mockAgents.map(agent => {
          const info = agentDescriptions[agent.type]

          return (
            <motion.div
              key={agent.id}
              variants={itemVariants}
              {...cardHoverProps}
            >
              <GlassCard hover className="h-full flex flex-col">
                {/* Agent header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                      {agentIcons[agent.type]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{agent.type} agent</p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} size="sm" />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {info?.detail}
                </p>

                {/* Tasks */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {info?.tasks.map(task => (
                    <Badge key={task} variant="outline" size="sm">{task}</Badge>
                  ))}
                </div>

                {/* Confidence */}
                <ConfidenceBar value={agent.confidenceScore} label="Confidence" size="sm" className="mb-3" />

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(agent.lastActivity)}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" title="Settings">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="xs">
                      View Logs
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ApiClient } from '@/lib/api-client'
import { EmptyState } from '@/components/common/empty-state'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, ConfidenceBar } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { Brain, Search, Lightbulb, TrendingUp, Hash, Calendar, RefreshCw } from 'lucide-react'

const typeConfig = {
  fact: { icon: Hash, badge: 'primary' as const, label: 'Fact' },
  insight: { icon: Lightbulb, badge: 'warning' as const, label: 'Insight' },
  pattern: { icon: TrendingUp, badge: 'secondary' as const, label: 'Pattern' },
  recommendation: { icon: Brain, badge: 'success' as const, label: 'Recommendation' },
}

export default function MemoryPage() {
  const [loading, setLoading] = useState(true)
  const [hasDocs, setHasDocs] = useState(false)
  const [memories, setMemories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  async function loadData() {
    try {
      const [dashRes, memRes] = await Promise.all([
        ApiClient.get('/api/v2/dashboard'),
        ApiClient.get('/api/v2/memory').catch(() => null),
      ])
      if (dashRes?.metrics?.documentCount > 0) setHasDocs(true)
      if (memRes?.memories) {
        setMemories(memRes.memories)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
          title="Memory Explorer"
          description="Browse AI-extracted insights and facts retrieved from your financial documents via Qdrant RAG"
        />
        <EmptyState
          preset="search"
          title="No RAG Memories Stored"
          description="Upload a bank statement in the Documents page or chat with the AI Agent in the Workspace to record long-term memories."
          action={{ label: "Go to Workspace", onClick: () => window.location.href = "/workspace", variant: "gradient" }}
        />
      </motion.div>
    )
  }

  const filteredMemories = memories.filter(mem =>
    mem.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants} initial="hidden" animate="visible"
    >
      <PageHeader
        title="Memory Explorer"
        description="Browse AI-extracted insights and facts retrieved from your financial documents via Qdrant RAG"
        actions={
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Sync Memory
          </Button>
        }
      />

      {/* Stats */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={containerVariants}>
        {[
          { label: 'Total Memories', value: memories.length, icon: Brain },
          { label: 'Facts', value: memories.filter(m => m.type === 'fact').length, icon: Hash },
          { label: 'Insights', value: memories.filter(m => m.type === 'insight').length, icon: Lightbulb },
          { label: 'Patterns', value: memories.filter(m => m.type === 'pattern').length, icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard padding="md" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search memories by content or keyword..."
          variant="glass"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Memory Cards */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No matching memories found.
        </div>
      ) : (
        <motion.div className="space-y-4" variants={containerVariants}>
          {filteredMemories.map(mem => {
            const cfg = typeConfig[mem.type as keyof typeof typeConfig] || typeConfig.fact
            const Icon = cfg.icon

            return (
              <motion.div key={mem.id} variants={itemVariants}>
                <GlassCard hover>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={cfg.badge} size="sm" dot>{cfg.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {mem.createdAt}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed mb-3">{mem.content}</p>
                      <ConfidenceBar value={mem.confidence} size="sm" label="Confidence" />
                      {mem.related && mem.related.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="text-xs text-muted-foreground">Sources:</span>
                          {mem.related.map((src: string) => (
                            <Badge key={src} variant="outline" size="sm">{src}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

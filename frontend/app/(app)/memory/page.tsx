'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader, ConfidenceBar } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { Brain, Search, Lightbulb, TrendingUp, Hash, Calendar, RefreshCw } from 'lucide-react'

const memories = [
  { id: 1, type: 'fact', content: 'Monthly income consistently averages $8,500 over the past 6 months', confidence: 0.96, createdAt: '2024-12-20', related: ['Bank_Statements_Q4.pdf'] },
  { id: 2, type: 'insight', content: 'Portfolio shows high concentration in technology sector (38%), exceeding target by 8%', confidence: 0.91, createdAt: '2024-12-18', related: ['Investment_Portfolio.xlsx'] },
  { id: 3, type: 'pattern', content: 'Spending peaks in Q4, averaging 22% higher than Q1-Q3 months', confidence: 0.87, createdAt: '2024-12-15', related: ['Bank_Statements_Q4.pdf', '2024_Tax_Return.pdf'] },
  { id: 4, type: 'recommendation', content: 'Based on debt-to-income ratio of 20.8%, borrower qualifies for favorable mortgage refinancing rates', confidence: 0.83, createdAt: '2024-12-10', related: ['Mortgage_Agreement.pdf'] },
  { id: 5, type: 'fact', content: 'Net worth grew 7.8% over the past 6 months, from $450K to $485K', confidence: 0.99, createdAt: '2024-12-01', related: ['2024_Tax_Return.pdf'] },
  { id: 6, type: 'pattern', content: 'Investment returns show a seasonal pattern with stronger performance in Q2', confidence: 0.79, createdAt: '2024-11-28', related: ['Investment_Portfolio.xlsx'] },
]

const typeConfig = {
  fact: { icon: Hash, badge: 'primary' as const, label: 'Fact' },
  insight: { icon: Lightbulb, badge: 'warning' as const, label: 'Insight' },
  pattern: { icon: TrendingUp, badge: 'secondary' as const, label: 'Pattern' },
  recommendation: { icon: Brain, badge: 'success' as const, label: 'Recommendation' },
}

export default function MemoryPage() {
  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Memory Explorer"
        description="Browse AI-extracted insights and facts retrieved from your financial documents via Qdrant RAG"
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
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
        />
      </motion.div>

      {/* Memory Cards */}
      <motion.div className="space-y-4" variants={containerVariants}>
        {memories.map(mem => {
          const cfg = typeConfig[mem.type as keyof typeof typeConfig]
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
                    {mem.related.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="text-xs text-muted-foreground">Sources:</span>
                        {mem.related.map(src => (
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
    </motion.div>
  )
}

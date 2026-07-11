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
import { pageVariants, containerVariants, itemVariants, cardHoverProps } from '@/lib/animations'
import { Lightbulb, TrendingUp, CheckCircle, Clock, ArrowRight, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

const recommendations = [
  {
    id: 1,
    title: 'Rebalance Portfolio',
    description: 'Your asset allocation has drifted 5% from your target. Stocks are overweight at 43% vs target 38%. Consider selling $15,000 in equities and buying bonds.',
    priority: 'high',
    category: 'Portfolio',
    confidence: 0.92,
    impact: 'High',
    effort: 'Low',
    timeframe: '1-2 weeks',
    savings: '+$2,400/yr',
  },
  {
    id: 2,
    title: 'Increase Emergency Fund',
    description: 'Current savings cover only 4 months of expenses. Financial best practice recommends 6 months. Transfer $10,200 to your high-yield savings account.',
    priority: 'high',
    category: 'Savings',
    confidence: 0.88,
    impact: 'High',
    effort: 'Medium',
    timeframe: '3-6 months',
    savings: 'Risk reduction',
  },
  {
    id: 3,
    title: 'Tax Loss Harvesting',
    description: 'Several positions showing losses can be used for tax-loss harvesting. Estimated tax savings of $3,200 by year-end.',
    priority: 'medium',
    category: 'Tax',
    confidence: 0.85,
    impact: 'Medium',
    effort: 'Low',
    timeframe: 'Before Dec 31',
    savings: '$3,200 tax saving',
  },
  {
    id: 4,
    title: 'Diversify Bond Holdings',
    description: 'Consider adding international bonds to reduce concentration risk. Treasury I-Bonds are currently offering 4.3% yield.',
    priority: 'medium',
    category: 'Bonds',
    confidence: 0.78,
    impact: 'Medium',
    effort: 'Medium',
    timeframe: 'Q1 2025',
    savings: '+1.2% yield',
  },
  {
    id: 5,
    title: 'Review Insurance Coverage',
    description: 'Your term life insurance may be under-insured given your current net worth and dependents. Consider increasing coverage.',
    priority: 'low',
    category: 'Insurance',
    confidence: 0.71,
    impact: 'Low',
    effort: 'Low',
    timeframe: 'Next renewal',
    savings: 'Risk protection',
  },
]

const priorityConfig = {
  high: { badge: 'danger' as const, label: 'HIGH' },
  medium: { badge: 'warning' as const, label: 'MED' },
  low: { badge: 'secondary' as const, label: 'LOW' },
}

export default function AdvisorPage() {
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
          title="Financial Advisor"
          description="Personalized AI recommendations to optimize your financial health"
        />
        <EmptyState
          preset="folder"
          title="No Advisory Recommendations"
          description="Please upload your bank statement or CSV files in the Documents page to trigger the AI Advisor Agent."
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
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Financial Advisor"
        description="Personalized AI recommendations to optimize your financial health"
        actions={
          <Link href={ROUTES.WORKSPACE}>
            <Button variant="gradient" size="sm" leftIcon={<MessageSquare className="h-3.5 w-3.5" />} glow>
              Chat with AI
            </Button>
          </Link>
        }
      />

      {/* ── Performance Summary ── */}
      <motion.div className="grid grid-cols-1 gap-5 sm:grid-cols-3" variants={containerVariants}>
        {[
          {
            icon: TrendingUp,
            label: 'Performance vs Benchmark',
            value: '+2.3%',
            desc: 'Your portfolio outperformed S&P 500 this year',
            color: 'text-success',
            bg: 'bg-success/8 border-success/20',
          },
          {
            icon: CheckCircle,
            label: 'Goal Progress',
            value: '67%',
            desc: 'On track to reach retirement goal by 2034',
            color: 'text-primary',
            bg: 'bg-primary/8 border-primary/20',
          },
          {
            icon: Sparkles,
            label: 'AI Score',
            value: '8.4/10',
            desc: 'Financial health score based on 12 factors',
            color: 'text-secondary',
            bg: 'bg-secondary/8 border-secondary/20',
          },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard className={`border ${s.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-background/30 flex items-center justify-center">
                  <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.7} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
              <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Recommendations ── */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <SectionHeader
              title="AI Recommendations"
              description={`${recommendations.length} personalized insights`}
            />
            <Badge variant="primary" size="md" dot pulse>
              Updated just now
            </Badge>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.id}
                variants={itemVariants}
                {...cardHoverProps}
                className="rounded-xl bg-surface-2 p-5 cursor-pointer border border-transparent hover:border-primary/20 transition-smooth"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-4 w-4 text-primary" strokeWidth={1.7} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                      <Badge variant={priorityConfig[rec.priority as keyof typeof priorityConfig].badge} size="sm">
                        {priorityConfig[rec.priority as keyof typeof priorityConfig].label}
                      </Badge>
                      <Badge variant="outline" size="sm">{rec.category}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rec.description}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {rec.timeframe}
                      </span>
                      <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-lg">
                        {rec.savings}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Impact: <span className="text-foreground font-medium">{rec.impact}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Effort: <span className="text-foreground font-medium">{rec.effort}</span>
                      </span>
                    </div>

                    <ConfidenceBar value={rec.confidence} size="sm" />
                  </div>

                  <Button variant="ghost" size="icon-sm" className="shrink-0 mt-1">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

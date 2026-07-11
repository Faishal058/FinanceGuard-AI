'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ConfidenceBar } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { pageVariants, itemVariants, containerVariants, thinkingDotVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { ApiClient } from '@/lib/api-client'
import {
  Send, Paperclip, Settings, Sparkles, Brain, FileText,
  Maximize2, Minimize2, RefreshCw, Copy, ThumbsUp, ThumbsDown, ChevronDown,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  sources?: string[]
  agentUsed?: string
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: `Hello! I'm your **AI Financial Advisor** powered by Mastra and Qdrant RAG. I can:\n\n• Analyze your financial documents and portfolio\n• Provide risk assessments and forecasts\n• Answer questions about your investments\n• Retrieve insights from your uploaded documents\n\nHow can I assist you today?`,
  timestamp: new Date(Date.now() - 300000),
  confidence: 0.97,
  agentUsed: 'Financial Advisor',
}

const WORKFLOW_STEPS = [
  'Checking privacy consent...',
  'Enkrypt AI Input scan...',
  'Extracting relational files...',
  'Running Monte Carlo forecast...',
  'Auditing risk benchmarks...',
  'Enkrypt AI Output check...',
]

/* ─────────────────────────────────────────────────────────
   THINKING ANIMATION
───────────────────────────────────────────────────────── */
function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          {...thinkingDotVariants(i * 0.15)}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[75%] space-y-2', isUser && 'items-end flex flex-col')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'glass border border-border text-foreground rounded-tl-sm'
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-tertiary">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.agentUsed && (
            <Badge variant="primary" size="sm">{message.agentUsed}</Badge>
          )}
          {message.confidence !== undefined && !isUser && (
            <span className="text-xs text-muted-foreground">
              {(message.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
          {!isUser && (
            <div className="flex items-center gap-1 ml-auto">
              <button className="text-muted-foreground hover:text-foreground transition-fast p-0.5 rounded">
                <Copy className="h-3 w-3" />
              </button>
              <button className="text-muted-foreground hover:text-success transition-fast p-0.5 rounded">
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button className="text-muted-foreground hover:text-destructive transition-fast p-0.5 rounded">
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.sources.map(src => (
              <span key={src} className="text-xs bg-surface-2 border border-border px-2 py-0.5 rounded-lg text-muted-foreground flex items-center gap-1">
                <FileText className="h-2.5 w-2.5" /> {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-foreground">A</span>
        </div>
      )}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   WORKSPACE PAGE
───────────────────────────────────────────────────────── */
export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>('')

  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    sessionIdRef.current = 'sess_' + Math.random().toString(36).substr(2, 9)
    async function loadDocs() {
      try {
        const token = localStorage.getItem('fg_token')
        if (!token) return
        const response = await fetch('/api/v2/documents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setDocuments(data.documents || [])
        }
      } catch (e) {
        console.error('Failed to load documents in workspace', e)
      }
    }
    loadDocs()
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages(p => [...p, userMsg])
    const promptText = input.trim()
    setInput('')
    setIsLoading(true)
    setActiveStep(0)

    // Parallel visual animation cycling through agent steps during server roundtrip
    const cycleInterval = setInterval(() => {
      setActiveStep(s => {
        if (s < WORKFLOW_STEPS.length - 1) return s + 1
        return s
      })
    }, 450)

    try {
      // Add a 30-second timeout to prevent indefinite spinner
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      let res: any
      try {
        res = await ApiClient.post('/api/v2/query', {
          query: promptText,
          session_id: sessionIdRef.current,
        })
      } finally {
        clearTimeout(timeoutId)
      }

      clearInterval(cycleInterval)
      setActiveStep(-1)

      const advisor = res?.data?.advisory || res?.advisory
      if (!advisor) {
        throw new Error(res?.error || 'The advisor returned an empty response. Please try again.')
      }
      
      // Structure advisor synthesis response beautifully for display
      let formattedContent = `${advisor.executive_summary}\n\n`
      
      if (advisor.key_findings && advisor.key_findings.length > 0) {
        formattedContent += `### Key Findings:\n`
        advisor.key_findings.forEach((kf: any) => {
          const emoji = kf.severity === 'CRITICAL' ? '🚨' : kf.severity === 'WARNING' ? '⚠️' : 'ℹ️'
          formattedContent += `${emoji} **${kf.finding}** _(${kf.source_agent})_\n`
        })
        formattedContent += `\n`
      }

      if (advisor.action_items && advisor.action_items.length > 0) {
        formattedContent += `### Recommended Action Plan:\n`
        advisor.action_items.sort((a: any, b: any) => a.priority - b.priority).forEach((item: any) => {
          formattedContent += `${item.priority}. **${item.action}**\n   *Rationale:* ${item.rationale}\n   *Timeline:* ${item.timeline} | *Citation:* ${item.source_citation}\n`
        })
        formattedContent += `\n`
      }

      if (advisor.risk_acknowledgments && advisor.risk_acknowledgments.length > 0) {
        formattedContent += `### Projections Risk Disclaimers:\n`
        advisor.risk_acknowledgments.forEach((ack: string) => {
          formattedContent += `- ${ack}\n`
        })
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date(),
        confidence: res.data.confidence_score,
        sources: ['Local RAG Database', 'Uploaded Statements'],
        agentUsed: 'Financial Advisor Agent',
      }

      setMessages(p => [...p, assistantMsg])
    } catch (err: any) {
      clearInterval(cycleInterval)
      setActiveStep(-1)

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.message || 'The agent workflow engine encountered a failure processing this query.'}`,
        timestamp: new Date(),
        agentUsed: 'Compliance Monitor',
      }
      setMessages(p => [...p, assistantMsg])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  return (
    <motion.div

      className="flex h-[calc(100vh-56px)] flex-col gap-0 p-6 md:p-8 max-w-[1600px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="AI Workspace"
        description="Chat with your financial AI assistant powered by Mastra"
        className="mb-5 shrink-0"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([INITIAL_MESSAGE])
                sessionIdRef.current = 'sess_' + Math.random().toString(36).substr(2, 9)
              }}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(p => !p)}
              leftIcon={isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 gap-5 min-h-0">
        {/* ── Chat Area ── */}
        <div className="flex flex-1 flex-col min-w-0">
          <GlassCard className="flex flex-1 flex-col min-h-0" padding="none">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Financial Advisor</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Online — Mastra + Qdrant</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollable px-5 py-5 space-y-5">
              <AnimatePresence>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3"
                  >
                    <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="glass border border-border rounded-2xl rounded-tl-sm">
                      <ThinkingAnimation />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-4 border-t border-border shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e as any)
                      }
                    }}
                    placeholder="Ask me about your finances... (Enter to send, Shift+Enter for new line)"
                    disabled={isLoading}
                    rows={1}
                    className={cn(
                      'w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm',
                      'text-foreground placeholder:text-muted-foreground outline-none resize-none',
                      'focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-smooth',
                      'disabled:opacity-50 max-h-40 min-h-[44px]'
                    )}
                  />
                </div>
                <Button variant="ghost" size="icon" type="button" disabled={isLoading}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="gradient"
                  size="icon"
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  glow
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-tertiary mt-2">
                AI responses are for informational purposes only. Not financial advice.
              </p>
            </form>
          </GlassCard>
        </div>

        {/* ── Right Panel ── */}
        <div className={cn(
          "hidden xl:flex flex-col gap-4 w-72 shrink-0 transition-all duration-300",
          isExpanded && "xl:hidden"
        )}>
          {/* Workflow Status */}
          <GlassCard padding="md">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Workflow Pipeline
            </p>
            <div className="space-y-2.5">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-smooth',
                    activeStep > i ? 'bg-success/20 text-success' :
                    activeStep === i ? 'bg-primary/20 text-primary animate-pulse' :
                    'bg-surface-3 text-muted-foreground'
                  )}>
                    {activeStep > i ? '✓' : i + 1}
                  </div>
                  <p className={cn(
                    'text-xs transition-smooth',
                    activeStep === i ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Document Context */}
          <GlassCard padding="md">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Document Context
            </p>
            <div className="space-y-2">
              {documents.filter(d => d.status === 'completed').slice(0, 4).map(doc => (
                <button
                  key={doc.id}
                  className="w-full flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-surface-2 transition-smooth text-left"
                >
                  <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.7} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.chunks} chunks</p>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Active Agent */}
          <GlassCard padding="md" variant="gradient">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Active Agent
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-lg">
                💡
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Financial Advisor</p>
                <StatusBadge status="active" size="xs" />
              </div>
            </div>
            <ConfidenceBar value={0.91} label="Confidence" size="sm" className="mt-3" />
          </GlassCard>
        </div>
      </div>
    </motion.div>
  )
}

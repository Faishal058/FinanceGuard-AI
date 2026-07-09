'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAVIGATION_ITEMS, ROUTES } from '@/lib/constants'
import { overlayVariants, scaleInCenter } from '@/lib/animations'
import {
  Search, LayoutDashboard, MessageSquare, FileText, AlertTriangle,
  TrendingUp, Lightbulb, Brain, Zap, Workflow, Shield, Eye, Settings,
  ArrowRight, Hash, Command,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, MessageSquare, FileText, AlertTriangle,
  TrendingUp, Lightbulb, Brain, Zap, Workflow, Shield, Eye, Settings,
}

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: string
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Build command list */
  const allCommands: CommandItem[] = [
    ...NAVIGATION_ITEMS.map(item => ({
      id: item.href,
      label: item.label,
      description: `Navigate to ${item.label}`,
      icon: iconMap[item.icon] ?? Hash,
      action: () => { router.push(item.href); onClose() },
      category: 'Navigation',
      keywords: [item.label.toLowerCase()],
    })),
    {
      id: 'run-analysis',
      label: 'Run Risk Analysis',
      description: 'Start a new AI risk analysis',
      icon: Zap,
      action: () => { router.push(ROUTES.RISK_ANALYSIS); onClose() },
      category: 'Actions',
      keywords: ['analysis', 'risk', 'run'],
    },
    {
      id: 'upload-doc',
      label: 'Upload Document',
      description: 'Add a new financial document',
      icon: FileText,
      action: () => { router.push(ROUTES.DOCUMENTS); onClose() },
      category: 'Actions',
      keywords: ['upload', 'document', 'file'],
    },
    {
      id: 'ask-advisor',
      label: 'Ask Financial Advisor',
      description: 'Chat with your AI advisor',
      icon: MessageSquare,
      action: () => { router.push(ROUTES.WORKSPACE); onClose() },
      category: 'Actions',
      keywords: ['ask', 'chat', 'advisor', 'ai'],
    },
  ]

  const filtered = query.trim()
    ? allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.some(k => k.includes(query.toLowerCase()))
      )
    : allCommands

  /* Group by category */
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  /* Keyboard navigation */
  useEffect(() => {
    if (!open) { setQuery(''); setSelectedIndex(0); return }
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, selectedIndex, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  /* Global ⌘K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  let flatIndex = 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              variants={scaleInCenter}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg pointer-events-auto"
              onKeyDown={handleKeyDown}
            >
              <div className="glass-strong rounded-2xl border border-border-strong shadow-2xl overflow-hidden">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search commands, pages, actions..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <kbd className="text-[10px] font-mono text-muted-foreground bg-surface-3 px-1.5 py-0.5 rounded border border-border">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[360px] overflow-y-auto scrollable p-2">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Command className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                    </div>
                  ) : (
                    Object.entries(grouped).map(([category, items]) => (
                      <div key={category} className="mb-2">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-tertiary">
                          {category}
                        </p>
                        {items.map(cmd => {
                          const isSelected = flatIndex === selectedIndex
                          const currentIndex = flatIndex++
                          const Icon = cmd.icon

                          return (
                            <button
                              key={cmd.id}
                              onClick={cmd.action}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                                'transition-fast group',
                                isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-2'
                              )}
                            >
                              <div className={cn(
                                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                                isSelected ? 'bg-primary/15' : 'bg-surface-3 group-hover:bg-surface-2'
                              )}>
                                <Icon className="h-4 w-4" strokeWidth={1.7} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{cmd.label}</p>
                                {cmd.description && (
                                  <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                                )}
                              </div>
                              <ArrowRight className={cn(
                                'h-4 w-4 shrink-0 transition-fast',
                                isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                              )} />
                            </button>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-tertiary">
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-surface-3 px-1 rounded border border-border">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-surface-3 px-1 rounded border border-border">↵</kbd> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-surface-3 px-1 rounded border border-border">ESC</kbd> Close
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

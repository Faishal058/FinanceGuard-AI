'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'
import type { LucideIcon } from 'lucide-react'
import { FileText, Search, Zap, AlertTriangle, Inbox, FolderOpen } from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────── */
type EmptyStatePreset =
  | 'documents'
  | 'search'
  | 'agents'
  | 'alerts'
  | 'inbox'
  | 'folder'
  | 'custom'

interface EmptyStateProps {
  preset?: EmptyStatePreset
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'gradient'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const presets: Record<
  Exclude<EmptyStatePreset, 'custom'>,
  { icon: LucideIcon; title: string; description: string }
> = {
  documents: {
    icon: FileText,
    title: 'No documents yet',
    description: 'Upload your financial documents to get started. PDF, CSV, Excel, and Word files supported.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you\'re looking for.',
  },
  agents: {
    icon: Zap,
    title: 'No agents running',
    description: 'Start a workflow to activate your AI financial agents.',
  },
  alerts: {
    icon: AlertTriangle,
    title: 'No alerts',
    description: 'Your portfolio is running smoothly. Alerts will appear here when action is needed.',
  },
  inbox: {
    icon: Inbox,
    title: 'All caught up',
    description: 'You have no new notifications. Check back later.',
  },
  folder: {
    icon: FolderOpen,
    title: 'Nothing here yet',
    description: 'This section is empty. Add content to get started.',
  },
}

const sizes = {
  sm: { icon: 'h-10 w-10', container: 'py-10', title: 'text-base', desc: 'text-sm' },
  md: { icon: 'h-14 w-14', container: 'py-16', title: 'text-lg', desc: 'text-sm' },
  lg: { icon: 'h-20 w-20', container: 'py-24', title: 'text-xl', desc: 'text-base' },
}

export function EmptyState({
  preset = 'custom',
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const presetData = preset !== 'custom' ? presets[preset] : null
  const Icon = icon ?? presetData?.icon
  const resolvedTitle = title ?? presetData?.title ?? 'Nothing here'
  const resolvedDesc = description ?? presetData?.description ?? ''
  const sz = sizes[size]

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sz.container,
        className
      )}
    >
      {/* Icon Container */}
      {Icon && (
        <div className="relative mb-6">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-xl scale-150 opacity-60" />
          <div className="relative flex items-center justify-center rounded-3xl bg-surface-2 border border-border p-5">
            <Icon className={cn(sz.icon, 'text-muted-foreground')} strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Text */}
      <h3 className={cn('font-semibold text-foreground mb-2', sz.title)}>
        {resolvedTitle}
      </h3>
      {resolvedDesc && (
        <p className={cn('text-muted-foreground max-w-xs mb-6', sz.desc)}>
          {resolvedDesc}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant={action.variant ?? 'default'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { itemVariants } from '@/lib/animations'
import type { ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────────── */
interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
  className?: string
  animate?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
  animate = true,
}: PageHeaderProps) {
  const Wrapper = animate ? motion.div : 'div'
  const wrapperProps = animate ? { variants: itemVariants } : {}

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </Wrapper>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION HEADER (for within-page sections)
───────────────────────────────────────────────────────── */
interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   CONFIDENCE BAR
───────────────────────────────────────────────────────── */
interface ConfidenceBarProps {
  value: number   // 0-1
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getConfidenceColor(value: number): string {
  if (value >= 0.85) return 'from-success to-emerald-400'
  if (value >= 0.65) return 'from-warning to-amber-400'
  return 'from-destructive to-rose-400'
}

function getConfidenceLabel(value: number): string {
  if (value >= 0.85) return 'High'
  if (value >= 0.65) return 'Medium'
  return 'Low'
}

export function ConfidenceBar({
  value,
  label,
  showValue = true,
  size = 'md',
  className,
}: ConfidenceBarProps) {
  const pct = Math.round(value * 100)
  const color = getConfidenceColor(value)
  const confidenceLabel = getConfidenceLabel(value)

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        {showValue && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {pct}%
            </span>
            <span className={cn(
              'text-xs font-medium',
              value >= 0.85 ? 'text-success' : value >= 0.65 ? 'text-warning' : 'text-destructive'
            )}>
              {confidenceLabel}
            </span>
          </div>
        )}
      </div>
      <div className={cn('w-full rounded-full bg-surface-3 overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        />
      </div>
    </div>
  )
}

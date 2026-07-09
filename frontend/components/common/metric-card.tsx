'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { itemVariants } from '@/lib/animations'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────────────────── */
interface MetricCardProps {
  label: string
  value: string | number
  subvalue?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  trendPositiveIsUp?: boolean   // for things like debt ratio, lower is better
  variant?: 'glass' | 'surface' | 'gradient' | 'bordered'
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string          // override glow color
  className?: string
  onClick?: () => void
}

const trendConfig = {
  up: {
    Icon: TrendingUp,
    goodClass: 'text-success bg-success/10 border-success/20',
    badClass: 'text-destructive bg-destructive/10 border-destructive/20',
  },
  down: {
    Icon: TrendingDown,
    goodClass: 'text-destructive bg-destructive/10 border-destructive/20',
    badClass: 'text-success bg-success/10 border-success/20',
  },
  stable: {
    Icon: Minus,
    goodClass: 'text-muted-foreground bg-muted/50 border-border',
    badClass: 'text-muted-foreground bg-muted/50 border-border',
  },
}

const variantStyles = {
  glass: 'glass',
  surface: 'bg-surface-1 border border-border',
  gradient: 'gradient-card border border-primary/15',
  bordered: 'bg-surface-1 border-2 border-primary/20',
}

const sizeStyles = {
  sm: { card: 'p-4', value: 'text-2xl', label: 'text-xs', icon: 'h-8 w-8 p-1.5' },
  md: { card: 'p-5', value: 'text-3xl', label: 'text-sm', icon: 'h-10 w-10 p-2' },
  lg: { card: 'p-6', value: 'text-4xl', label: 'text-sm', icon: 'h-12 w-12 p-2.5' },
}

export function MetricCard({
  label,
  value,
  subvalue,
  icon: Icon,
  trend,
  trendValue,
  trendPositiveIsUp = true,
  variant = 'glass',
  size = 'md',
  className,
  onClick,
}: MetricCardProps) {
  const sz = sizeStyles[size]
  const trendInfo = trend ? trendConfig[trend] : null
  const TrendIcon = trendInfo?.Icon

  // Determine if the trend is "good" or "bad"
  const isGoodTrend =
    trend === 'stable' ||
    (trend === 'up' && trendPositiveIsUp) ||
    (trend === 'down' && !trendPositiveIsUp)

  const trendClass = trendInfo
    ? isGoodTrend
      ? trendInfo.goodClass
      : trendInfo.badClass
    : ''

  return (
    <motion.div
      variants={itemVariants}
      whileHover={onClick ? { y: -3, transition: { type: 'spring', stiffness: 500, damping: 35 } } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl relative overflow-hidden transition-all duration-250',
        variantStyles[variant],
        sz.card,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Subtle glow blob */}
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className={cn('font-medium text-muted-foreground truncate', sz.label)}>
            {label}
          </p>

          {/* Value */}
          <div className="mt-2 flex items-baseline gap-2">
            <p className={cn('font-bold text-foreground tabular-nums', sz.value)}>
              {value}
            </p>
            {subvalue && (
              <p className="text-sm text-muted-foreground">{subvalue}</p>
            )}
          </div>

          {/* Trend Badge */}
          {trendInfo && trendValue && (
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1',
                trendClass
              )}
            >
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span className="text-xs font-semibold">{trendValue}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center',
              sz.icon
            )}
          >
            <Icon className="h-full w-full" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

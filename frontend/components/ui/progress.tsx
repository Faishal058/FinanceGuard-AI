import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────────────────── */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number          // 0-100
  max?: number
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  rounded?: boolean
  label?: string
}

const progressVariants = {
  default: 'bg-primary',
  gradient: 'bg-gradient-to-r from-primary via-violet-500 to-secondary',
  success: 'bg-gradient-to-r from-success to-emerald-400',
  warning: 'bg-gradient-to-r from-warning to-amber-400',
  danger: 'bg-gradient-to-r from-destructive to-rose-400',
}

const progressSizes = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animated = true,
  rounded = true,
  label,
  className,
  ...props
}: ProgressProps) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
  const safeMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : 100
  const percentage = Math.min(100, Math.max(0, (safeValue / safeMax) * 100))

  return (
    <div className={cn('w-full', className)} {...props}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-foreground tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden bg-surface-3',
          progressSizes[size],
          rounded ? 'rounded-full' : 'rounded-none'
        )}
      >
        <div
          className={cn(
            progressVariants[variant],
            'h-full',
            rounded ? 'rounded-full' : 'rounded-none',
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   CIRCULAR PROGRESS (Ring)
───────────────────────────────────────────────────────── */
interface CircularProgressProps extends React.SVGAttributes<SVGElement> {
  value: number         // 0-100
  size?: number         // px
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
}

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = '#6366f1',
  trackColor = 'rgba(255,255,255,0.06)',
  children,
  className,
  ...props
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const safeValue = typeof value === 'number' && !isNaN(value) ? Math.min(100, Math.max(0, value)) : 0
  const strokeDashoffset = circumference - (safeValue / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={cn('-rotate-90', className)}
        {...props}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SEPARATOR
───────────────────────────────────────────────────────── */
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

function Separator({
  orientation = 'horizontal',
  label,
  className,
  ...props
}: SeparatorProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        'bg-border shrink-0',
        className
      )}
      {...props}
    />
  )
}

export { Progress, CircularProgress, Separator }
export type { ProgressProps, CircularProgressProps, SeparatorProps }

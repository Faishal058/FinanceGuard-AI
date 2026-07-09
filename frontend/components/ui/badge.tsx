import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   BADGE
───────────────────────────────────────────────────────── */
type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline'
  | 'glass'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-3 text-foreground border border-border',
  primary: 'bg-primary/15 text-primary border border-primary/25',
  secondary: 'bg-secondary/15 text-secondary border border-secondary/25',
  success: 'bg-success/15 text-success border border-success/25',
  warning: 'bg-warning/15 text-warning border border-warning/25',
  danger: 'bg-destructive/15 text-destructive border border-destructive/25',
  outline: 'bg-transparent text-foreground border border-border-strong',
  glass: 'glass text-foreground',
}

const badgeSizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-md gap-1.5',
  md: 'px-2.5 py-1 text-xs rounded-lg gap-2',
  lg: 'px-3 py-1.5 text-sm rounded-lg gap-2',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  outline: 'bg-foreground',
  glass: 'bg-foreground',
}

function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }

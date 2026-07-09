import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/types'

type Status = Agent['status'] | 'completed' | 'pending' | 'failed' | 'running' | 'online' | 'offline' | string

interface StatusBadgeProps {
  status: Status
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig: Record<string, {
  label: string
  dot: string
  text: string
  bg: string
  border: string
  pulse: boolean
}> = {
  active: {
    label: 'Active',
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    pulse: false,
  },
  online: {
    label: 'Online',
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    pulse: false,
  },
  idle: {
    label: 'Idle',
    dot: 'bg-slate-400',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/25',
    pulse: false,
  },
  processing: {
    label: 'Processing',
    dot: 'bg-primary',
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    pulse: true,
  },
  running: {
    label: 'Running',
    dot: 'bg-primary',
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    pulse: true,
  },
  pending: {
    label: 'Pending',
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    pulse: false,
  },
  completed: {
    label: 'Completed',
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    pulse: false,
  },
  error: {
    label: 'Error',
    dot: 'bg-destructive',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/25',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    dot: 'bg-destructive',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/25',
    pulse: false,
  },
  offline: {
    label: 'Offline',
    dot: 'bg-slate-500',
    text: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    pulse: false,
  },
}

const sizeConfig = {
  xs: { wrapper: 'px-1.5 py-0.5 text-xs gap-1 rounded-md', dot: 'h-1.5 w-1.5' },
  sm: { wrapper: 'px-2 py-1 text-xs gap-1.5 rounded-lg', dot: 'h-1.5 w-1.5' },
  md: { wrapper: 'px-2.5 py-1 text-xs gap-2 rounded-lg', dot: 'h-2 w-2' },
  lg: { wrapper: 'px-3 py-1.5 text-sm gap-2 rounded-lg', dot: 'h-2.5 w-2.5' },
}

export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status as string] ?? statusConfig.idle
  const sz = sizeConfig[size]

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium border',
        config.bg,
        config.border,
        config.text,
        sz.wrapper,
        className
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          config.dot,
          sz.dot,
          config.pulse && 'animate-pulse'
        )}
      />
      {showLabel && config.label}
    </div>
  )
}

import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   SKELETON BASE
───────────────────────────────────────────────────────── */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  circle?: boolean
  lines?: number
  gap?: string
}

function Skeleton({
  width,
  height,
  circle = false,
  lines,
  gap = 'gap-2',
  className,
  style,
  ...props
}: SkeletonProps) {
  const shimmerClass = [
    'relative overflow-hidden',
    'bg-surface-3',
    'before:absolute before:inset-0',
    'before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
    'before:animate-shimmer before:bg-[length:800px_100%]',
  ].join(' ')

  if (lines && lines > 1) {
    return (
      <div className={cn('flex flex-col', gap)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmerClass, 'h-4 rounded-lg', i === lines - 1 && 'w-3/4')}
            style={{ width: i < lines - 1 ? '100%' : '75%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(shimmerClass, circle ? 'rounded-full' : 'rounded-xl', className)}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        ...style,
      }}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────────────────────
   METRIC CARD SKELETON
───────────────────────────────────────────────────────── */
function MetricCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton height="12px" width="40%" />
          <Skeleton height="32px" width="60%" />
          <Skeleton height="20px" width="30%" className="rounded-full" />
        </div>
        <Skeleton width={40} height={40} circle />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   TABLE ROW SKELETON
───────────────────────────────────────────────────────── */
function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface-2 p-4">
      <Skeleton width={36} height={36} circle />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height="14px" width={`${Math.random() * 30 + 30}%`} className="flex-1" />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   CARD SKELETON
───────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton height="14px" width="50%" />
          <Skeleton height="12px" width="35%" />
        </div>
      </div>
      <Skeleton height="12px" lines={3} />
      <Skeleton height="32px" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PAGE SKELETON
───────────────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in-up">
      <div className="space-y-2">
        <Skeleton height="36px" width="30%" />
        <Skeleton height="16px" width="50%" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 space-y-4">
            <Skeleton height="20px" width="30%" />
            <Skeleton height="250px" />
          </div>
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <Skeleton height="20px" width="40%" />
          <Skeleton height="250px" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, MetricCardSkeleton, TableRowSkeleton, CardSkeleton, PageSkeleton }
export type { SkeletonProps }

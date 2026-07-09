'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardHoverProps } from '@/lib/animations'

/* ─────────────────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────────────────── */
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'surface' | 'bordered' | 'gradient'
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  as?: 'div' | 'article' | 'section'
}

const cardVariants = {
  default: 'glass',
  strong: 'glass-strong',
  surface: 'bg-surface-1 border border-border',
  bordered: 'bg-surface-1 border border-border-strong',
  gradient: 'gradient-card border border-primary/10',
}

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      hover = false,
      glow = false,
      padding = 'lg',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const Component = hover ? motion.div : 'div'
    const motionProps = hover
      ? { ...cardHoverProps, whileHover: { y: -3, transition: { type: 'spring', stiffness: 500, damping: 35 } } }
      : {}

    return (
      <Component
        ref={ref as any}
        className={cn(
          'rounded-2xl',
          cardVariants[variant],
          cardPadding[padding],
          glow && 'glow-primary',
          hover && 'cursor-pointer',
          'transition-all duration-250',
          className
        )}
        {...motionProps}
        {...(props as any)}
      >
        {children}
      </Component>
    )
  }
)
GlassCard.displayName = 'GlassCard'

export { GlassCard }
export type { GlassCardProps }

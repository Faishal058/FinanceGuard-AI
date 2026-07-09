'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'success'
  | 'gradient'
  | 'glass'
  | 'link'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  pill?: boolean
  glow?: boolean
}

/* ─────────────────────────────────────────────────────────
   VARIANT STYLES
───────────────────────────────────────────────────────── */
const variantStyles: Record<ButtonVariant, string> = {
  default: [
    'bg-primary text-primary-foreground',
    'hover:bg-primary/90',
    'shadow-sm shadow-primary/20',
    'border border-primary/20',
  ].join(' '),

  secondary: [
    'bg-secondary/10 text-secondary',
    'hover:bg-secondary/20',
    'border border-secondary/20',
  ].join(' '),

  outline: [
    'bg-transparent text-foreground',
    'border border-border-strong hover:border-primary/50',
    'hover:bg-surface-2',
  ].join(' '),

  ghost: [
    'bg-transparent text-muted-foreground',
    'hover:bg-surface-2 hover:text-foreground',
    'border border-transparent',
  ].join(' '),

  destructive: [
    'bg-destructive text-destructive-foreground',
    'hover:bg-destructive/90',
    'border border-destructive/20',
    'shadow-sm shadow-destructive/20',
  ].join(' '),

  success: [
    'bg-success text-success-foreground',
    'hover:bg-success/90',
    'border border-success/20',
    'shadow-sm shadow-success/20',
  ].join(' '),

  gradient: [
    'bg-gradient-to-r from-primary via-violet-500 to-secondary',
    'text-white font-semibold',
    'border-0',
    'shadow-lg shadow-primary/30',
    'hover:shadow-primary/50 hover:shadow-xl',
    'relative overflow-hidden',
    'shine',
  ].join(' '),

  glass: [
    'glass text-foreground',
    'hover:bg-white/8',
    'border border-white/10',
  ].join(' '),

  link: [
    'bg-transparent text-primary underline-offset-4',
    'hover:underline hover:text-primary/80',
    'border-0 shadow-none p-0 h-auto',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-sm gap-2 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-xl',
  xl: 'h-13 px-6 text-base gap-3 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
  'icon-lg': 'h-11 w-11 rounded-xl',
}

/* ─────────────────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────────────────── */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────
   BUTTON COMPONENT
───────────────────────────────────────────────────────── */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      pill = false,
      glow = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const isIconOnly = size === 'icon' || size === 'icon-sm' || size === 'icon-lg'

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        disabled={isDisabled}
        className={cn(
          /* Base */
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          /* Variant */
          variantStyles[variant],
          /* Size */
          sizeStyles[size],
          /* Modifiers */
          fullWidth && 'w-full',
          pill && '!rounded-full',
          glow && variant === 'default' && 'shadow-lg shadow-primary/30 hover:shadow-primary/50',
          glow && variant === 'gradient' && 'shadow-xl shadow-primary/40',
          /* Custom */
          className
        )}
        {...(props as any)}
      >
        {loading ? (
          <>
            <Spinner className={cn('shrink-0', isIconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
            {!isIconOnly && children && (
              <span className="opacity-70">{children}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0 flex items-center">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0 flex items-center">{rightIcon}</span>
            )}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }

'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAVIGATION_ITEMS, APP_NAME, ROUTES } from '@/lib/constants'
import { sidebarVariants, sidebarLabelVariants } from '@/lib/animations'
import {
  LayoutDashboard, MessageSquare, FileText, AlertTriangle, TrendingUp,
  Lightbulb, Brain, Zap, Workflow, Shield, Eye, Settings,
  ChevronLeft, ChevronRight, Search, Bell,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   ICON MAP (static imports for tree-shaking)
───────────────────────────────────────────────────────── */
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, MessageSquare, FileText, AlertTriangle,
  TrendingUp, Lightbulb, Brain, Zap, Workflow, Shield, Eye, Settings,
}

/* ─────────────────────────────────────────────────────────
   NAV SECTION — groups nav items
───────────────────────────────────────────────────────── */
const navSections = [
  {
    label: 'Overview',
    items: NAVIGATION_ITEMS.slice(0, 2),
  },
  {
    label: 'Intelligence',
    items: NAVIGATION_ITEMS.slice(2, 7),
  },
  {
    label: 'Platform',
    items: NAVIGATION_ITEMS.slice(7),
  },
]

/* ─────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────── */
function NavItem({
  item,
  isActive,
  open,
}: {
  item: (typeof NAVIGATION_ITEMS)[number]
  isActive: boolean
  open: boolean
}) {
  const Icon = iconMap[item.icon] ?? LayoutDashboard

  return (
    <Link
      href={item.href}
      title={!open ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
        'transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/50',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-primary/8"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Active left bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <span className="relative shrink-0 flex items-center justify-center h-5 w-5">
        <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.7} />
      </span>

      {/* Label */}
      <motion.span
        variants={sidebarLabelVariants}
        animate={open ? 'expanded' : 'collapsed'}
        className="relative overflow-hidden whitespace-nowrap"
      >
        {item.label}
      </motion.span>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('fg_token')
        if (!token) return

        const response = await fetch('/api/v2/user/data', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const profile = await response.json()
          setUser(profile)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchProfile()
  }, [])

  return (
    <>
      {/* Overlay (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        variants={sidebarVariants}
        animate={open ? 'expanded' : 'collapsed'}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex flex-col',
          'glass border-r border-white/[0.06]',
          'md:relative md:translate-x-0',
          !open && '-translate-x-full md:translate-x-0'
        )}
        style={{ width: open ? 240 : 64 }}
      >
        {/* Logo + Brand */}
        <div className={cn(
          'flex items-center border-b border-white/[0.06] shrink-0',
          open ? 'px-4 py-5 gap-3' : 'px-[18px] py-5 justify-center'
        )}>
          {/* Logo mark */}
          <div className="relative shrink-0 h-8 w-8 rounded-lg overflow-hidden">
            <div className="absolute inset-0 gradient-brand" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          {/* Brand name */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-bold text-foreground leading-tight whitespace-nowrap">
                  {APP_NAME}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">AI Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search (visible only when open) */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pt-4 pb-2"
            >
              <button className={cn(
                'w-full flex items-center gap-2.5 rounded-xl px-3 py-2',
                'bg-surface-2 border border-border text-muted-foreground',
                'text-xs hover:border-primary/30 transition-smooth',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
              )}>
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span>Quick search...</span>
                <kbd className="ml-auto text-[10px] font-mono bg-surface-3 px-1.5 py-0.5 rounded border border-border">
                  ⌘K
                </kbd>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollable px-3 py-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              <AnimatePresence>
                {open && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-tertiary"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <NavItem key={item.href} item={item} isActive={isActive} open={open} />
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — Profile & Collapse Toggle */}
        <div className="border-t border-white/[0.06] px-3 py-4 space-y-2 shrink-0">
          {/* Settings link */}
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
              'text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-smooth',
              !open && 'justify-center'
            )}
            title={!open ? 'Settings' : undefined}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
            <motion.span
              variants={sidebarLabelVariants}
              animate={open ? 'expanded' : 'collapsed'}
              className="overflow-hidden whitespace-nowrap"
            >
              Settings
            </motion.span>
          </Link>

          {/* User profile */}
          <div className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2 transition-smooth cursor-pointer',
            !open && 'justify-center'
          )}>
            <div className="h-7 w-7 shrink-0 rounded-lg overflow-hidden">
              <div className="h-full w-full gradient-brand flex items-center justify-center">
                 <span className="text-xs font-bold text-white">{user ? user.name[0].toUpperCase() : 'A'}</span>
              </div>
            </div>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-foreground truncate">{user ? user.name : 'Alex Morgan'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user ? user.email : 'alex@example.com'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs',
              'text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-smooth',
              !open && 'justify-center'
            )}
          >
            {open ? (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  )
}

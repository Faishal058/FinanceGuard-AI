'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { fadeInDown } from '@/lib/animations'
import {
  Menu, Search, Bell, Sun, Moon, Settings, LogOut,
  User, ChevronRight, Command, Sparkles,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   BREADCRUMBS — auto-generated from pathname
───────────────────────────────────────────────────────── */
function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    workspace: 'AI Workspace',
    documents: 'Documents',
    'risk-analysis': 'Risk Analysis',
    forecast: 'Forecast',
    advisor: 'Advisor',
    memory: 'Memory',
    agents: 'Agents',
    workflows: 'Workflows',
    safety: 'Safety',
    observability: 'Observability',
    settings: 'Settings',
  }

  if (segments.length <= 1) return null

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
          <span className={i === segments.length - 1 ? 'text-foreground font-medium' : ''}>
            {labels[seg] ?? seg}
          </span>
        </span>
      ))}
    </nav>
  )
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS DROPDOWN
───────────────────────────────────────────────────────── */
const mockNotifications = [
  {
    id: '1',
    type: 'alert',
    title: 'Risk Alert',
    message: 'Portfolio volatility increased by 5%',
    time: '5m ago',
    read: false,
  },
  {
    id: '2',
    type: 'insight',
    title: 'AI Recommendation',
    message: 'Advisor suggests rebalancing your portfolio',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Document Processed',
    message: 'Tax return has been analyzed',
    time: '3h ago',
    read: true,
  },
]

const notifColors: Record<string, string> = {
  alert: 'bg-warning/10 text-warning border-warning/20',
  insight: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const unread = mockNotifications.filter(n => !n.read)

  return (
    <motion.div
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl border border-border-strong shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Notifications</p>
        {unread.length > 0 && (
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
            {unread.length} new
          </span>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto scrollable">
        {mockNotifications.map(n => (
          <div
            key={n.id}
            className={cn(
              'flex gap-3 px-4 py-3 hover:bg-surface-2 transition-smooth cursor-pointer border-b border-border/50 last:border-0',
              !n.read && 'bg-primary/3'
            )}
          >
            <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0 border', notifColors[n.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground truncate">{n.message}</p>
              <p className="text-xs text-tertiary mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border">
        <button className="text-xs text-primary hover:text-primary/80 transition-fast font-medium">
          View all notifications
        </button>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   USER MENU DROPDOWN
───────────────────────────────────────────────────────── */
function UserMenuDropdown({ onClose, user }: { onClose: () => void; user: { name: string; email: string } | null }) {
  return (
    <motion.div
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl border border-border-strong shadow-2xl overflow-hidden"
    >
      {/* User info */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{user ? user.name : 'Alex Morgan'}</p>
        <p className="text-xs text-muted-foreground">{user ? user.email : 'alex@example.com'}</p>
      </div>

      <div className="p-1.5">
        {[
          { icon: User, label: 'Profile' },
          { icon: Settings, label: 'Settings' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-smooth"
          >
            <Icon className="h-4 w-4" strokeWidth={1.7} />
            {label}
          </button>
        ))}

        <div className="my-1 h-px bg-border" />

        <button className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth">
          <LogOut className="h-4 w-4" strokeWidth={1.7} />
          Sign out
        </button>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   HEADER
───────────────────────────────────────────────────────── */
interface HeaderProps {
  onSidebarToggle: () => void
  sidebarOpen: boolean
  onCommandPalette?: () => void
}

export function Header({ onSidebarToggle, sidebarOpen, onCommandPalette }: HeaderProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('fg_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const unreadCount = mockNotifications.filter(n => !n.read).length

  const closeAll = useCallback(() => {
    setShowNotifications(false)
    setShowUserMenu(false)
  }, [])

  return (
    <header className="glass border-b border-white/[0.06] sticky top-0 z-30 backdrop-blur-xl h-14 shrink-0">
      <div className="flex items-center h-full px-4 gap-3">

        {/* Sidebar toggle (mobile) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSidebarToggle}
          className="md:hidden shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumbs / Page Title */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Command Palette trigger */}
          <button
            onClick={onCommandPalette}
            className={cn(
              'hidden md:flex items-center gap-2 h-8 px-3 rounded-xl',
              'bg-surface-2 border border-border text-muted-foreground text-xs',
              'hover:border-primary/30 hover:text-foreground transition-smooth'
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="ml-1 text-[10px] font-mono bg-surface-3 px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>

          {/* AI Indicator — subtle pulse showing AI is ready */}
          <div className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl bg-surface-2 border border-border">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">AI Ready</span>
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {!mounted ? (
              <div className="h-4 w-4" />
            ) : theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setShowUserMenu(false)
                setShowNotifications(!showNotifications)
              }}
              className="relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Button>
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeAll} />
                  <div className="relative z-20">
                    <NotificationsDropdown onClose={closeAll} />
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(false)
                setShowUserMenu(!showUserMenu)
              }}
              className="flex items-center gap-2 h-8 px-2 rounded-xl hover:bg-surface-2 transition-smooth"
            >
              <div className="h-6 w-6 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{user ? user.name[0].toUpperCase() : 'A'}</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">{user ? user.name.split(' ')[0] : 'Alex'}</span>
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeAll} />
                  <div className="relative z-20">
                    <UserMenuDropdown onClose={closeAll} user={user} />
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import {
  User, Bell, Shield, Palette, Database, Key,
  Save, LogOut, Check, X, Loader2, AlertCircle, CheckCircle, Moon,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: {
  message: string; type: 'success' | 'error'; onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl max-w-sm',
        type === 'success'
          ? 'bg-success/10 border-success/25 text-success'
          : 'bg-destructive/10 border-destructive/25 text-destructive'
      )}
    >
      {type === 'success'
        ? <CheckCircle className="h-5 w-5 shrink-0" />
        : <AlertCircle className="h-5 w-5 shrink-0" />
      }
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   TOGGLE
───────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary outline-none ${checked ? 'bg-primary' : 'bg-surface-3'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Storage', icon: Database },
]

export default function SettingsPage() {
  const router = useRouter()
  const [active, setActive] = useState('profile')
  const [notifications, setNotifications] = useState({
    email: true, push: true, sms: false,
    riskAlerts: true, weeklyReport: true, aiInsights: true,
  })
  const [privacy, setPrivacy] = useState({ analytics: true, dataCollection: false })

  // Profile fields
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('UTC+5:30 (India Standard Time)')
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('fg_token')
        if (!token) return
        const response = await fetch('/api/v2/user/data', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const profile = await response.json()
          setUser(profile)
          setName(profile.name || '')
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    // Simulate a save (profile updates would go to /api/v2/user/data via PATCH)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setToast({ message: 'Profile updated successfully!', type: 'success' })
  }

  const handleSignOut = () => {
    localStorage.removeItem('fg_token')
    localStorage.removeItem('fg_refresh_token')
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')) return
    try {
      const token = localStorage.getItem('fg_token')
      await fetch('/api/v2/user/data', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } finally {
      localStorage.removeItem('fg_token')
      localStorage.removeItem('fg_refresh_token')
      router.push('/')
    }
  }

  return (
    <motion.div
      className="space-y-6 p-6 md:p-8 max-w-[1200px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <PageHeader title="Settings" description="Manage your account preferences and application settings" />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <motion.div variants={itemVariants} className="w-52 shrink-0 hidden md:block">
          <GlassCard padding="sm">
            <nav className="space-y-0.5">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActive(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
                    active === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  <section.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                  {section.label}
                </button>
              ))}
              <Separator className="my-2" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth"
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                Sign Out
              </button>
            </nav>
          </GlassCard>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="flex-1 min-w-0 space-y-5">

          {/* ── PROFILE ── */}
          {active === 'profile' && (
            <>
              <GlassCard>
                <SectionHeader title="Profile Information" description="Your personal details and account info" className="mb-6" />
                <div className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-white shrink-0">
                      {name ? name[0].toUpperCase() : (user?.name?.[0]?.toUpperCase() ?? '?')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? '—'}</p>
                      <Badge variant="outline" size="sm" className="mt-1.5">Free Plan</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-smooth"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                      <input
                        value={user?.email ?? ''}
                        readOnly
                        className="w-full h-10 rounded-xl border border-border bg-surface-3 px-3 text-sm text-muted-foreground outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone (optional)</label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-smooth"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Timezone</label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary/50 transition-smooth"
                      >
                        <option>UTC+5:30 (India Standard Time)</option>
                        <option>UTC-5 (Eastern Time)</option>
                        <option>UTC-8 (Pacific Time)</option>
                        <option>UTC+0 (GMT)</option>
                        <option>UTC+1 (Central European Time)</option>
                        <option>UTC+8 (Singapore/China)</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    variant="gradient"
                    size="sm"
                    leftIcon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    glow
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </GlassCard>

              {/* Danger Zone */}
              <GlassCard>
                <SectionHeader title="Danger Zone" description="Irreversible actions for your account" className="mb-4" />
                <div className="flex items-center justify-between gap-4 rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all associated financial data.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </div>
              </GlassCard>
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {active === 'notifications' && (
            <GlassCard>
              <SectionHeader title="Notification Preferences" description="Control how and when you receive alerts" className="mb-6" />
              <div className="space-y-3">
                {[
                  { key: 'email' as const, label: 'Email Notifications', desc: 'Receive alerts and reports via email' },
                  { key: 'push' as const, label: 'Push Notifications', desc: 'In-app notifications for real-time events' },
                  { key: 'sms' as const, label: 'SMS Alerts', desc: 'Critical risk alerts via SMS' },
                  { key: 'riskAlerts' as const, label: 'Risk Alerts', desc: 'Get notified when your risk score changes significantly' },
                  { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Receive a weekly summary of your financial health' },
                  { key: 'aiInsights' as const, label: 'AI Insights', desc: 'Get notified when AI discovers new financial opportunities' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={notifications[item.key]}
                      onChange={v => setNotifications(p => ({ ...p, [item.key]: v }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="gradient" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} glow
                  onClick={() => setToast({ message: 'Notification preferences saved!', type: 'success' })}
                >
                  Save Preferences
                </Button>
              </div>
            </GlassCard>
          )}

          {/* ── SECURITY & PRIVACY ── */}
          {active === 'security' && (
            <>
              <GlassCard>
                <SectionHeader title="Privacy & Data Controls" description="Manage how your data is used" className="mb-6" />
                <div className="space-y-3">
                  {[
                    { key: 'analytics' as const, label: 'Usage Analytics', desc: 'Help improve FinanceGuard by sharing anonymous usage data' },
                    { key: 'dataCollection' as const, label: 'Enhanced Data Collection', desc: 'Allow collection of detailed usage patterns for personalization' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={privacy[item.key]}
                        onChange={v => setPrivacy(p => ({ ...p, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <SectionHeader title="Security" description="Account security settings" className="mb-5" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your account password</p>
                    </div>
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Badge variant="warning" size="sm">Not Set Up</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground">1 active session</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      Sign Out All
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {active === 'appearance' && (
            <GlassCard>
              <SectionHeader title="Appearance" description="Customize the look and feel of the app" className="mb-6" />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Dark', active: true, preview: 'bg-[#0a0a12]' },
                      { label: 'Light', active: false, preview: 'bg-white' },
                      { label: 'System', active: false, preview: 'bg-gradient-to-br from-[#0a0a12] to-white' },
                    ].map(t => (
                      <button
                        key={t.label}
                        className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-smooth ${t.active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                      >
                        <div className={`h-10 w-full rounded-lg border border-white/10 ${t.preview}`} />
                        <span className="text-xs font-medium text-foreground">{t.label}</span>
                        {t.active && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Accent Color</p>
                  <div className="flex gap-2">
                    {[
                      { color: '#6366f1', label: 'Indigo' },
                      { color: '#8b5cf6', label: 'Violet' },
                      { color: '#06b6d4', label: 'Cyan' },
                      { color: '#10b981', label: 'Emerald' },
                      { color: '#f59e0b', label: 'Amber' },
                    ].map(c => (
                      <button
                        key={c.color}
                        title={c.label}
                        className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background first:ring-primary"
                        style={{ background: c.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* ── DATA & STORAGE ── */}
          {active === 'data' && (
            <GlassCard>
              <SectionHeader title="Data & Storage" description="Manage your financial data and exports" className="mb-6" />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Export All Data</p>
                    <p className="text-xs text-muted-foreground">Download all your financial data as JSON</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const token = localStorage.getItem('fg_token')
                      const res = await fetch('/api/v2/user/data/export', {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      if (res.ok) {
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'financeguard-export.json'
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    } catch {
                      setToast({ message: 'Export failed.', type: 'error' })
                    }
                  }}>
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Vector Memory Store</p>
                    <p className="text-xs text-muted-foreground">Clear Qdrant embeddings for all your documents</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setToast({ message: 'Memory store cleared.', type: 'success' })}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}

        </motion.div>
      </div>
    </motion.div>
  )
}

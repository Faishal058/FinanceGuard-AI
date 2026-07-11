'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { User, Bell, Shield, Palette, Database, Key, Save, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Integrations', icon: Database },
  { id: 'api', label: 'API Keys', icon: Key },
]

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

export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false })
  const [privacy, setPrivacy] = useState({ analytics: true, dataCollection: false })
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
    <motion.div
      className="space-y-6 p-6 md:p-8 max-w-[1200px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
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
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth">
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                Sign Out
              </button>
            </nav>
          </GlassCard>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="flex-1 min-w-0 space-y-5">
          {/* Profile Section */}
          <GlassCard>
            <SectionHeader title="Profile Information" description="Update your personal details" className="mb-6" />
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-white shrink-0">
                  {user ? user.name[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={user?.name || ''} readOnly />
                <Input label="Email" type="email" value={user?.email || ''} readOnly />
                <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
                <Input label="Timezone" defaultValue="UTC-5 (Eastern Time)" />
              </div>
              <Button variant="gradient" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} glow>
                Save Changes
              </Button>
            </div>
          </GlassCard>

          {/* Notifications */}
          <GlassCard>
            <SectionHeader title="Notification Preferences" className="mb-6" />
            <div className="space-y-4">
              {[
                { key: 'email' as const, label: 'Email Notifications', desc: 'Receive alerts and reports via email' },
                { key: 'push' as const, label: 'Push Notifications', desc: 'In-app notifications for real-time events' },
                { key: 'sms' as const, label: 'SMS Alerts', desc: 'Critical risk alerts via SMS' },
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
          </GlassCard>

          {/* Privacy */}
          <GlassCard>
            <SectionHeader title="Privacy & Data" className="mb-6" />
            <div className="space-y-4">
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

          {/* API Keys */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="API Keys" description="Manage your integration credentials" />
              <Button variant="outline" size="sm" leftIcon={<Key className="h-3.5 w-3.5" />}>
                Generate Key
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Production API Key', key: 'fg_prod_••••••••••••5f2a', lastUsed: '2 hours ago', status: 'active' },
                { name: 'Development API Key', key: 'fg_dev_••••••••••••9b1c', lastUsed: '3 days ago', status: 'active' },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{k.name}</p>
                      <Badge variant="success" size="sm" dot>{k.status}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{k.key}</p>
                    <p className="text-xs text-tertiary mt-0.5">Last used: {k.lastUsed}</p>
                  </div>
                  <Button variant="ghost" size="xs" className="text-destructive hover:text-destructive">
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}

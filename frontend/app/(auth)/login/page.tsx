'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Shield, Brain, TrendingUp } from 'lucide-react'

const features = [
  { icon: Brain, text: 'Multi-agent AI powered by Mastra' },
  { icon: Shield, text: 'Enkrypt AI safety guardrails' },
  { icon: TrendingUp, text: 'Real-time risk analysis & forecasting' },
]

function LoginForm() {
  const searchParams = useSearchParams()
  const mode = searchParams ? searchParams.get('mode') : null
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v2/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isSignup ? 'signup' : 'login',
          email,
          password,
          name: isSignup ? name : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      localStorage.setItem('fg_token', data.token)
      localStorage.setItem('fg_refresh', data.refreshToken)
      localStorage.setItem('fg_user', JSON.stringify(data.user))

      // Accept default privacy consents automatically on first login for demo purposes
      if (isSignup) {
        const types = ['data_processing', 'memory_storage', 'financial_analysis', 'advisory_output']
        for (const type of types) {
          await fetch('/api/v2/consent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              consent_type: type,
              purpose: `Required for AI financial analysis and RAG memory.`,
            }),
          })
        }
      }

      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-stretch">
      {/* ── Left panel (Branding) ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Background gradient card */}
        <div className="absolute inset-0 gradient-brand opacity-10" />
        <div className="absolute inset-0 glass border-r border-white/[0.06]" />

        {/* Content */}
        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-foreground">FinanceGuard AI</p>
              <p className="text-xs text-muted-foreground">Enterprise Platform</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
              Your AI-powered<br />financial guardian
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Intelligent multi-agent system that analyzes, protects, and grows your wealth with enterprise-grade AI.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.7} />
                </div>
                <p className="text-sm text-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative">
          <div className="glass rounded-2xl border border-white/10 p-4">
            <p className="text-sm text-muted-foreground italic mb-3">
              "FinanceGuard AI identified $12,000 in tax optimization opportunities I had missed."
            </p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">JM</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">James Mitchell</p>
                <p className="text-xs text-muted-foreground">Senior Financial Advisor</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Right panel (Form) ── */}
      <div className="flex flex-1 items-center justify-center p-6 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[400px] space-y-8"
        >
          {/* Mobile logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 lg:hidden">
            <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold text-foreground">FinanceGuard AI</p>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {isSignup ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignup ? 'Register to get started with FinanceGuard' : 'Sign in to access your financial intelligence platform'}
            </p>
          </motion.div>

          {error && (
            <motion.div
              variants={itemVariants}
              className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Alexandra Morgan"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="hover:text-foreground transition-fast"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />
              {!isSignup && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-fast">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="lg"
              loading={loading}
              glow
              rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Register' : 'Sign In')}
            </Button>
          </motion.form>

          {/* Divider */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* OAuth */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            {[
              { label: 'Google', logo: 'G' },
              { label: 'Microsoft', logo: 'M' },
            ].map(provider => (
              <Button key={provider.label} variant="outline" size="md" onClick={() => window.location.href = '/dashboard'}>
                <span className="font-bold mr-1.5">{provider.logo}</span>
                {provider.label}
              </Button>
            ))}
          </motion.div>

          {/* Toggle link */}
          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(p => !p)
                setError(null)
              }}
              className="text-primary hover:text-primary/80 font-medium transition-fast focus:outline-none"
            >
              {isSignup ? 'Sign in' : 'Create account'}
            </button>
          </motion.p>

          {/* Security note */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-1.5 text-xs text-tertiary">
            <Shield className="h-3 w-3" />
            <span>256-bit encryption · SOC 2 Type II · GDPR compliant</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm font-medium text-white/50">Loading Auth...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}


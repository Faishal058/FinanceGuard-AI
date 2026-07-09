import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 h-[400px] w-[400px] rounded-full bg-secondary/6 blur-[80px]" />
        <div className="absolute top-3/4 left-1/3 h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-[60px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>
      {children}
    </div>
  )
}

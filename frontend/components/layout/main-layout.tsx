'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { CommandPalette } from './command-palette'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commandOpen, setCommandOpen] = useState(false)

  // Collapse sidebar on mobile by default
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) setSidebarOpen(false)
  }, [])

  const openCommand = useCallback(() => setCommandOpen(true), [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Subtle radial gradient behind content */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header
          onSidebarToggle={() => setSidebarOpen(p => !p)}
          sidebarOpen={sidebarOpen}
          onCommandPalette={openCommand}
        />

        {/* Page content */}
        <motion.main
          key="main-content"
          className="flex-1 overflow-auto scrollable"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={closeCommand} />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fg_token') : null
    if (!token) {
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [router])

  if (isAuthenticated === false) {
    return null
  }

  return <MainLayout>{children}</MainLayout>
}

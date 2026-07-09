import { cn } from '@/lib/utils'

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  return (
    <nav className={cn('flex items-center space-x-4', className)}>
      {/* Navigation items will be added here */}
    </nav>
  )
}

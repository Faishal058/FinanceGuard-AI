import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  const units = ['', 'K', 'M', 'B', 'T']
  let unitIndex = 0
  let num = value

  while (Math.abs(num) >= 1000 && unitIndex < units.length - 1) {
    num /= 1000
    unitIndex++
  }

  return `${num.toFixed(1)}${units[unitIndex]}`
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function formatFullDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date).getTime()
  const now = Date.now()
  const diff = Math.floor((now - d) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatShortDate(date)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function generateGradient(color1: string, color2: string): string {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
}

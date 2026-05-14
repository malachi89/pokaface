import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error'
  children: ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variantClasses = {
    default: 'bg-brand text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
  }

  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>{children}</span>
}

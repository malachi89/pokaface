import type { ReactNode } from 'react'

interface ButtonProps {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
  title?: string
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  title,
  type = 'button',
}: ButtonProps) {
  const baseClasses =
    'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand'

  const variantClasses = {
    primary: 'bg-brand hover:bg-brand-hover text-white disabled:bg-surface-3 disabled:text-muted',
    secondary: 'bg-surface-2 hover:bg-surface-3 text-white disabled:bg-surface-1 disabled:text-muted',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-surface-3 disabled:text-muted',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const finalClass = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${className}`

  return (
    <button onClick={onClick} disabled={disabled} className={finalClass} title={title} type={type}>
      {children}
    </button>
  )
}

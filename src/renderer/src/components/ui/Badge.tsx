import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error'
  className?: string
}

const variants = {
  default: 'bg-so-elevated text-so-text-2 border border-so-border',
  accent: 'bg-so-accent-dim text-so-accent-hi',
  success: 'bg-so-success/15 text-so-success',
  warning: 'bg-so-warning/15 text-so-warning',
  error: 'bg-so-error/15 text-so-error',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center',
        'px-1.5 py-0.5',
        'text-xxs font-medium rounded',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

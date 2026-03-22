import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'subtle' | 'accent'
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-7 h-7 text-sm',
  lg: 'w-8 h-8 text-base',
}

const variantClasses = {
  ghost: [
    'text-so-text-2',
    'hover:text-so-text hover:bg-so-active',
    'active:bg-so-border',
  ].join(' '),
  subtle: [
    'text-so-text-2 bg-so-elevated',
    'hover:text-so-text hover:bg-so-active',
  ].join(' '),
  accent: [
    'text-so-accent-hi',
    'hover:text-so-text hover:bg-so-accent-dim',
  ].join(' '),
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, active = false, size = 'md', variant = 'ghost', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={[
          'titlebar-no-drag',
          'inline-flex items-center justify-center',
          'rounded',
          'transition-colors duration-150',
          'outline-none focus-visible:ring-1 focus-visible:ring-so-accent-hi',
          sizeClasses[size],
          variantClasses[variant],
          active ? 'text-so-accent-hi bg-so-accent-dim' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

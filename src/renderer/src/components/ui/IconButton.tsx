import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'subtle' | 'accent'
}

const sizeClasses = {
  sm: 'h-8 min-w-8 px-2 text-xs',
  md: 'h-9 min-w-9 px-2.5 text-sm',
  lg: 'h-10 min-w-10 px-3 text-base',
}

const variantClasses = {
  ghost: [
    'border border-transparent',
    'text-so-text-2',
    'hover:text-so-text hover:bg-white/5 hover:border-so-border',
    'active:bg-white/10',
  ].join(' '),
  subtle: [
    'border border-so-border',
    'bg-white/5 text-so-text-2',
    'hover:text-so-text hover:bg-white/8 hover:border-[color:rgba(222,206,181,0.22)]',
  ].join(' '),
  accent: [
    'border border-[color:rgba(202,162,75,0.28)]',
    'bg-so-accent-dim text-so-accent-hi',
    'hover:text-so-text hover:border-[color:rgba(202,162,75,0.4)] hover:bg-[rgba(202,162,75,0.22)]',
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
          'titlebar-no-drag inline-flex items-center justify-center gap-1.5',
          'rounded-full',
          'transition-all duration-150',
          'outline-none focus-visible:ring-1 focus-visible:ring-so-accent-hi focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
          sizeClasses[size],
          variantClasses[variant],
          active
            ? 'border-[color:rgba(202,162,75,0.34)] bg-[rgba(202,162,75,0.16)] text-so-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'

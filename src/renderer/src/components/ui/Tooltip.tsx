import React, { useState, useRef } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

/**
 * Lightweight tooltip using CSS-only approach to avoid large dependencies.
 * For Phase 1 this wraps children and shows a title-based tooltip via the
 * built-in browser mechanism, upgraded to a styled overlay once interaction
 * libraries are added in a later phase.
 */
export function Tooltip({ content, children, side = 'bottom', delay = 400 }: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  const sideClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  }[side]

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          role="tooltip"
          className={[
            'absolute z-50 pointer-events-none',
            'px-2 py-1 rounded',
            'text-xxs font-medium whitespace-nowrap',
            'bg-so-elevated text-so-text border border-so-border',
            'shadow-lg',
            'animate-fade-in',
            sideClass,
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  )
}

import React, { useEffect } from 'react'
import { Minus, Square, X, Film } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useProjectStore } from '../../store/projectStore'

/**
 * Custom frameless window titlebar.
 * - Drag region covers the full bar minus the controls.
 * - Window state (maximized/fullscreen) is synced from main via IPC.
 */
export function TitleBar(): React.JSX.Element {
  const isMaximized = useAppStore((s) => s.isMaximized)
  const setWindowState = useAppStore((s) => s.setWindowState)
  const getDisplayTitle = useProjectStore((s) => s.getDisplayTitle)

  // Sync window state on mount and via events
  useEffect(() => {
    if (!window.api) return

    window.api.isMaximized().then((maximized) => {
      setWindowState({ isMaximized: maximized })
    })

    const unsubscribe = window.api.onWindowStateChanged((state) => {
      setWindowState(state)
    })

    return unsubscribe
  }, [setWindowState])

  return (
    <div
      className="titlebar-drag flex items-center h-9 bg-so-bg border-b border-so-border-dim flex-shrink-0 select-none"
      style={{ minHeight: 36 }}
    >
      {/* App icon + name */}
      <div className="titlebar-no-drag flex items-center gap-1.5 px-3 text-so-text-3">
        <Film size={13} className="text-so-accent" />
        <span className="text-xs font-semibold tracking-wide text-so-text-2">scriptOdd</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-so-border-dim mx-1" />

      {/* Project title */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs text-so-text-3 truncate max-w-xs">
          {getDisplayTitle()}
        </span>
      </div>

      {/* Window controls — Windows style, right-aligned */}
      <div className="titlebar-no-drag flex items-center">
        <WindowButton
          label="Minimize"
          onClick={() => window.api?.minimizeWindow()}
          hoverClass="hover:bg-so-active"
        >
          <Minus size={11} />
        </WindowButton>

        <WindowButton
          label={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => window.api?.maximizeWindow()}
          hoverClass="hover:bg-so-active"
        >
          {isMaximized ? (
            // Restore icon (two overlapping squares approximation)
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="0" width="8" height="8" rx="0.5" />
              <path d="M0 2v8a1 1 0 001 1h8" />
            </svg>
          ) : (
            <Square size={10} />
          )}
        </WindowButton>

        <WindowButton
          label="Close"
          onClick={() => window.api?.closeWindow()}
          hoverClass="hover:bg-red-600 hover:text-white"
        >
          <X size={12} />
        </WindowButton>
      </div>
    </div>
  )
}

interface WindowButtonProps {
  label: string
  onClick: () => void
  hoverClass: string
  children: React.ReactNode
}

function WindowButton({ label, onClick, hoverClass, children }: WindowButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        'flex items-center justify-center',
        'w-11 h-9',
        'text-so-text-3 transition-colors duration-100',
        hoverClass,
        'outline-none',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

import React, { useEffect } from 'react'
import { Minus, Square, X, Film } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useProjectStore } from '../../store/projectStore'

export function TitleBar(): React.JSX.Element {
  const isMaximized = useAppStore((s) => s.isMaximized)
  const setWindowState = useAppStore((s) => s.setWindowState)
  const getDisplayTitle = useProjectStore((s) => s.getDisplayTitle)

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
    <div className="titlebar-drag flex items-center h-10 px-2 border-b border-so-border chrome-surface flex-shrink-0 select-none">
      <div className="titlebar-no-drag flex items-center gap-2 px-2.5 py-1 rounded-full border border-so-border bg-white/5 text-so-text-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:rgba(202,162,75,0.34)] bg-[rgba(202,162,75,0.14)] text-so-accent-hi">
          <Film size={12} strokeWidth={1.75} />
        </span>
        <span className="text-[11px] font-semibold tracking-[0.24em] uppercase text-so-text">scriptOdd</span>
      </div>

      <div className="chrome-divider mx-3" />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl truncate text-[11px] uppercase tracking-[0.24em] text-so-text-3">
          {getDisplayTitle()}
        </div>
      </div>

      <div className="titlebar-no-drag flex items-center gap-1 rounded-full border border-so-border bg-white/5 p-1">
        <WindowButton label="Minimize" onClick={() => window.api?.minimizeWindow()} hoverClass="hover:bg-white/10">
          <Minus size={11} strokeWidth={1.8} />
        </WindowButton>

        <WindowButton label={isMaximized ? 'Restore' : 'Maximize'} onClick={() => window.api?.maximizeWindow()} hoverClass="hover:bg-white/10">
          {isMaximized ? (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="0" width="8" height="8" rx="0.5" />
              <path d="M0 2v8a1 1 0 0 0 1 1h8" />
            </svg>
          ) : (
            <Square size={10} strokeWidth={1.7} />
          )}
        </WindowButton>

        <WindowButton label="Close" onClick={() => window.api?.closeWindow()} hoverClass="hover:bg-[#b65e49] hover:text-white">
          <X size={12} strokeWidth={1.8} />
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
        'flex items-center justify-center rounded-full',
        'w-8 h-8',
        'text-so-text-2 transition-colors duration-100',
        hoverClass,
        'outline-none',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

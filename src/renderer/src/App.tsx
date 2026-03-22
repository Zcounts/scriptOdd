/**
 * App.tsx — Phase 7
 *
 * Top-level application component.
 *
 * Phase 7 additions:
 *   - All file menu actions are now fully wired to useProjectOperations
 *   - Crash recovery check on startup
 *   - Autosave is passed into ScreenplayEditorProvider
 */

import React, { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useAppStore } from './store/appStore'
import { useLayoutStore } from './store/layoutStore'
import { ScreenplayEditorProvider } from './editor/ScreenplayEditorProvider'
import { useProjectOperations } from './hooks/useProjectOperations'
import { ToastContainer } from './components/ui/ToastContainer'

// ── Crash recovery banner ─────────────────────────────────────────────────────

function CrashRecoveryBanner({
  onRestore,
  onDismiss,
}: {
  onRestore: () => void
  onDismiss: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        top: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'var(--color-warning, #b45309)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 6,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        fontSize: 13,
      }}
    >
      <span>Unsaved session found. Restore it?</span>
      <button
        onClick={onRestore}
        style={{
          background: '#fff',
          color: '#b45309',
          border: 'none',
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        Restore
      </button>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Discard
      </button>
    </div>
  )
}

// ── Inner app (needs project operations hook inside ScreenplayEditorProvider) ──

function AppInner(): React.JSX.Element {
  const { setActiveView } = useLayoutStore()
  const {
    newProject,
    openProject,
    saveProject,
    saveProjectAs,
    exportPDF,
    exportFountain,
    loadCrashRecovery,
    autosave,
  } = useProjectOperations()

  const [crashData, setCrashData] = useState<string | null>(null)

  // ── Crash recovery check ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window.api) return
    window.api
      .readCrashRecovery()
      .then((result) => {
        if (result.success && result.data) {
          setCrashData(result.data)
        }
      })
      .catch(() => {})
  }, [])

  const handleRestore = () => {
    if (crashData) {
      loadCrashRecovery(crashData)
      window.api?.deleteCrashRecovery().catch(() => {})
    }
    setCrashData(null)
  }

  const handleDismissRecovery = () => {
    window.api?.deleteCrashRecovery().catch(() => {})
    setCrashData(null)
  }

  // ── Menu action dispatch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window.api) return

    const unsubscribe = window.api.onMenuAction((action) => {
      switch (action) {
        case 'file:new-project':
          newProject()
          break
        case 'file:open-project':
          openProject()
          break
        case 'file:save-project':
          saveProject()
          break
        case 'file:save-project-as':
          saveProjectAs()
          break
        case 'file:export-pdf':
          exportPDF()
          break
        case 'file:export-fountain':
          exportFountain()
          break
        case 'view:draft':
          setActiveView('draft')
          break
        case 'view:page':
          setActiveView('page')
          break
        case 'view:board':
          setActiveView('board')
          break
        case 'layout:toggle-left-sidebar':
          useLayoutStore.getState().toggleLeftSidebar()
          break
        case 'layout:toggle-right-panel':
          useLayoutStore.getState().toggleRightPanel()
          break
        case 'layout:focus-mode':
          useLayoutStore.getState().toggleFocusMode()
          break
        case 'app:toggle-theme':
          useAppStore.getState().toggleTheme()
          break
        default:
          console.log('[menu] unhandled action:', action)
      }
    })

    return unsubscribe
  }, [newProject, openProject, saveProject, saveProjectAs, exportPDF, exportFountain, setActiveView])

  return (
    <>
      {crashData && (
        <CrashRecoveryBanner onRestore={handleRestore} onDismiss={handleDismissRecovery} />
      )}
      <AppShell />
      <ToastContainer />
    </>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const { theme } = useAppStore()

  // Apply theme class to <html> for CSS variable switching
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light', 'high-contrast')
    html.classList.add(theme)
  }, [theme])

  // We need useProjectOperations inside the editor provider context
  // because autosave reads the editor store.  We pass autosave as a prop.
  return (
    <AutosaveWrapper />
  )
}

/**
 * Wrapper that instantiates project operations before passing autosave into
 * the editor provider.  Must live outside ScreenplayEditorProvider so it can
 * pass the callback as a prop (not use a hook that depends on the editor).
 */
function AutosaveWrapper(): React.JSX.Element {
  const { autosave } = useProjectOperations()

  return (
    <ScreenplayEditorProvider onAutosave={autosave}>
      <AppInner />
    </ScreenplayEditorProvider>
  )
}

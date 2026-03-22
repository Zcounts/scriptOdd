import React, { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useAppStore } from './store/appStore'
import { useLayoutStore } from './store/layoutStore'

export default function App(): React.JSX.Element {
  const { theme } = useAppStore()
  const { setActiveView } = useLayoutStore()

  // Apply theme class to <html> for CSS variable switching
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }, [theme])

  // Subscribe to menu actions sent from the main process
  useEffect(() => {
    if (!window.api) return

    const unsubscribe = window.api.onMenuAction((action) => {
      switch (action) {
        case 'file:new-project':
          // Will be wired to project store in Phase 2
          console.log('[menu] new project')
          break
        case 'file:open-project':
          window.api.openProject().then((result) => {
            if (!result.cancelled) console.log('[menu] open project:', result.filePath)
          })
          break
        case 'file:save-project':
          console.log('[menu] save project')
          break
        case 'file:save-project-as':
          console.log('[menu] save project as')
          break
        case 'file:export-pdf':
          console.log('[menu] export pdf')
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
  }, [setActiveView])

  return <AppShell />
}

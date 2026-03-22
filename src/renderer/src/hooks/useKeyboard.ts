import { useEffect, useCallback } from 'react'

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ShortcutDef {
  key: string
  modifiers?: Modifier[]
  description?: string
  handler: (e: KeyboardEvent) => void
  /** If true, calls e.preventDefault() automatically */
  preventDefault?: boolean
}

/**
 * Register keyboard shortcuts.
 *
 * Usage:
 *   useKeyboard([
 *     { key: 's', modifiers: ['ctrl'], handler: () => save(), preventDefault: true },
 *   ])
 */
export function useKeyboard(shortcuts: ShortcutDef[]): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const mods = shortcut.modifiers ?? []

        const ctrlMatch =
          !mods.includes('ctrl') || (e.ctrlKey && !e.metaKey) || (e.metaKey && !e.ctrlKey)
        // On Mac, Ctrl shortcuts become Meta; handle both
        const cmdOrCtrl = mods.includes('ctrl')
          ? e.ctrlKey || e.metaKey
          : true

        const shiftMatch = !mods.includes('shift') || e.shiftKey
        const altMatch = !mods.includes('alt') || e.altKey
        const metaOnlyMatch = mods.includes('meta') ? e.metaKey : true

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatch && cmdOrCtrl && shiftMatch && altMatch) {
          if (shortcut.preventDefault) e.preventDefault()
          shortcut.handler(e)
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Format a shortcut for display in tooltips / menus.
 * E.g. { key: 's', modifiers: ['ctrl'] } → "Ctrl+S"
 */
export function formatShortcut(key: string, modifiers: Modifier[] = []): string {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const parts: string[] = []

  if (modifiers.includes('ctrl')) parts.push(isMac ? '⌘' : 'Ctrl')
  if (modifiers.includes('shift')) parts.push(isMac ? '⇧' : 'Shift')
  if (modifiers.includes('alt')) parts.push(isMac ? '⌥' : 'Alt')

  parts.push(key.length === 1 ? key.toUpperCase() : key)

  return parts.join(isMac ? '' : '+')
}

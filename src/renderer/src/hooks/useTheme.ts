import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import type { Theme } from '../types'

/**
 * Provides the current theme and a toggle function.
 * Keeps the <html> class in sync with the store.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }, [theme])

  return { theme, toggleTheme, setTheme }
}

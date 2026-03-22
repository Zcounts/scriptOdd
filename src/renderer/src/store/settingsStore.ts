/**
 * Settings store — Phase 5
 *
 * Persisted settings for semantic highlighting:
 *   - semanticHighlight  : master on/off toggle
 *   - highlightIntensity : low / medium / high background tint strength
 *   - highlightStyle     : minimal (border only) / vivid (background tint)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type HighlightIntensity = 'low' | 'medium' | 'high'
export type HighlightStyle = 'minimal' | 'vivid'

interface SettingsState {
  semanticHighlight: boolean
  highlightIntensity: HighlightIntensity
  highlightStyle: HighlightStyle

  toggleSemanticHighlight: () => void
  setHighlightIntensity: (v: HighlightIntensity) => void
  setHighlightStyle: (v: HighlightStyle) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      semanticHighlight: true,
      highlightIntensity: 'medium',
      highlightStyle: 'minimal',

      toggleSemanticHighlight: () =>
        set((s) => ({ semanticHighlight: !s.semanticHighlight })),

      setHighlightIntensity: (highlightIntensity) => set({ highlightIntensity }),

      setHighlightStyle: (highlightStyle) => set({ highlightStyle }),
    }),
    {
      name: 'scriptodd-settings',
      partialize: (s) => ({
        semanticHighlight: s.semanticHighlight,
        highlightIntensity: s.highlightIntensity,
        highlightStyle: s.highlightStyle,
      }),
    }
  )
)

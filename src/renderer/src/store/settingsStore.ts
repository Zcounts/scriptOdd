/**
 * Settings store — Phase 6
 *
 * Persisted settings for:
 *   Phase 5:
 *     semanticHighlight  — master on/off toggle
 *     highlightIntensity — low / medium / high background tint strength
 *     highlightStyle     — minimal (border only) / vivid (background tint)
 *
 *   Phase 6 additions:
 *     editorFontSize     — sm / md / lg (draft view font size)
 *     editorLineHeight   — normal / relaxed / spacious
 *     pageSize           — letter / a4
 *     pageMarginsPreset  — compact / standard / wide
 *     showPageChrome     — show/hide page number headers + separator lines
 *     settingsPanelOpen  — UI state (not persisted)
 *     commandPaletteOpen — UI state (not persisted)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EditorFontSize, EditorLineHeight, PageMarginsPreset, PageSize } from '../types'

export type HighlightIntensity = 'low' | 'medium' | 'high'
export type HighlightStyle = 'minimal' | 'vivid'

interface SettingsState {
  // ── Semantic highlight (Phase 5) ────────────────────────────────────────────
  semanticHighlight: boolean
  highlightIntensity: HighlightIntensity
  highlightStyle: HighlightStyle

  // ── Typography (Phase 6) ────────────────────────────────────────────────────
  editorFontSize: EditorFontSize
  editorLineHeight: EditorLineHeight

  // ── Page settings (Phase 6) ─────────────────────────────────────────────────
  pageSize: PageSize
  pageMarginsPreset: PageMarginsPreset
  showPageChrome: boolean

  // ── UI state (not persisted) ────────────────────────────────────────────────
  settingsPanelOpen: boolean
  commandPaletteOpen: boolean

  // ── Actions ─────────────────────────────────────────────────────────────────
  toggleSemanticHighlight: () => void
  setHighlightIntensity: (v: HighlightIntensity) => void
  setHighlightStyle: (v: HighlightStyle) => void

  setEditorFontSize: (v: EditorFontSize) => void
  setEditorLineHeight: (v: EditorLineHeight) => void

  setPageSize: (v: PageSize) => void
  setPageMarginsPreset: (v: PageMarginsPreset) => void
  toggleShowPageChrome: () => void

  openSettingsPanel: () => void
  closeSettingsPanel: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      semanticHighlight: true,
      highlightIntensity: 'medium',
      highlightStyle: 'minimal',

      editorFontSize: 'md',
      editorLineHeight: 'relaxed',

      pageSize: 'letter',
      pageMarginsPreset: 'standard',
      showPageChrome: true,

      settingsPanelOpen: false,
      commandPaletteOpen: false,

      toggleSemanticHighlight: () =>
        set((s) => ({ semanticHighlight: !s.semanticHighlight })),
      setHighlightIntensity: (highlightIntensity) => set({ highlightIntensity }),
      setHighlightStyle: (highlightStyle) => set({ highlightStyle }),

      setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
      setEditorLineHeight: (editorLineHeight) => set({ editorLineHeight }),

      setPageSize: (pageSize) => set({ pageSize }),
      setPageMarginsPreset: (pageMarginsPreset) => set({ pageMarginsPreset }),
      toggleShowPageChrome: () => set((s) => ({ showPageChrome: !s.showPageChrome })),

      openSettingsPanel: () => set({ settingsPanelOpen: true }),
      closeSettingsPanel: () => set({ settingsPanelOpen: false }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'scriptodd-settings',
      partialize: (s) => ({
        semanticHighlight: s.semanticHighlight,
        highlightIntensity: s.highlightIntensity,
        highlightStyle: s.highlightStyle,
        editorFontSize: s.editorFontSize,
        editorLineHeight: s.editorLineHeight,
        pageSize: s.pageSize,
        pageMarginsPreset: s.pageMarginsPreset,
        showPageChrome: s.showPageChrome,
      }),
    }
  )
)

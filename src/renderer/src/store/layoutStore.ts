import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ViewMode, SidebarTab, RightPanelTab, LayoutPresetName } from '../types'

interface LayoutState {
  // Panel visibility
  leftSidebarVisible: boolean
  rightPanelVisible: boolean

  // Panel sizes (stored as percentages for react-resizable-panels)
  leftSidebarSize: number  // default ~18%
  rightPanelSize: number   // default ~22%

  // Active view
  activeView: ViewMode

  // Focus mode — hides all chrome except editor
  focusMode: boolean

  // Tab selections
  leftSidebarTab: SidebarTab
  rightPanelTab: RightPanelTab

  // Layout preset (Phase 6)
  layoutPreset: LayoutPresetName

  // Actions
  setActiveView: (view: ViewMode) => void
  toggleLeftSidebar: () => void
  toggleRightPanel: () => void
  setLeftSidebarVisible: (visible: boolean) => void
  setRightPanelVisible: (visible: boolean) => void
  setLeftSidebarSize: (size: number) => void
  setRightPanelSize: (size: number) => void
  toggleFocusMode: () => void
  setFocusMode: (active: boolean) => void
  setLeftSidebarTab: (tab: SidebarTab) => void
  setRightPanelTab: (tab: RightPanelTab) => void
  applyLayoutPreset: (preset: LayoutPresetName) => void
  resetPanelSizes: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftSidebarVisible: true,
      rightPanelVisible: true,
      leftSidebarSize: 18,
      rightPanelSize: 22,
      activeView: 'draft',
      focusMode: false,
      leftSidebarTab: 'navigator',
      rightPanelTab: 'notes',
      layoutPreset: 'default',

      setActiveView: (activeView) => set({ activeView }),

      toggleLeftSidebar: () =>
        set((s) => ({ leftSidebarVisible: !s.leftSidebarVisible })),

      toggleRightPanel: () =>
        set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),

      setLeftSidebarVisible: (leftSidebarVisible) => set({ leftSidebarVisible }),

      setRightPanelVisible: (rightPanelVisible) => set({ rightPanelVisible }),

      setLeftSidebarSize: (leftSidebarSize) => set({ leftSidebarSize }),

      setRightPanelSize: (rightPanelSize) => set({ rightPanelSize }),

      toggleFocusMode: () =>
        set((s) => ({ focusMode: !s.focusMode })),

      setFocusMode: (focusMode) => set({ focusMode }),

      setLeftSidebarTab: (leftSidebarTab) => set({ leftSidebarTab }),

      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

      applyLayoutPreset: (preset) => {
        switch (preset) {
          case 'default':
            set({ layoutPreset: preset, leftSidebarVisible: true, rightPanelVisible: true, focusMode: false, leftSidebarSize: 18, rightPanelSize: 22 })
            break
          case 'writer':
            set({ layoutPreset: preset, leftSidebarVisible: true, rightPanelVisible: false, focusMode: false })
            break
          case 'focus':
            set({ layoutPreset: preset, leftSidebarVisible: false, rightPanelVisible: false, focusMode: true })
            break
          case 'research':
            set({ layoutPreset: preset, leftSidebarVisible: false, rightPanelVisible: true, focusMode: false })
            break
        }
      },

      resetPanelSizes: () =>
        set({ leftSidebarSize: 18, rightPanelSize: 22 }),
    }),
    {
      name: 'scriptodd-layout',
      partialize: (s) => ({
        leftSidebarVisible: s.leftSidebarVisible,
        rightPanelVisible: s.rightPanelVisible,
        leftSidebarSize: s.leftSidebarSize,
        rightPanelSize: s.rightPanelSize,
        activeView: s.activeView,
        leftSidebarTab: s.leftSidebarTab,
        rightPanelTab: s.rightPanelTab,
        layoutPreset: s.layoutPreset,
      }),
    }
  )
)

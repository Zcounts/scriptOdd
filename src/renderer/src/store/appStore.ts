import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, RecentProject } from '../types'

interface AppState {
  // Settings
  theme: Theme
  appVersion: string
  platform: string

  // Window state (synced from main via IPC)
  isMaximized: boolean
  isFullscreen: boolean

  // Recent projects (persisted)
  recentProjects: RecentProject[]

  // Actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAppVersion: (version: string) => void
  setPlatform: (platform: string) => void
  setWindowState: (state: { isMaximized?: boolean; isFullscreen?: boolean }) => void
  addRecentProject: (project: RecentProject) => void
  removeRecentProject: (id: string) => void
  clearRecentProjects: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      appVersion: '0.1.0',
      platform: 'win32',
      isMaximized: false,
      isFullscreen: false,
      recentProjects: [],

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((s) => {
          const cycle: Record<string, import('../types').Theme> = {
            dark: 'light',
            light: 'high-contrast',
            'high-contrast': 'dark',
          }
          return { theme: cycle[s.theme] ?? 'dark' }
        }),

      setAppVersion: (appVersion) => set({ appVersion }),

      setPlatform: (platform) => set({ platform }),

      setWindowState: (state) =>
        set((s) => ({
          isMaximized: state.isMaximized ?? s.isMaximized,
          isFullscreen: state.isFullscreen ?? s.isFullscreen,
        })),

      addRecentProject: (project) =>
        set((s) => ({
          recentProjects: [
            project,
            ...s.recentProjects.filter((p) => p.id !== project.id),
          ].slice(0, 10), // keep last 10
        })),

      removeRecentProject: (id) =>
        set((s) => ({
          recentProjects: s.recentProjects.filter((p) => p.id !== id),
        })),

      clearRecentProjects: () => set({ recentProjects: [] }),
    }),
    {
      name: 'scriptodd-app',
      // Only persist user-controlled settings, not runtime state
      partialize: (s) => ({
        theme: s.theme,
        recentProjects: s.recentProjects,
      }),
    }
  )
)

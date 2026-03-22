import { create } from 'zustand'
import type { ProjectMeta } from '../types'

interface ProjectState {
  // Active project
  project: ProjectMeta | null
  filePath: string | null
  isModified: boolean
  lastSavedAt: Date | null

  // Autosave
  autosaveEnabled: boolean
  autosaveIntervalMs: number

  // Actions
  setProject: (project: ProjectMeta, filePath?: string) => void
  clearProject: () => void
  markModified: () => void
  markSaved: (filePath: string) => void
  setAutosave: (enabled: boolean, intervalMs?: number) => void

  // Derived helpers
  getDisplayTitle: () => string
}

const DEFAULT_PROJECT: ProjectMeta = {
  id: '',
  title: 'Untitled',
  author: '',
  contact: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  project: null,
  filePath: null,
  isModified: false,
  lastSavedAt: null,
  autosaveEnabled: true,
  autosaveIntervalMs: 60_000, // 1 minute

  setProject: (project, filePath) =>
    set({
      project,
      filePath: filePath ?? null,
      isModified: false,
      lastSavedAt: new Date(),
    }),

  clearProject: () =>
    set({
      project: null,
      filePath: null,
      isModified: false,
      lastSavedAt: null,
    }),

  markModified: () => set({ isModified: true }),

  markSaved: (filePath) =>
    set({ isModified: false, filePath, lastSavedAt: new Date() }),

  setAutosave: (enabled, intervalMs) =>
    set((s) => ({
      autosaveEnabled: enabled,
      autosaveIntervalMs: intervalMs ?? s.autosaveIntervalMs,
    })),

  getDisplayTitle: () => {
    const { project, isModified } = get()
    const title = project?.title || 'Untitled'
    return isModified ? `${title} ●` : title
  },
}))

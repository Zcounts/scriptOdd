// ── View modes ────────────────────────────────────────────────────────────────

export type ViewMode = 'draft' | 'page' | 'board'

export type Theme = 'dark' | 'light'

export type SidebarTab = 'navigator' | 'characters' | 'locations'

export type RightPanelTab = 'notes' | 'outline'

// ── Screenplay element types ──────────────────────────────────────────────────

export type ElementType =
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'note'
  | 'page-break'

// ── Project & document placeholders (will be expanded in Phase 2) ─────────────

export interface RecentProject {
  id: string
  name: string
  filePath: string
  lastOpenedAt: string // ISO date string
}

export interface ProjectMeta {
  id: string
  title: string
  author: string
  contact: string
  createdAt: string
  updatedAt: string
}

export interface Scene {
  id: string
  heading: string
  synopsis: string
  color: string | null
  order: number
  noteIds: string[]
}

export interface Note {
  id: string
  sceneId: string | null // null = project-level note
  content: string
  createdAt: string
  updatedAt: string
}

// ── Layout ────────────────────────────────────────────────────────────────────

export interface LayoutState {
  leftSidebarVisible: boolean
  rightPanelVisible: boolean
  leftSidebarWidth: number
  rightPanelWidth: number
  activeView: ViewMode
  focusMode: boolean
  leftSidebarTab: SidebarTab
  rightPanelTab: RightPanelTab
}

// ── View modes ────────────────────────────────────────────────────────────────

export type ViewMode = 'draft' | 'page' | 'board'

export type Theme = 'dark' | 'light' | 'high-contrast'

export type EditorFontSize = 'sm' | 'md' | 'lg'
export type EditorLineHeight = 'normal' | 'relaxed' | 'spacious'
export type PageSize = 'letter' | 'a4'
export type PageMarginsPreset = 'compact' | 'standard' | 'wide'
export type LayoutPresetName = 'default' | 'writer' | 'focus' | 'research'

export type SidebarTab = 'navigator' | 'characters' | 'locations' | 'props'

// ── Scene status ──────────────────────────────────────────────────────────────

export type SceneStatus = 'not-started' | 'in-progress' | 'needs-revision' | 'complete'

export interface SceneStatusConfig {
  label: string
  color: string
}

export const SCENE_STATUS_CONFIG: Record<SceneStatus, SceneStatusConfig> = {
  'not-started':    { label: 'Not Started',    color: '#ef4444' },
  'in-progress':    { label: 'In Progress',    color: '#f97316' },
  'needs-revision': { label: 'Needs Revision', color: '#eab308' },
  'complete':       { label: 'Complete',        color: '#22c55e' },
}

export type RightPanelTab = 'notes' | 'outline' | 'board'

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

// ── Screenplay document model (Phase 2) ───────────────────────────────────────

/** Metadata stored on a single screenplay block */
export interface BlockMeta {
  /** Stable UUID for this block — survives reordering */
  id: string
  /** Which scene this block belongs to (scene heading id or null) */
  sceneId: string | null
  /** Semantic/editorial tags e.g. 'wip', 'cut', 'important' */
  tags: string[]
  /** IDs of anchored notes/comments attached to this block */
  noteIds: string[]
}

/** Metadata stored on a scene (derived from SceneHeading blocks) */
export interface SceneMeta {
  id: string
  heading: string
  synopsis: string
  color: string | null
  order: number
  noteIds: string[]
  /** Act number (1, 2a, 2b, 3) — for BoardView grouping */
  act?: string
  /** Locked prevents reordering in BoardView */
  locked?: boolean
}

// ── Project & document placeholders ──────────────────────────────────────────

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
  /** Optional custom scene title (e.g. "The Confrontation") */
  title?: string
  /** Production status — drives the color dot/stripe in Navigator and Board */
  status?: SceneStatus
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

/**
 * persistence/format.ts — Phase 7
 *
 * Defines the native `.sodd` project file format and serialization helpers.
 *
 * The format is a single UTF-8 JSON file that captures:
 *   - Project metadata (title, author, contact, draft date)
 *   - Full screenplay content (Tiptap JSONContent)
 *   - Scene metadata (synopsis, color, act grouping, lock state)
 *   - Notes and comments
 *   - Remembered entities and their semantic color assignments
 *   - Layout preferences (panel sizes, active view, tab selections)
 *   - Editor/display settings (font size, page size, etc.)
 */

import type { JSONContent } from '@tiptap/core'
import type { ProjectMeta, Scene, Note } from '../types'

// ── Format version — bump when making breaking changes ────────────────────────
export const SODD_FORMAT_VERSION = 1

// ── Persisted entity state ────────────────────────────────────────────────────

export interface SoddEntities {
  characters: string[]
  locations: string[]
  sceneHeadings: string[]
  transitions: string[]
  props: string[]
  characterColors: Record<string, number>
  locationColors: Record<string, number>
  propColors: Record<string, number>
}

// ── Persisted layout state ────────────────────────────────────────────────────

export interface SoddLayout {
  leftSidebarVisible: boolean
  rightPanelVisible: boolean
  leftSidebarSize: number
  rightPanelSize: number
  activeView: string
  leftSidebarTab: string
  rightPanelTab: string
  layoutPreset: string
}

// ── Persisted settings ────────────────────────────────────────────────────────

export interface SoddSettings {
  semanticHighlight: boolean
  highlightIntensity: string
  highlightStyle: string
  editorFontSize: string
  editorLineHeight: string
  pageSize: string
  pageMarginsPreset: string
  showPageChrome: boolean
  theme: string
}

// ── Top-level file structure ──────────────────────────────────────────────────

export interface SoddProjectFile {
  version: number
  savedAt: string
  meta: ProjectMeta
  editorContent: JSONContent
  scenes: Scene[]
  notes: Note[]
  entities: SoddEntities
  layout: SoddLayout
  settings: SoddSettings
}

// ── Serialization ─────────────────────────────────────────────────────────────

export function serializeProject(
  meta: ProjectMeta,
  editorContent: JSONContent,
  scenes: Scene[],
  notes: Note[],
  entities: SoddEntities,
  layout: SoddLayout,
  settings: SoddSettings,
): string {
  const file: SoddProjectFile = {
    version: SODD_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    meta: { ...meta, updatedAt: new Date().toISOString() },
    editorContent,
    scenes,
    notes,
    entities,
    layout,
    settings,
  }
  return JSON.stringify(file, null, 2)
}

// ── Deserialization ───────────────────────────────────────────────────────────

export interface DeserializeResult {
  ok: boolean
  file?: SoddProjectFile
  error?: string
}

export function deserializeProject(raw: string): DeserializeResult {
  try {
    const parsed = JSON.parse(raw) as unknown

    // Basic structural validation
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'File is not a valid JSON object' }
    }

    const f = parsed as Record<string, unknown>

    if (typeof f['version'] !== 'number') {
      return { ok: false, error: 'Missing or invalid version field' }
    }
    if (f['version'] > SODD_FORMAT_VERSION) {
      return { ok: false, error: `File was created with a newer version of scriptOdd (v${f['version']})` }
    }
    if (!f['meta'] || typeof f['meta'] !== 'object') {
      return { ok: false, error: 'Missing project metadata' }
    }
    if (!f['editorContent'] || typeof f['editorContent'] !== 'object') {
      return { ok: false, error: 'Missing editor content' }
    }

    return { ok: true, file: (f as unknown) as SoddProjectFile }
  } catch (err) {
    return { ok: false, error: `Parse error: ${String(err)}` }
  }
}

// ── Default empty project ─────────────────────────────────────────────────────

export function makeDefaultMeta(title = 'Untitled'): ProjectMeta {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    author: '',
    contact: '',
    createdAt: now,
    updatedAt: now,
  }
}

/** Minimal valid Tiptap doc with a single empty scene heading */
export function makeEmptyEditorContent(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: {
          id: crypto.randomUUID(),
          sceneId: crypto.randomUUID(),
          tags: [],
          noteIds: [],
        },
      },
    ],
  }
}

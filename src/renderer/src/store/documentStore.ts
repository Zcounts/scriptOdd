import { create } from 'zustand'
import type { JSONContent } from '@tiptap/core'
import type { Scene, Note } from '../types'

/**
 * Document store — Phase 2.
 *
 * Holds the screenplay document's live Tiptap JSON, derived stats,
 * and the scene/note lists used by the sidebar and right panel.
 */
interface DocumentState {
  // ── Editor content ─────────────────────────────────────────────────────────
  /** Serialised Tiptap/ProseMirror JSON — source of truth for the document */
  editorContent: JSONContent | null

  // ── Scene list (derived, kept in sync by ScreenplayEditorProvider) ─────────
  scenes: Scene[]
  activeSceneId: string | null

  // ── Stats (derived on every editor update) ─────────────────────────────────
  wordCount: number
  pageCount: number
  sceneCount: number

  // ── Cursor state ───────────────────────────────────────────────────────────
  cursorLine: number
  cursorColumn: number

  // ── Notes ──────────────────────────────────────────────────────────────────
  notes: Note[]

  // ── Actions ────────────────────────────────────────────────────────────────
  setEditorContent: (content: JSONContent) => void
  setActiveScene: (id: string | null) => void
  setStats: (stats: { wordCount?: number; pageCount?: number; sceneCount?: number }) => void
  setCursor: (line: number, column: number) => void

  /** Bulk-initialise scenes (called on editor create with seed data) */
  initScenes: (scenes: Scene[]) => void
  addScene: (scene: Scene) => void
  removeScene: (id: string) => void
  reorderScenes: (orderedIds: string[]) => void

  addNote: (note: Note) => void
  removeNote: (id: string) => void
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  editorContent: null,
  scenes: [],
  activeSceneId: null,
  wordCount: 0,
  pageCount: 1,
  sceneCount: 0,
  cursorLine: 1,
  cursorColumn: 1,
  notes: [],

  setEditorContent: (editorContent) => set({ editorContent }),

  setActiveScene: (activeSceneId) => set({ activeSceneId }),

  setStats: (stats) =>
    set((s) => ({
      wordCount: stats.wordCount ?? s.wordCount,
      pageCount: stats.pageCount ?? s.pageCount,
      sceneCount: stats.sceneCount ?? s.sceneCount,
    })),

  setCursor: (cursorLine, cursorColumn) => set({ cursorLine, cursorColumn }),

  initScenes: (scenes) => set({ scenes, sceneCount: scenes.length }),

  addScene: (scene) =>
    set((s) => ({ scenes: [...s.scenes, scene], sceneCount: s.scenes.length + 1 })),

  removeScene: (id) =>
    set((s) => {
      const scenes = s.scenes.filter((sc) => sc.id !== id)
      return { scenes, sceneCount: scenes.length }
    }),

  reorderScenes: (orderedIds) =>
    set((s) => {
      const map = new Map(s.scenes.map((sc) => [sc.id, sc]))
      const scenes = orderedIds
        .map((id, i) => {
          const sc = map.get(id)
          return sc ? { ...sc, order: i } : null
        })
        .filter(Boolean) as Scene[]
      return { scenes }
    }),

  addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),

  removeNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}))

/**
 * ScreenplayEditorProvider — Phase 4
 *
 * Creates and manages the singleton Tiptap editor instance.
 * Mounted at the App level so the editor state survives view switches.
 *
 * Phase 4 additions:
 *   - Scene list is re-derived from editor JSON on every update (handleUpdate)
 *   - Selection updates track which scene the cursor is in (onSelectionUpdate)
 *   - jumpToSceneById is exported via a context accessor
 *
 * Usage:
 *   - Wrap <AppShell> with <ScreenplayEditorProvider>
 *   - Access editor via useScreenplayEditor() anywhere in the tree
 */

import React, { createContext, useContext, useCallback } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor, JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { SCREENPLAY_NODES } from './nodes'
import { ScreenplayKeyboardExtension } from './ScreenplayKeyboardExtension'
import { ScreenplayAutoFormatExtension } from './ScreenplayAutoFormatExtension'
import { seedContent, SEED_SCENES } from './seedContent'
import { deriveScenes, activeSceneAtPos } from './sceneUtils'
import { useDocumentStore } from '../store/documentStore'

// ── Context ───────────────────────────────────────────────────────────────────

const ScreenplayEditorContext = createContext<Editor | null>(null)

export function useScreenplayEditor(): Editor | null {
  return useContext(ScreenplayEditorContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ScreenplayEditorProviderProps {
  children: React.ReactNode
}

export function ScreenplayEditorProvider({ children }: ScreenplayEditorProviderProps): React.JSX.Element {
  const { setEditorContent, setStats, initScenes, setActiveScene, setCursor } = useDocumentStore()

  // ── Called on every document change ────────────────────────────────────────
  const handleUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const json = ed.getJSON()
      setEditorContent(json)

      // Re-derive scene list, preserving synopsis / color / noteIds
      const currentScenes = useDocumentStore.getState().scenes
      const scenes = deriveScenes(json, currentScenes)
      initScenes(scenes)

      // Live stats
      const text = ed.getText()
      const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
      const blockCount = json.content?.length ?? 0
      const pageCount = Math.max(1, Math.ceil(blockCount / 22))
      setStats({ wordCount, pageCount, sceneCount: scenes.length })
    },
    [setEditorContent, setStats, initScenes],
  )

  // ── Called on every cursor / selection change ───────────────────────────────
  const handleSelectionUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const cursorPos = ed.state.selection.$anchor.pos
      setActiveScene(activeSceneAtPos(ed, cursorPos))
      setCursor(cursorPos, ed.state.selection.$anchor.parentOffset)
    },
    [setActiveScene, setCursor],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: false,
        bold: false,
        italic: false,
        strike: false,
      }),
      ...SCREENPLAY_NODES,
      ScreenplayKeyboardExtension,
      ScreenplayAutoFormatExtension,
    ],
    content: seedContent,
    autofocus: 'end',
    onUpdate: handleUpdate,
    onSelectionUpdate: handleSelectionUpdate,
    onCreate: ({ editor: ed }) => {
      const json = ed.getJSON()

      // Derive initial scene list from editor JSON, patching in seed synopses by position
      const rawScenes = deriveScenes(json, [])
      const scenes = rawScenes.map((s, i) => ({
        ...s,
        synopsis: SEED_SCENES[i]?.synopsis ?? s.synopsis,
      }))
      initScenes(scenes)

      // Initial stats
      const text = ed.getText()
      const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
      const blockCount = json.content?.length ?? 0
      setEditorContent(json)
      setStats({ wordCount, sceneCount: scenes.length, pageCount: Math.max(1, Math.ceil(blockCount / 22)) })
    },
  })

  return (
    <ScreenplayEditorContext.Provider value={editor}>
      {children}
    </ScreenplayEditorContext.Provider>
  )
}

// ── Re-exported helpers ───────────────────────────────────────────────────────

/** Returns the current active screenplay block type name, or null */
export function getActiveBlockType(editor: Editor): string | null {
  const TYPES = ['sceneHeading', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'note']
  for (const t of TYPES) {
    if (editor.isActive(t)) return t
  }
  return null
}

/** Helper: extract all text content from a JSONContent node */
export function extractText(node: JSONContent): string {
  if (node.text) return node.text
  if (node.content) return node.content.map(extractText).join('')
  return ''
}

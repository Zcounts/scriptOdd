/**
 * ScreenplayEditorProvider — Phase 2
 *
 * Creates and manages the singleton Tiptap editor instance.
 * Mounted at the App level so the editor state survives view switches
 * (Draft ↔ Page ↔ Board) without losing the document.
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
  const { setEditorContent, setStats, initScenes } = useDocumentStore()

  const handleUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const json = ed.getJSON()
      setEditorContent(json)

      // Derive live stats from document
      const text = ed.getText()
      const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
      const sceneCount = json.content?.filter((n) => n.type === 'sceneHeading').length ?? 0
      // Rough page estimate: ~55 lines per page, each block ≈ 1–3 lines
      const blockCount = json.content?.length ?? 0
      const pageCount = Math.max(1, Math.ceil(blockCount / 22))
      setStats({ wordCount, pageCount, sceneCount })
    },
    [setEditorContent, setStats],
  )

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // Keep: document, text, history, gapcursor, dropcursor
          // Disable all default block/mark types — screenplay uses custom nodes only
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
        // Phase 3 — smart keyboard flow + auto-formatting
        ScreenplayKeyboardExtension,
        ScreenplayAutoFormatExtension,
      ],
      content: seedContent,
      autofocus: 'end',
      onUpdate: handleUpdate,
      onCreate: ({ editor: ed }) => {
        // Populate the scene list from seed content on first load
        initScenes(SEED_SCENES.map((s, i) => ({
          id: s.id,
          heading: s.heading,
          synopsis: s.synopsis,
          color: null,
          order: i,
          noteIds: [],
        })))

        // Fire initial stats
        const json = ed.getJSON()
        const text = ed.getText()
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
        const sceneCount = json.content?.filter((n) => n.type === 'sceneHeading').length ?? 0
        const blockCount = json.content?.length ?? 0
        setEditorContent(json)
        setStats({ wordCount, sceneCount, pageCount: Math.max(1, Math.ceil(blockCount / 22)) })
      },
    },
  )

  return (
    <ScreenplayEditorContext.Provider value={editor}>
      {children}
    </ScreenplayEditorContext.Provider>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

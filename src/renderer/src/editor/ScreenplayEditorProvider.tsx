/**
 * ScreenplayEditorProvider — Phase 5
 *
 * Creates and manages the singleton Tiptap editor instance.
 * Mounted at the App level so the editor state survives view switches.
 *
 * Phase 5 additions:
 *   - Entity extraction: character names auto-learned from character blocks;
 *     locations + full headings auto-learned from sceneHeading blocks.
 *   - After each extraction pass, dispatches a SEM_REBUILD_META transaction so
 *     the SemanticHighlightExtension rebuilds its decorations with fresh colors.
 *   - SemanticHighlightExtension added to the editor extension list.
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
import { SemanticHighlightExtension, SEM_REBUILD_META, parseLocationFromHeading } from './SemanticHighlightExtension'
import { seedContent, SEED_SCENES } from './seedContent'
import { deriveScenes, activeSceneAtPos } from './sceneUtils'
import { useDocumentStore } from '../store/documentStore'
import { useAutocompleteStore } from '../store/autocompleteStore'

// ── Context ───────────────────────────────────────────────────────────────────

const ScreenplayEditorContext = createContext<Editor | null>(null)

export function useScreenplayEditor(): Editor | null {
  return useContext(ScreenplayEditorContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ScreenplayEditorProviderProps {
  children: React.ReactNode
}

/** Strip annotation suffixes like (V.O.), (O.S.), (CONT'D) from character names */
function cleanCharacterName(raw: string): string {
  return raw.replace(/\s*\([^)]*\)\s*/g, '').trim()
}

/** Extract and remember all entities found in the document JSON */
function extractEntities(json: JSONContent): void {
  const { addCharacter, addLocation, addSceneHeading } = useAutocompleteStore.getState()

  for (const block of json.content ?? []) {
    if (block.type === 'character') {
      const text = (block.content ?? []).map((n) => n.text ?? '').join('').trim()
      const name = cleanCharacterName(text)
      if (name) addCharacter(name)
    } else if (block.type === 'sceneHeading') {
      const heading = (block.content ?? []).map((n) => n.text ?? '').join('').trim()
      if (heading) {
        addSceneHeading(heading)
        const location = parseLocationFromHeading(heading)
        if (location) addLocation(location)
      }
    }
  }
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

      // Auto-learn entities from the updated document
      extractEntities(json)

      // Signal the semantic highlight plugin to rebuild decorations
      // (needed because entity color maps may have changed)
      ed.view.dispatch(ed.state.tr.setMeta(SEM_REBUILD_META, true))

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
      SemanticHighlightExtension,
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

      // Seed entity memory from the initial content
      extractEntities(json)

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

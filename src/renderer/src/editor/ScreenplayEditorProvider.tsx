/**
 * ScreenplayEditorProvider — Phase 7
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
 * Phase 7 additions:
 *   - pendingLoad: editor watches documentStore.pendingLoad; when set, calls
 *     editor.commands.setContent() and clears the flag.  This is how project
 *     open / Fountain import / crash recovery hydrates the editor.
 *   - markModified: each document change marks the project store as modified.
 *   - Autosave timer: saves every autosaveIntervalMs if autosaveEnabled.
 *
 * Usage:
 *   - Wrap <AppShell> with <ScreenplayEditorProvider>
 *   - Access editor via useScreenplayEditor() anywhere in the tree
 */

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor, JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { SCREENPLAY_NODES } from './nodes'
import { ScreenplayKeyboardExtension } from './ScreenplayKeyboardExtension'
import { ScreenplayAutoFormatExtension } from './ScreenplayAutoFormatExtension'
import { SemanticHighlightExtension, SEM_REBUILD_META, parseLocationFromHeading } from './SemanticHighlightExtension'
import { SceneNumberExtension } from './SceneNumberExtension'
import { CommentHighlightMark } from './CommentHighlightExtension'
import { seedContent, SEED_SCENES } from './seedContent'
import { deriveScenes, activeSceneAtPos } from './sceneUtils'
import { useDocumentStore } from '../store/documentStore'
import { useAutocompleteStore } from '../store/autocompleteStore'
import { useProjectStore } from '../store/projectStore'

// ── Context ───────────────────────────────────────────────────────────────────

const ScreenplayEditorContext = createContext<Editor | null>(null)

export function useScreenplayEditor(): Editor | null {
  return useContext(ScreenplayEditorContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ScreenplayEditorProviderProps {
  children: React.ReactNode
  onAutosave?: () => Promise<void>
}

/** Strip annotation suffixes like (V.O.), (O.S.), (CONT'D) from character names */
function cleanCharacterName(raw: string): string {
  return raw.replace(/\s*\([^)]*\)\s*/g, '').trim()
}

/** Extract and remember all entities found in the document JSON */
function extractEntities(json: JSONContent): void {
  const { addCharacter, addLocation, addSceneHeading } = useAutocompleteStore.getState()
  const blocks = json.content ?? []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type === 'character') {
      // Only commit the name when the cue is followed by dialogue or parenthetical,
      // i.e. the user pressed Enter and left the character block — not on every keystroke.
      const next = blocks[i + 1]
      if (next?.type === 'dialogue' || next?.type === 'parenthetical') {
        const text = (block.content ?? []).map((n) => n.text ?? '').join('').trim()
        const name = cleanCharacterName(text)
        if (name) addCharacter(name)
      }
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

export function ScreenplayEditorProvider({ children, onAutosave }: ScreenplayEditorProviderProps): React.JSX.Element {
  const { setEditorContent, setStats, initScenes, setActiveScene, setCursor, setSelectionText } = useDocumentStore()
  const autosaveRef = useRef(onAutosave)
  autosaveRef.current = onAutosave

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
      ed.view.dispatch(ed.state.tr.setMeta(SEM_REBUILD_META, true))

      // Live stats
      const text = ed.getText()
      const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
      const blockCount = json.content?.length ?? 0
      const pageCount = Math.max(1, Math.ceil(blockCount / 22))
      setStats({ wordCount, pageCount, sceneCount: scenes.length })

      // Mark project as modified (Phase 7)
      useProjectStore.getState().markModified()
    },
    [setEditorContent, setStats, initScenes],
  )

  // ── Called on every cursor / selection change ───────────────────────────────
  const handleSelectionUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const cursorPos = ed.state.selection.$anchor.pos
      setActiveScene(activeSceneAtPos(ed, cursorPos))
      setCursor(cursorPos, ed.state.selection.$anchor.parentOffset)

      // Track the selected text so RightPanel can show a "comment on selection" button
      const { from, to } = ed.state.selection
      const selected = from < to ? ed.state.doc.textBetween(from, to, ' ') : null
      setSelectionText(selected && selected.trim() ? selected.trim() : null)
    },
    [setActiveScene, setCursor, setSelectionText],
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
      SceneNumberExtension,
      CommentHighlightMark,
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

  // ── pendingLoad: hydrate editor from project open / crash recovery ──────────
  const pendingLoad = useDocumentStore((s) => s.pendingLoad)

  useEffect(() => {
    if (!editor || !pendingLoad) return

    // Apply content (this triggers onUpdate which re-derives scenes + entities)
    editor.commands.setContent(pendingLoad)

    // Clear the pending flag
    useDocumentStore.getState().setPendingLoad(null)

    // After loading a project the content is clean (only mark saved if we have a path)
    const fp = useProjectStore.getState().filePath
    if (fp) useProjectStore.getState().markSaved(fp)
  }, [editor, pendingLoad])

  // ── Autosave timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const getConfig = () => {
      const { autosaveEnabled, autosaveIntervalMs } = useProjectStore.getState()
      return { autosaveEnabled, autosaveIntervalMs }
    }

    const runAutosave = () => {
      autosaveRef.current?.().catch((e) => console.error('[autosave]', e))
    }

    const { autosaveEnabled, autosaveIntervalMs } = getConfig()
    if (!autosaveEnabled) return

    const id = setInterval(runAutosave, autosaveIntervalMs)
    return () => clearInterval(id)
  }, []) // runs once; timer reads current store state on each tick

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

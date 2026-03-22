/**
 * sceneUtils — Phase 4
 *
 * Utilities for scene extraction, navigation, and document reordering.
 * Shared between ScreenplayEditorProvider, LeftSidebar, and BoardView.
 *
 * Scene ID strategy:
 *   - Seed content: sceneHeading.attrs.sceneId = 'scene-1' etc. → used as scene ID
 *   - User-created headings: attrs.sceneId = null → fall back to attrs.id
 *
 * This keeps backward compatibility with seed data while supporting new scenes.
 */

import type { Editor, JSONContent } from '@tiptap/core'
import type { Scene } from '../types'

// ── Text extraction ───────────────────────────────────────────────────────────

/** Recursively extract all text content from a JSONContent node. */
export function extractText(node: JSONContent): string {
  if (node.text) return node.text
  if (node.content) return node.content.map(extractText).join('')
  return ''
}

// ── Scene ID resolution ───────────────────────────────────────────────────────

/**
 * Canonical scene ID from a sceneHeading block's attrs.
 * Prefers attrs.sceneId (seed data), falls back to attrs.id (new headings).
 */
export function sceneIdFromAttrs(attrs: Record<string, unknown> | undefined): string | null {
  if (!attrs) return null
  const sid = attrs.sceneId as string | null
  if (sid) return sid
  const id = attrs.id as string | undefined
  return id || null
}

// ── Scene derivation ──────────────────────────────────────────────────────────

/**
 * Derive an ordered Scene[] from Tiptap JSON, preserving synopsis/color/noteIds
 * from the provided existingScenes map (keyed by scene ID).
 */
export function deriveScenes(json: JSONContent, existingScenes: Scene[]): Scene[] {
  const blocks = json.content ?? []
  const existingMap = new Map(existingScenes.map((s) => [s.id, s]))
  const scenes: Scene[] = []
  let order = 0

  for (const block of blocks) {
    if (block.type === 'sceneHeading') {
      const id = sceneIdFromAttrs(block.attrs as Record<string, unknown>)
      if (!id) continue
      const heading = extractText(block)
      const existing = existingMap.get(id)
      scenes.push({
        id,
        heading,
        synopsis: existing?.synopsis ?? '',
        color: existing?.color ?? null,
        order: order++,
        noteIds: existing?.noteIds ?? [],
      })
    }
  }

  return scenes
}

// ── Jump to scene ─────────────────────────────────────────────────────────────

/**
 * Focus the editor and scroll to the sceneHeading with the given scene ID.
 * Matches attrs.sceneId first, then attrs.id as fallback.
 */
export function jumpToSceneById(editor: Editor, sceneId: string): void {
  let targetPos: number | null = null

  editor.state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false
    if (node.type.name === 'sceneHeading') {
      const nodeId = sceneIdFromAttrs(node.attrs as Record<string, unknown>)
      if (nodeId === sceneId) {
        targetPos = pos
        return false
      }
    }
    return undefined
  })

  if (targetPos !== null) {
    editor.chain().focus().setTextSelection(targetPos + 1).scrollIntoView().run()
  }
}

// ── Document reorder ──────────────────────────────────────────────────────────

/**
 * Reorder scenes in the editor document by rearranging scene block groups.
 *
 * Each "group" is a sceneHeading block followed by all blocks until the next
 * sceneHeading. Groups are rebuilt in the order specified by orderedIds.
 * Any blocks before the first scene heading are preserved at the top.
 *
 * Triggers onUpdate so the scene store stays in sync.
 */
export function reorderScenesInEditor(editor: Editor, orderedIds: string[]): void {
  const json = editor.getJSON()
  const blocks = json.content ?? []

  // Build a map: sceneId → [sceneHeading, ...rest of scene blocks]
  const groups = new Map<string, JSONContent[]>()
  const prefix: JSONContent[] = [] // blocks before first scene heading
  let currentId: string | null = null

  for (const block of blocks) {
    if (block.type === 'sceneHeading') {
      const id = sceneIdFromAttrs(block.attrs as Record<string, unknown>)
      currentId = id
      if (id) {
        groups.set(id, [block])
      } else {
        prefix.push(block) // heading with no resolvable ID
      }
    } else if (currentId !== null && groups.has(currentId)) {
      groups.get(currentId)!.push(block)
    } else {
      prefix.push(block)
    }
  }

  // Reconstruct document in new order
  const reordered: JSONContent[] = [...prefix]
  for (const id of orderedIds) {
    const group = groups.get(id)
    if (group) reordered.push(...group)
  }

  // setContent triggers onUpdate → handleUpdate → deriveScenes → store sync
  editor.commands.setContent({ type: 'doc', content: reordered })
}

// ── Active scene detection ────────────────────────────────────────────────────

/**
 * Return the scene ID of the scene heading at or immediately before the
 * given cursor position in the document.
 */
export function activeSceneAtPos(editor: Editor, cursorPos: number): string | null {
  let activeId: string | null = null

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'sceneHeading' && pos <= cursorPos) {
      activeId = sceneIdFromAttrs(node.attrs as Record<string, unknown>)
    }
  })

  return activeId
}

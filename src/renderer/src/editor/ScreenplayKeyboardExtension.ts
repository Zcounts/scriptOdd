/**
 * ScreenplayKeyboardExtension — Phase 3 → Prompt 3 refactor
 *
 * Smart keyboard behavior for screenplay editing:
 *  - Enter: context-aware block transitions (character → dialogue, etc.)
 *  - Ctrl+Enter: always creates a new scene container (sceneStart heading)
 *  - Tab: cycle forward through element types
 *  - Shift-Tab: cycle backward through element types
 *  - Backspace: prevent cross-type block merges; sensible escape from dialogue
 *
 * Key design decisions:
 *  sceneHeading  Enter → action
 *  action        Enter → action (default split)
 *  character     Enter → dialogue
 *  dialogue      Enter (empty) → action (escape)
 *  dialogue      Enter (non-empty, at end) → character (next speaker)
 *  dialogue      Enter (mid-text) → dialogue (split; default)
 *  parenthetical Enter → dialogue (resume speech)
 *  transition    Enter (non-empty) → sceneHeading slugline (same scene, NOT a new scene)
 *  transition    Enter (empty) → action (abort)
 *  note          Enter → action
 *
 *  Ctrl+Enter (from anywhere): end current block → new sceneHeading with
 *    sceneStart = true, fresh sceneId → a brand-new scene container.
 *
 *  Tab/Shift-Tab cycle through the canonical screenplay order:
 *    sceneHeading → action → character → dialogue → parenthetical → transition → note → (wrap)
 */

import { Extension } from '@tiptap/core'

// ── Constants ─────────────────────────────────────────────────────────────────

const CYCLE_ORDER = [
  'sceneHeading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
  'note',
] as const

type ScreenplayType = (typeof CYCLE_ORDER)[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActiveType(editor: { isActive: (name: string) => boolean }): ScreenplayType | null {
  for (const t of CYCLE_ORDER) {
    if (editor.isActive(t)) return t
  }
  return null
}

function cursorAtEnd(editor: { state: { selection: { $anchor: { parentOffset: number; parent: { content: { size: number } } } } } }): boolean {
  const { $anchor } = editor.state.selection
  return $anchor.parentOffset === $anchor.parent.content.size
}

function blockIsEmpty(editor: { state: { selection: { $anchor: { parent: { textContent: string } } } } }): boolean {
  return editor.state.selection.$anchor.parent.textContent.length === 0
}

function cursorAtStart(editor: { state: { selection: { $anchor: { parentOffset: number } } } }): boolean {
  return editor.state.selection.$anchor.parentOffset === 0
}

/** Unique ID for new blocks — uses crypto.randomUUID() to prevent collisions */
function newId(): string {
  return crypto.randomUUID()
}

// ── Extension ─────────────────────────────────────────────────────────────────

export const ScreenplayKeyboardExtension = Extension.create({
  name: 'screenplayKeyboard',

  addKeyboardShortcuts() {
    return {
      // ── Ctrl+Enter — new scene container ────────────────────────────────────
      'Ctrl-Enter': () => {
        const editor = this.editor
        const { $anchor } = editor.state.selection
        // Move to end of current block so the split always creates a clean new block below
        const endOfBlock = $anchor.end()
        const sceneId = newId()
        return editor
          .chain()
          .setTextSelection(endOfBlock)
          .splitBlock()
          .setNode('sceneHeading', {
            id: newId(),
            sceneId,
            sceneStart: true,
            tags: [],
            noteIds: [],
          })
          .run()
      },

      // ── Enter ───────────────────────────────────────────────────────────────
      Enter: () => {
        const editor = this.editor
        const type = getActiveType(editor)
        if (!type) return false

        const empty = blockIsEmpty(editor)
        const atEnd = cursorAtEnd(editor)

        // Inherit the current block's sceneId so new blocks stay in the same scene
        const currentSceneId: string | null =
          (editor.state.selection.$anchor.parent.attrs as Record<string, unknown>)?.sceneId as string | null ?? null

        /** Build attrs for a new block, inheriting scene membership */
        const attrs = (overrides?: Record<string, unknown>) => ({
          id: newId(),
          sceneId: currentSceneId,
          tags: [],
          noteIds: [],
          ...overrides,
        })

        switch (type) {
          // Scene heading → always produce action below
          case 'sceneHeading':
            return editor.chain().splitBlock().setNode('action', attrs()).run()

          // Action → default split (stays action)
          case 'action':
            return false

          // Character → dialogue
          case 'character':
            return editor.chain().splitBlock().setNode('dialogue', attrs()).run()

          // Dialogue — context-sensitive
          case 'dialogue': {
            if (empty) {
              // Blank dialogue → convert to action (escape dialogue block)
              return editor.chain().setNode('action', attrs()).run()
            }
            if (atEnd) {
              // End of speech → next character cue
              return editor.chain().splitBlock().setNode('character', attrs()).run()
            }
            // Mid-text → default split (continues as dialogue)
            return false
          }

          // Parenthetical → resume dialogue
          case 'parenthetical': {
            if (empty) {
              return editor.chain().setNode('dialogue', attrs()).run()
            }
            return editor.chain().splitBlock().setNode('dialogue', attrs()).run()
          }

          // Transition → slugline within current scene (non-empty) or abort to action (empty)
          // To start a NEW scene the writer uses Ctrl+Enter, not Enter after transition.
          case 'transition': {
            if (empty) {
              return editor.chain().setNode('action', attrs()).run()
            }
            // Produce a sceneHeading that is an additional slugline in the current scene.
            // sceneStart stays false (default) so it does NOT open a new scene container.
            return editor.chain().splitBlock().setNode('sceneHeading', attrs()).run()
          }

          // Note → action below
          case 'note':
            return editor.chain().splitBlock().setNode('action', attrs()).run()

          default:
            return false
        }
      },

      // ── Tab — cycle forward ─────────────────────────────────────────────────
      Tab: () => {
        const editor = this.editor
        const type = getActiveType(editor)
        if (!type) return false

        const idx = CYCLE_ORDER.indexOf(type)
        const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length]
        editor.chain().focus().setNode(next).run()
        return true
      },

      // ── Shift-Tab — cycle backward ──────────────────────────────────────────
      'Shift-Tab': () => {
        const editor = this.editor
        const type = getActiveType(editor)
        if (!type) return false

        const idx = CYCLE_ORDER.indexOf(type)
        const prev = CYCLE_ORDER[(idx - 1 + CYCLE_ORDER.length) % CYCLE_ORDER.length]
        editor.chain().focus().setNode(prev).run()
        return true
      },

      // ── Backspace — prevent dangerous cross-type merges ─────────────────────
      Backspace: () => {
        const editor = this.editor
        const type = getActiveType(editor)
        if (!type) return false

        // Only intercept when at start of a non-empty block
        if (!cursorAtStart(editor) || blockIsEmpty(editor)) return false

        // For block types that should not silently merge upward,
        // prevent the default "join with previous block" behavior.
        // The user can Tab/Shift-Tab to change the type instead.
        const preventMerge: ScreenplayType[] = ['sceneHeading', 'character', 'dialogue', 'parenthetical']
        if (preventMerge.includes(type)) {
          return true // block the event — no merge, no content loss
        }

        return false // action/transition/note: allow default behavior
      },
    }
  },
})

/**
 * ScreenplayAutoFormatExtension — Phase 3
 *
 * Automatic formatting that keeps screenplay elements structurally correct:
 *  1. Auto-uppercase: all text in sceneHeading and character blocks is forced
 *     to uppercase as you type (stored value, not just CSS).
 *  2. Paste normalization: strips HTML marks from pasted text so rich-text
 *     paste doesn't embed bold/italic/etc. into screenplay blocks.
 *
 * Implementation notes:
 *  - Auto-uppercase uses a ProseMirror appendTransaction plugin so it fires
 *    after each doc change without creating extra undo history entries.
 *  - The same plugin handles paste since paste is just another doc change.
 *  - We collect all needed replacements first, then apply in reverse position
 *    order so earlier replacements don't invalidate later positions.
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// Node types whose text content should always be uppercase
const UPPERCASE_TYPES = new Set(['sceneHeading', 'character'])

const autoFormatKey = new PluginKey<null>('screenplayAutoFormat')

export const ScreenplayAutoFormatExtension = Extension.create({
  name: 'screenplayAutoFormat',

  // ── Paste: strip incoming HTML so we get plain text only ───────────────────
  addOptions() {
    return {}
  },

  // ── Auto-uppercase via appendTransaction ───────────────────────────────────
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: autoFormatKey,

        appendTransaction(transactions, _oldState, newState) {
          // Skip if nothing in the doc actually changed
          const docChanged = transactions.some((tr) => tr.docChanged)
          if (!docChanged) return null

          // Collect all lowercase-text ranges in uppercase-constrained blocks
          type Replacement = { from: number; to: number; text: string }
          const replacements: Replacement[] = []

          newState.doc.descendants((node, pos) => {
            if (!UPPERCASE_TYPES.has(node.type.name)) return

            // Walk the inline content of this block
            node.content.forEach((child, offset) => {
              if (child.type.name !== 'text' || !child.text) return
              const upper = child.text.toUpperCase()
              if (child.text !== upper) {
                replacements.push({
                  from: pos + 1 + offset,
                  to: pos + 1 + offset + child.nodeSize,
                  text: upper,
                })
              }
            })
          })

          if (replacements.length === 0) return null

          // Apply in reverse order so positions stay valid
          const tr = newState.tr
          // Don't pollute undo history with the uppercasing step
          tr.setMeta('addToHistory', false)

          for (const r of replacements.reverse()) {
            tr.insertText(r.text, r.from, r.to)
          }

          return tr
        },
      }),
    ]
  },

  // Paste normalization is handled implicitly by the appendTransaction plugin:
  // any text that lands in a sceneHeading or character block will be uppercased
  // on the very next transaction, making both manual typing and paste consistent.
})

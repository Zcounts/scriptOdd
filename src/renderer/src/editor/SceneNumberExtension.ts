/**
 * SceneNumberExtension — paginated draft view
 *
 * ProseMirror plugin that:
 *   1. Calculates real page breaks by counting estimated lines per block
 *      (same algorithm as PageView.tsx — 55 lines per page).
 *   2. Inserts a .draft-page-sep widget at every page-overflow boundary so
 *      the draft view shows discrete visual sheets as the user types.
 *   3. Decorates each scene-start heading with a left-margin scene number
 *      badge and a `scene-start` CSS class for relative positioning.
 *
 * Line estimation (Courier New 12pt, single-spaced):
 *   Scene heading / Action : ceil(chars / 60) + 1 blank line after
 *   Character              : 1
 *   Dialogue               : ceil(chars / 35)
 *   Parenthetical          : 1
 *   Transition             : 2
 *   Note                   : 0  (not printed)
 *   Other                  : 1
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet, Decoration } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const sceneNumberKey = new PluginKey<DecorationSet>('sceneNumbers')

// ── Line-count constants (must match PageView.tsx) ────────────────────────────

const LINES_PER_PAGE     = 55
const CHARS_PER_DIALOGUE = 35
const CHARS_PER_WIDE     = 60

function estimateBlockLines(node: ProseMirrorNode): number {
  const chars = node.textContent.length
  switch (node.type.name) {
    case 'sceneHeading':  return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE)) + 1
    case 'action':        return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE)) + 1
    case 'character':     return 1
    case 'dialogue':      return Math.max(1, Math.ceil(chars / CHARS_PER_DIALOGUE))
    case 'parenthetical': return 1
    case 'transition':    return 2
    case 'note':          return 0
    default:              return 1
  }
}

// ── Decoration builder ────────────────────────────────────────────────────────

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []
  let sceneNum  = 0
  let lineCount = 0
  let pageNum   = 1

  // doc.content.forEach gives (child, offset) where offset == document position
  // of the child (because the doc root has no opening bracket in the position model).
  doc.content.forEach((node, offset) => {
    const pos        = offset
    const blockLines = estimateBlockLines(node)

    // ── Page break ───────────────────────────────────────────────────────────
    // If adding this block would overflow the current page, insert a separator
    // BEFORE it and start a new page counter.
    if (lineCount + blockLines > LINES_PER_PAGE && lineCount > 0) {
      pageNum++
      lineCount = 0

      const sep = document.createElement('div')
      sep.className = 'draft-page-sep'
      sep.setAttribute('data-page', String(pageNum))
      sep.setAttribute('contenteditable', 'false')
      sep.setAttribute('aria-hidden', 'true')

      decorations.push(
        Decoration.widget(pos, sep, { side: -1, key: `page-sep-${pageNum}-${pos}` }),
      )
    }

    lineCount += blockLines

    // ── Scene number + start decoration ──────────────────────────────────────
    if (node.type.name === 'sceneHeading' && node.attrs.sceneStart) {
      sceneNum++
      const num = sceneNum

      // CSS class for relative positioning anchor (gutter widget needs this)
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, { class: 'scene-start' }),
      )

      // Left-margin scene number badge
      const badge = document.createElement('span')
      badge.className = 'scene-number-gutter'
      badge.textContent = String(num)
      badge.setAttribute('contenteditable', 'false')

      decorations.push(
        Decoration.widget(pos + 1, badge, { side: -1, key: `scene-num-${num}` }),
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

// ── Extension ─────────────────────────────────────────────────────────────────

export const SceneNumberExtension = Extension.create({
  name: 'sceneNumbers',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: sceneNumberKey,

        state: {
          init(_config, state) {
            return buildDecorations(state.doc)
          },
          apply(tr, oldDecorations) {
            if (tr.docChanged) {
              return buildDecorations(tr.doc)
            }
            return oldDecorations.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return sceneNumberKey.getState(state)
          },
        },
      }),
    ]
  },
})

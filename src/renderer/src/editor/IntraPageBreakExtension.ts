/**
 * IntraPageBreakExtension — Bug 3
 *
 * Adds visual page-break separators WITHIN a scene whenever the accumulated
 * content height would exceed one page (9 inches at 12pt/single-spaced = 54 lines).
 *
 * Scene-boundary separators are already handled by SceneNumberExtension.
 * This plugin only adds breaks within a scene.
 *
 * Approach: pure text/line estimation (no DOM measurement) so it is stable and
 * free of infinite-update loops.
 *
 * Screenplay line counts:
 *   • 12pt Courier, line-height 1.0  → 16 px / line
 *   • Page content = 9 in = 864 px   → 54 lines per page
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet, Decoration } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const LINES_PER_PAGE = 54

/** Character columns that fit on a single line for each block type */
const COLS: Record<string, number> = {
  sceneHeading:  60,
  action:        58,
  character:     30,
  dialogue:      35,
  parenthetical: 32,
  transition:    60,
  note:          55,
}

/**
 * Overhead lines (margins) that the block type adds above/below its text.
 * Approximate based on the CSS em values scaled to 16px/line.
 */
const OVERHEAD: Record<string, number> = {
  sceneHeading:  2,   // 1.5em top + 0.25em bottom ≈ 1.75 → 2 lines
  action:        1,   // 0.5em bottom ≈ 0.5 → rounded to 1 for safety
  character:     1,   // 1em top
  dialogue:      1,   // 0.25em bottom
  parenthetical: 1,
  transition:    1,
  note:          1,
}

function estimateLines(node: ProseMirrorNode): number {
  const t = node.type.name
  const cols = COLS[t] ?? 60
  const overhead = OVERHEAD[t] ?? 1
  const textLen = node.textContent.length
  const contentLines = Math.max(1, Math.ceil(textLen / cols))
  return contentLines + overhead
}

const intraPageKey = new PluginKey<DecorationSet>('intraPageBreak')

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []

  let linesOnCurrentPage = 0
  // Track the absolute page number so we can emit correct data-page values.
  // SceneNumberExtension already assigns 1 page per scene-start heading —
  // we bump this counter alongside it.
  let pageNumber = 1
  // Whether we are inside a scene (past the first scene heading).
  let inScene = false

  doc.descendants((node, pos) => {
    if (!node.isBlock) return true

    if (node.type.name === 'sceneHeading') {
      if (node.attrs.sceneStart) {
        // New scene → a visual separator is already injected by SceneNumberExtension.
        // Reset line counter; bump page number only for non-first scenes.
        if (inScene) pageNumber++
        inScene = true
        linesOnCurrentPage = 0
      }
      // Count the heading's own lines
      linesOnCurrentPage += estimateLines(node)
      return true
    }

    if (!inScene) return true  // skip blocks before the first scene

    const nodeLines = estimateLines(node)

    if (linesOnCurrentPage + nodeLines > LINES_PER_PAGE) {
      // This block would overflow — insert an intra-scene page break before it.
      pageNumber++
      linesOnCurrentPage = 0

      const sep = document.createElement('div')
      sep.className = 'draft-page-sep intra-page-sep'
      sep.setAttribute('data-page', String(pageNumber))
      sep.setAttribute('contenteditable', 'false')
      sep.setAttribute('aria-hidden', 'true')

      decorations.push(
        Decoration.widget(pos, sep, { side: -1, key: `intra-sep-${pos}` }),
      )
    }

    linesOnCurrentPage += nodeLines
    return true
  })

  return DecorationSet.create(doc, decorations)
}

export const IntraPageBreakExtension = Extension.create({
  name: 'intraPageBreak',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: intraPageKey,

        state: {
          init(_config, state) {
            return buildDecorations(state.doc)
          },
          apply(tr, old) {
            if (tr.docChanged) {
              return buildDecorations(tr.doc)
            }
            return old.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return intraPageKey.getState(state)
          },
        },
      }),
    ]
  },
})

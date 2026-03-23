/**
 * SceneNumberExtension — Prompt 3
 *
 * ProseMirror plugin that renders scene numbers in the left margin of Draft
 * View next to the opening slugline of each scene container.
 *
 * For each sceneHeading node with attrs.sceneStart === true:
 *   1. A `Decoration.node()` adds class `scene-start` (and `scene-break` for
 *      every scene after the first) so CSS can draw the visual page-break
 *      separator and apply position: relative for the gutter widget.
 *   2. A `Decoration.widget()` injects a <span class="scene-number-gutter">
 *      at the start of the node's content, absolutely positioned into the left
 *      margin via CSS.
 *
 * Rebuilds automatically on every document change (no separate meta signal
 * needed — scene starts are structural, not annotation-level data).
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet, Decoration } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const sceneNumberKey = new PluginKey<DecorationSet>('sceneNumbers')

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []
  let sceneNum = 0

  doc.descendants((node, pos) => {
    if (node.type.name !== 'sceneHeading') return
    if (!node.attrs.sceneStart) return

    sceneNum++
    const num = sceneNum
    const isFirst = num === 1

    // Node decoration — drives CSS visual separator (scene-break) and relative
    // positioning anchor (scene-start) for the gutter widget.
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        class: isFirst ? 'scene-start' : 'scene-start scene-break',
      }),
    )

    // Widget decoration — the scene number badge in the left margin.
    // Inserted at pos + 1 (inside the node, before any text) so it flows with
    // the node and is positioned relative to it via CSS.
    const widget = document.createElement('span')
    widget.className = 'scene-number-gutter'
    widget.textContent = String(num)
    widget.setAttribute('contenteditable', 'false')

    decorations.push(Decoration.widget(pos + 1, widget, { side: -1, key: `scene-num-${num}` }))

    // Page-break separator widget — injected BEFORE each non-first scene heading.
    // Creates the dark inter-page gap that makes scenes look like discrete sheets.
    if (!isFirst) {
      const pageN = num
      const sep = document.createElement('div')
      sep.className = 'draft-page-sep'
      sep.setAttribute('data-page', String(pageN))
      sep.setAttribute('contenteditable', 'false')
      sep.setAttribute('aria-hidden', 'true')
      decorations.push(Decoration.widget(pos, sep, { side: -1, key: `page-sep-${pageN}` }))
    }
  })

  return DecorationSet.create(doc, decorations)
}

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

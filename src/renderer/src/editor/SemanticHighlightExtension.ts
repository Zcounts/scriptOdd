/**
 * SemanticHighlightExtension — Phase 5
 *
 * ProseMirror plugin that applies ephemeral decorations to screenplay blocks
 * based on the remembered entity color assignments from autocompleteStore.
 *
 * Decorations add CSS classes (`sem-char-N`, `sem-loc-N`) to blocks.
 * Visibility is controlled by a `.sem-on` class on the editor container.
 *
 * Rebuilds on:
 *   - doc changes (user edits text)
 *   - SEM_REBUILD_META transactions dispatched after entity extraction
 *     or when highlight settings change
 *
 * No schema changes needed — decorations are purely visual.
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet, Decoration } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { useAutocompleteStore } from '../store/autocompleteStore'
import { useSettingsStore } from '../store/settingsStore'

// Meta key used to trigger a decoration rebuild without a doc change
export const SEM_REBUILD_META = 'sem-rebuild'

const semHighlightKey = new PluginKey<DecorationSet>('semanticHighlight')

/**
 * Parse the location name from a scene heading.
 * "INT. COFFEE SHOP - DAY" → "COFFEE SHOP"
 * "EXT./INT. ROOF - NIGHT" → "ROOF"
 */
export function parseLocationFromHeading(heading: string): string | null {
  const m = heading
    .trim()
    .match(/^(?:INT\.?|EXT\.?|INT\.?\/EXT\.?|EXT\.?\/INT\.?)\s+(.+?)(?:\s*[-–—]\s*.+)?$/)
  return m ? m[1].trim() : null
}

/** Build a fresh DecorationSet from the current doc + store state */
function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const { semanticHighlight } = useSettingsStore.getState()
  if (!semanticHighlight) return DecorationSet.empty

  const { characterColors, locationColors } = useAutocompleteStore.getState()
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (node.type.name === 'character') {
      // Strip V.O., O.S., CONT'D etc. before lookup
      const name = node.textContent.replace(/\s*\([^)]*\)\s*/g, '').trim()
      const ci = characterColors[name]
      if (ci !== undefined) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: `sem-char-${ci}`,
            'data-sem-char': String(ci),
          }),
        )
      }
    } else if (node.type.name === 'sceneHeading') {
      const heading = node.textContent.trim()
      const location = parseLocationFromHeading(heading)
      const li = location !== null ? locationColors[location] : undefined
      if (li !== undefined) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: `sem-loc-${li}`,
            'data-sem-loc': String(li),
          }),
        )
      }
    }
  })

  return DecorationSet.create(doc, decorations)
}

export const SemanticHighlightExtension = Extension.create({
  name: 'semanticHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: semHighlightKey,

        state: {
          init(_config, { doc }) {
            return buildDecorations(doc)
          },

          apply(tr, oldDecorations) {
            // Rebuild on explicit trigger OR whenever the document changes
            if (tr.getMeta(SEM_REBUILD_META) || tr.docChanged) {
              return buildDecorations(tr.doc)
            }
            // Map existing decorations through the new positions (insertions/deletions)
            return oldDecorations.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return semHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})

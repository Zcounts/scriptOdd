/**
 * CommentHighlightMark — inline mark that visually highlights a text selection
 * and ties it to a Note via a shared `highlightId` attribute.
 *
 * Rendered as:  <mark class="comment-highlight" data-highlight-id="<id>">…</mark>
 *
 * The mark is intentionally non-exclusive so it can overlap other marks.
 */

import { Mark, mergeAttributes } from '@tiptap/core'

export const CommentHighlightMark = Mark.create({
  name: 'commentHighlight',

  // Allow the mark to span across nodes (e.g. across sentence boundaries)
  inclusive: false,

  addAttributes() {
    return {
      highlightId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-highlight-id'),
        renderHTML: (attrs) =>
          attrs.highlightId ? { 'data-highlight-id': attrs.highlightId } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'mark[data-highlight-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes({ class: 'comment-highlight' }, HTMLAttributes), 0]
  },
})

/**
 * CommentHighlightExtension — Bug 4
 *
 * A TipTap inline Mark that renders as a yellow-tinted <mark> element.
 * Used to visually anchor a Note to a specific text selection.
 *
 * Usage:
 *   editor.chain().focus().setMark('commentHighlight', { noteId: 'abc123' }).run()
 *   editor.chain().unsetMark('commentHighlight').run()
 */

import { Mark } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentHighlight: {
      /** Apply a comment highlight mark anchored to the given note id */
      setCommentHighlight: (attrs: { noteId: string }) => ReturnType
      /** Remove a comment highlight mark from the selection */
      unsetCommentHighlight: () => ReturnType
    }
  }
}

export const CommentHighlightExtension = Mark.create({
  name: 'commentHighlight',

  priority: 1000,

  keepOnSplit: false,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-note-id'),
        renderHTML: (attrs) => ({ 'data-note-id': attrs.noteId }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'mark[data-note-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', { class: 'comment-highlight', ...HTMLAttributes }, 0]
  },

  addCommands() {
    return {
      setCommentHighlight:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),

      unsetCommentHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})

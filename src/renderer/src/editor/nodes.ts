/**
 * Screenplay Node Extensions — Phase 2
 *
 * Seven custom Tiptap block nodes, one per screenplay element type.
 * Each node stores block-level metadata (id, sceneId, tags, noteIds).
 */

import { Node, mergeAttributes } from '@tiptap/core'

// ── Shared block attributes ──────────────────────────────────────────────────

const blockAttrs = {
  id: { default: '' },
  sceneId: { default: null as string | null },
  /** Semantic tags (e.g. 'wip', 'cut', 'important') */
  tags: {
    default: [] as string[],
    parseHTML: (element: HTMLElement) => {
      const raw = element.getAttribute('data-tags')
      return raw ? (JSON.parse(raw) as string[]) : []
    },
    renderHTML: (attrs: { tags: string[] }) => ({
      'data-tags': JSON.stringify(attrs.tags),
    }),
  },
  /** IDs of anchored notes/comments on this block */
  noteIds: {
    default: [] as string[],
    parseHTML: (element: HTMLElement) => {
      const raw = element.getAttribute('data-note-ids')
      return raw ? (JSON.parse(raw) as string[]) : []
    },
    renderHTML: (attrs: { noteIds: string[] }) => ({
      'data-note-ids': JSON.stringify(attrs.noteIds),
    }),
  },
}

// ── Scene Heading ─────────────────────────────────────────────────────────────

export const SceneHeadingNode = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      ...blockAttrs,
      /**
       * true  = this slugline is the first in a new scene container (created by Ctrl+Enter)
       * false = additional slugline within the current scene
       */
      sceneStart: { default: false as boolean },
    }
  },

  parseHTML() {
    return [{ tag: 'p[data-type="scene-heading"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'scene-heading', class: 'sp-scene-heading' }), 0]
  },
})

// ── Action ────────────────────────────────────────────────────────────────────

export const ActionNode = Node.create({
  name: 'action',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="action"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'action', class: 'sp-action' }), 0]
  },
})

// ── Character ─────────────────────────────────────────────────────────────────

export const CharacterNode = Node.create({
  name: 'character',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="character"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'character', class: 'sp-character' }), 0]
  },
})

// ── Dialogue ──────────────────────────────────────────────────────────────────

export const DialogueNode = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="dialogue"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'dialogue', class: 'sp-dialogue' }), 0]
  },
})

// ── Parenthetical ─────────────────────────────────────────────────────────────

export const ParentheticalNode = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="parenthetical"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'parenthetical', class: 'sp-parenthetical' }), 0]
  },
})

// ── Transition ────────────────────────────────────────────────────────────────

export const TransitionNode = Node.create({
  name: 'transition',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="transition"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'transition', class: 'sp-transition' }), 0]
  },
})

// ── Note ──────────────────────────────────────────────────────────────────────
// Inline writer note — visible in Draft view, hidden in Page view.

export const NoteNode = Node.create({
  name: 'note',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return blockAttrs
  },

  parseHTML() {
    return [{ tag: 'p[data-type="note"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'note', class: 'sp-note' }), 0]
  },
})

// ── All nodes array ───────────────────────────────────────────────────────────

export const SCREENPLAY_NODES = [
  SceneHeadingNode,
  ActionNode,
  CharacterNode,
  DialogueNode,
  ParentheticalNode,
  TransitionNode,
  NoteNode,
]

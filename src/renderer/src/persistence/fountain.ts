/**
 * persistence/fountain.ts — Phase 7
 *
 * Fountain screenplay format import and export.
 *
 * Fountain spec: https://fountain.io/syntax
 *
 * Import: Fountain plain text → Tiptap JSONContent
 * Export: Tiptap JSONContent + ProjectMeta → Fountain plain text
 */

import type { JSONContent } from '@tiptap/core'
import type { ProjectMeta } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT  (Tiptap JSON → Fountain text)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert Tiptap JSONContent to a Fountain-formatted plain text string.
 * If meta is provided and has a title/author, a title-page header is prepended.
 */
export function jsonToFountain(json: JSONContent, meta?: ProjectMeta): string {
  const lines: string[] = []

  // Title page (optional)
  if (meta?.title && meta.title !== 'Untitled') {
    lines.push(`Title: ${meta.title}`)
    if (meta.author) lines.push(`Author: ${meta.author}`)
    if (meta.contact) lines.push(`Contact: ${meta.contact}`)
    const draftDate = new Date(meta.updatedAt || meta.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    lines.push(`Draft Date: ${draftDate}`)
    lines.push('')
    lines.push('===')
    lines.push('')
  }

  const blocks = json.content ?? []
  let prevType = ''

  for (const block of blocks) {
    const text = extractBlockText(block)

    switch (block.type) {
      case 'sceneHeading': {
        // Blank line before scene headings (except at start)
        if (prevType !== '') lines.push('')
        lines.push(text.toUpperCase())
        lines.push('')
        break
      }
      case 'action': {
        if (prevType === 'sceneHeading') {
          // Already had blank after heading
        } else if (prevType !== '') {
          lines.push('')
        }
        lines.push(text)
        lines.push('')
        break
      }
      case 'character': {
        lines.push('')
        lines.push(text.toUpperCase())
        break
      }
      case 'parenthetical': {
        // Parentheticals go between character and dialogue, no blank line
        const paren = text.startsWith('(') ? text : `(${text})`
        lines.push(paren)
        break
      }
      case 'dialogue': {
        lines.push(text)
        lines.push('')
        break
      }
      case 'transition': {
        lines.push('')
        // Fountain transitions are right-aligned via '>' prefix
        lines.push(`> ${text.toUpperCase()}`)
        lines.push('')
        break
      }
      case 'note': {
        // Fountain notes use [[ ]]
        lines.push(`[[${text}]]`)
        lines.push('')
        break
      }
      default:
        if (text) {
          lines.push(text)
          lines.push('')
        }
    }

    prevType = block.type ?? ''
  }

  // Trim trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.join('\n')
}

function extractBlockText(block: JSONContent): string {
  if (block.text) return block.text
  if (block.content) return block.content.map(extractBlockText).join('')
  return ''
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT  (Fountain text → Tiptap JSONContent)
// ─────────────────────────────────────────────────────────────────────────────

type FountainToken =
  | { type: 'title_page'; data: Record<string, string> }
  | { type: 'scene_heading'; text: string }
  | { type: 'action'; text: string }
  | { type: 'character'; text: string }
  | { type: 'parenthetical'; text: string }
  | { type: 'dialogue'; text: string }
  | { type: 'transition'; text: string }
  | { type: 'note'; text: string }
  | { type: 'page_break' }

const SCENE_HEADING_RE = /^(INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)[\s.]/i
const TRANSITION_RE = /^(FADE (IN|OUT|TO BLACK)|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|CUT TO|WIPE TO|IRIS (IN|OUT))[:\.]?\s*$/i
const CHARACTER_RE = /^[A-Z][A-Z\s\-'.()]*[A-Z\).]$/
const PARENTHETICAL_RE = /^\(.*\)$/
const NOTE_RE = /^\[\[(.+?)\]\]$/

/**
 * Parse Fountain plain text into a list of semantic tokens.
 */
function tokenize(text: string): FountainToken[] {
  const tokens: FountainToken[] = []
  // Normalise line endings
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let i = 0
  let titlePageParsed = false

  // ── Title page ─────────────────────────────────────────────────────────────
  // Title page is at the very start: key/value pairs followed by a blank line
  if (!titlePageParsed) {
    const titleData: Record<string, string> = {}
    let j = 0
    while (j < rawLines.length) {
      const line = rawLines[j]
      if (line === '' && j > 0) break  // end of title page
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase()
        const val = line.slice(colonIdx + 1).trim()
        titleData[key] = val
        j++
      } else {
        break  // not a title page
      }
    }
    if (Object.keys(titleData).length > 0 && j < rawLines.length) {
      tokens.push({ type: 'title_page', data: titleData })
      // Skip blank line after title page
      i = j + 1
      titlePageParsed = true
    }
  }

  // ── Parse into paragraph groups ────────────────────────────────────────────
  // Split into chunks separated by blank lines
  const chunks: string[][] = []
  let current: string[] = []

  for (; i < rawLines.length; i++) {
    const line = rawLines[i]
    if (line.trim() === '') {
      if (current.length > 0) {
        chunks.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) chunks.push(current)

  // ── Classify each chunk ────────────────────────────────────────────────────
  for (const chunk of chunks) {
    const firstLine = chunk[0].trim()

    // Page break
    if (firstLine === '===' || firstLine === '==='.repeat(3)) {
      tokens.push({ type: 'page_break' })
      continue
    }

    // Forced scene heading: starts with '.'
    if (firstLine.startsWith('.') && !firstLine.startsWith('..')) {
      const text = firstLine.slice(1).trim()
      tokens.push({ type: 'scene_heading', text: text.toUpperCase() })
      continue
    }

    // Scene heading: INT./EXT. pattern
    if (SCENE_HEADING_RE.test(firstLine)) {
      tokens.push({ type: 'scene_heading', text: firstLine.toUpperCase() })
      continue
    }

    // Forced transition: starts with '>'
    if (firstLine.startsWith('>') && !firstLine.endsWith('<')) {
      const text = firstLine.slice(1).trim()
      tokens.push({ type: 'transition', text: text.toUpperCase() })
      continue
    }

    // Transition: uppercase ending with TO: etc.
    if (TRANSITION_RE.test(firstLine) && chunk.length === 1) {
      tokens.push({ type: 'transition', text: firstLine.toUpperCase() })
      continue
    }

    // Note: [[...]]
    const noteMatch = firstLine.match(NOTE_RE)
    if (noteMatch) {
      tokens.push({ type: 'note', text: noteMatch[1] })
      continue
    }

    // Dialogue block: character line followed by parenthetical/dialogue lines
    // A character line is ALL CAPS (with possible parenthetical suffix)
    const isCharLine = CHARACTER_RE.test(firstLine.replace(/\s*\([^)]*\)\s*$/, '').trim())
    if (isCharLine && chunk.length > 1) {
      tokens.push({ type: 'character', text: firstLine })

      for (let k = 1; k < chunk.length; k++) {
        const dLine = chunk[k].trim()
        if (PARENTHETICAL_RE.test(dLine)) {
          tokens.push({ type: 'parenthetical', text: dLine })
        } else {
          tokens.push({ type: 'dialogue', text: dLine })
        }
      }
      continue
    }

    // Forced action: starts with '!'
    if (firstLine.startsWith('!')) {
      const joined = chunk.map((l) => l.replace(/^!/, '')).join('\n')
      tokens.push({ type: 'action', text: joined })
      continue
    }

    // Default: action
    tokens.push({ type: 'action', text: chunk.join('\n') })
  }

  return tokens
}

/**
 * Convert a list of Fountain tokens into Tiptap JSONContent.
 */
function tokensToJSON(tokens: FountainToken[]): JSONContent {
  const content: JSONContent[] = []
  let currentSceneId: string | null = null

  for (const token of tokens) {
    if (token.type === 'title_page' || token.type === 'page_break') {
      continue  // Skip title page and page breaks in the editor content
    }

    const id = crypto.randomUUID()

    switch (token.type) {
      case 'scene_heading': {
        currentSceneId = id
        content.push({
          type: 'sceneHeading',
          attrs: { id, sceneId: id, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'action': {
        content.push({
          type: 'action',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'character': {
        content.push({
          type: 'character',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'parenthetical': {
        content.push({
          type: 'parenthetical',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'dialogue': {
        content.push({
          type: 'dialogue',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'transition': {
        content.push({
          type: 'transition',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
      case 'note': {
        content.push({
          type: 'note',
          attrs: { id, sceneId: currentSceneId, tags: [], noteIds: [] },
          content: [{ type: 'text', text: token.text }],
        })
        break
      }
    }
  }

  // Ensure at least one block
  if (content.length === 0) {
    content.push({
      type: 'sceneHeading',
      attrs: { id: crypto.randomUUID(), sceneId: crypto.randomUUID(), tags: [], noteIds: [] },
      content: [{ type: 'text', text: '' }],
    })
  }

  return { type: 'doc', content }
}

/**
 * Extract title-page metadata from a parsed token stream, if present.
 */
export function extractFountainMeta(tokens: FountainToken[]): Partial<ProjectMeta> {
  for (const t of tokens) {
    if (t.type === 'title_page') {
      const d = t.data
      const now = new Date().toISOString()
      return {
        id: crypto.randomUUID(),
        title: d['title'] ?? 'Untitled',
        author: d['author'] ?? d['authors'] ?? '',
        contact: d['contact'] ?? '',
        createdAt: now,
        updatedAt: now,
      }
    }
  }
  return {}
}

/**
 * Parse a Fountain plain-text string into Tiptap JSONContent.
 * Returns both the JSON content and any metadata extracted from the title page.
 */
export function fountainToJSON(text: string): {
  content: JSONContent
  meta: Partial<ProjectMeta>
} {
  const tokens = tokenize(text)
  const content = tokensToJSON(tokens)
  const meta = extractFountainMeta(tokens)
  return { content, meta }
}

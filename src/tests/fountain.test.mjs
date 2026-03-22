/**
 * Fountain import/export tests — Phase 8
 * Runs with Node's built-in test runner: node --test src/tests/*.test.mjs
 *
 * These tests inline the critical logic so they run without a build step.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ── Inline the minimal fountain tokenizer logic for testing ───────────────────

const SCENE_HEADING_RE = /^(INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)[\s.]/i
const TRANSITION_RE = /^(FADE (IN|OUT|TO BLACK)|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|CUT TO|WIPE TO|IRIS (IN|OUT))[:\.]?\s*$/i
const CHARACTER_RE = /^[A-Z][A-Z\s\-'.()]*[A-Z\).]$/
const PARENTHETICAL_RE = /^\(.*\)$/
const NOTE_RE = /^\[\[(.+?)\]\]$/

function tokenize(text) {
  const tokens = []
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let i = 0

  // Title page detection
  const titleData = {}
  let j = 0
  while (j < rawLines.length) {
    const line = rawLines[j]
    if (line === '' && j > 0) break
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      titleData[line.slice(0, colonIdx).trim().toLowerCase()] = line.slice(colonIdx + 1).trim()
      j++
    } else break
  }
  if (Object.keys(titleData).length > 0 && j < rawLines.length) {
    tokens.push({ type: 'title_page', data: titleData })
    i = j + 1
  }

  const chunks = []
  let current = []
  for (; i < rawLines.length; i++) {
    const line = rawLines[i]
    if (line.trim() === '') {
      if (current.length > 0) { chunks.push(current); current = [] }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) chunks.push(current)

  for (const chunk of chunks) {
    const firstLine = chunk[0].trim()

    if (firstLine === '===' || firstLine === '==='.repeat(3)) {
      tokens.push({ type: 'page_break' })
      continue
    }
    if (firstLine.startsWith('.') && !firstLine.startsWith('..')) {
      tokens.push({ type: 'scene_heading', text: firstLine.slice(1).trim().toUpperCase() })
      continue
    }
    if (SCENE_HEADING_RE.test(firstLine)) {
      tokens.push({ type: 'scene_heading', text: firstLine.toUpperCase() })
      continue
    }
    if (firstLine.startsWith('>') && !firstLine.endsWith('<')) {
      tokens.push({ type: 'transition', text: firstLine.slice(1).trim().toUpperCase() })
      continue
    }
    if (TRANSITION_RE.test(firstLine) && chunk.length === 1) {
      tokens.push({ type: 'transition', text: firstLine.toUpperCase() })
      continue
    }
    const noteMatch = firstLine.match(NOTE_RE)
    if (noteMatch) {
      tokens.push({ type: 'note', text: noteMatch[1] })
      continue
    }
    const isCharLine = CHARACTER_RE.test(firstLine.replace(/\s*\([^)]*\)\s*$/, '').trim())
    if (isCharLine && chunk.length > 1) {
      tokens.push({ type: 'character', text: firstLine })
      for (let k = 1; k < chunk.length; k++) {
        const dLine = chunk[k].trim()
        if (PARENTHETICAL_RE.test(dLine)) tokens.push({ type: 'parenthetical', text: dLine })
        else tokens.push({ type: 'dialogue', text: dLine })
      }
      continue
    }
    if (firstLine.startsWith('!')) {
      for (const line of chunk) tokens.push({ type: 'action', text: line.replace(/^!/, '') })
      continue
    }
    for (const line of chunk) tokens.push({ type: 'action', text: line })
  }

  return tokens
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('tokenize: recognises INT. scene heading', () => {
  const tokens = tokenize('INT. COFFEE SHOP - DAY\n\nAction here.')
  assert.equal(tokens[0].type, 'scene_heading')
  assert.equal(tokens[0].text, 'INT. COFFEE SHOP - DAY')
})

test('tokenize: recognises EXT. scene heading', () => {
  const tokens = tokenize('EXT. STREET - NIGHT\n')
  assert.equal(tokens[0].type, 'scene_heading')
})

test('tokenize: forced scene heading with leading dot', () => {
  const tokens = tokenize('.FORCED HEADING\n')
  assert.equal(tokens[0].type, 'scene_heading')
  assert.equal(tokens[0].text, 'FORCED HEADING')
})

test('tokenize: character + dialogue block', () => {
  const tokens = tokenize('JOHN\nHello world.\n')
  assert.equal(tokens[0].type, 'character')
  assert.equal(tokens[0].text, 'JOHN')
  assert.equal(tokens[1].type, 'dialogue')
  assert.equal(tokens[1].text, 'Hello world.')
})

test('tokenize: character + parenthetical + dialogue', () => {
  const tokens = tokenize('JANE\n(softly)\nGoodnight.\n')
  assert.equal(tokens[0].type, 'character')
  assert.equal(tokens[1].type, 'parenthetical')
  assert.equal(tokens[2].type, 'dialogue')
})

test('tokenize: transition via > prefix', () => {
  const tokens = tokenize('> CUT TO BLACK\n')
  assert.equal(tokens[0].type, 'transition')
})

test('tokenize: note syntax [[...]]', () => {
  const tokens = tokenize('[[This is a note]]\n')
  assert.equal(tokens[0].type, 'note')
  assert.equal(tokens[0].text, 'This is a note')
})

test('tokenize: title page extracted', () => {
  const tokens = tokenize('Title: My Film\nAuthor: Jane Doe\n\nINT. ROOM - DAY\n')
  assert.equal(tokens[0].type, 'title_page')
  assert.equal(tokens[0].data['title'], 'My Film')
  assert.equal(tokens[0].data['author'], 'Jane Doe')
})

test('tokenize: multi-line action produces one token per line', () => {
  const tokens = tokenize('She walks in.\nThe room is empty.\n')
  const actionTokens = tokens.filter(t => t.type === 'action')
  assert.equal(actionTokens.length, 2)
  assert.equal(actionTokens[0].text, 'She walks in.')
  assert.equal(actionTokens[1].text, 'The room is empty.')
})

test('tokenize: page_break for ===', () => {
  const tokens = tokenize('INT. A - DAY\n\n===\n\nINT. B - NIGHT\n')
  assert.ok(tokens.some(t => t.type === 'page_break'))
})

test('tokenize: action for default text', () => {
  const tokens = tokenize('She looks around nervously.\n')
  assert.equal(tokens[0].type, 'action')
})

// ── Fountain export logic (inline) ────────────────────────────────────────────

function extractBlockText(block) {
  if (block.text) return block.text
  if (block.content) return block.content.map(extractBlockText).join('')
  return ''
}

function jsonToFountain(json, meta) {
  const lines = []
  if (meta?.title && meta.title !== 'Untitled') {
    lines.push(`Title: ${meta.title}`)
    if (meta.author) lines.push(`Author: ${meta.author}`)
    lines.push('')
    lines.push('===')
    lines.push('')
  }
  const blocks = json.content ?? []
  let prevType = ''
  for (const block of blocks) {
    const text = extractBlockText(block)
    switch (block.type) {
      case 'sceneHeading':
        if (prevType !== '') lines.push('')
        lines.push(text.toUpperCase())
        lines.push('')
        break
      case 'action':
        if (prevType !== 'sceneHeading' && prevType !== '') lines.push('')
        lines.push(text)
        lines.push('')
        break
      case 'character':
        lines.push('')
        lines.push(text.toUpperCase())
        break
      case 'parenthetical':
        lines.push(text.startsWith('(') ? text : `(${text})`)
        break
      case 'dialogue':
        lines.push(text)
        lines.push('')
        break
      case 'transition':
        lines.push('')
        lines.push(`> ${text.toUpperCase()}`)
        lines.push('')
        break
    }
    prevType = block.type ?? ''
  }
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

test('jsonToFountain: scene heading uppercased', () => {
  const json = {
    type: 'doc',
    content: [
      { type: 'sceneHeading', content: [{ type: 'text', text: 'Int. Office - Day' }] },
    ],
  }
  const out = jsonToFountain(json)
  assert.ok(out.includes('INT. OFFICE - DAY'))
})

test('jsonToFountain: character + dialogue formatted correctly', () => {
  const json = {
    type: 'doc',
    content: [
      { type: 'character', content: [{ type: 'text', text: 'alice' }] },
      { type: 'dialogue', content: [{ type: 'text', text: 'Hello.' }] },
    ],
  }
  const out = jsonToFountain(json)
  assert.ok(out.includes('ALICE'))
  assert.ok(out.includes('Hello.'))
})

test('jsonToFountain: transition uses > prefix', () => {
  const json = {
    type: 'doc',
    content: [
      { type: 'transition', content: [{ type: 'text', text: 'cut to:' }] },
    ],
  }
  const out = jsonToFountain(json)
  assert.ok(out.includes('> CUT TO:'))
})

test('jsonToFountain: title page header included when meta has title', () => {
  const json = { type: 'doc', content: [] }
  const out = jsonToFountain(json, { title: 'My Script', author: 'J. Doe' })
  assert.ok(out.includes('Title: My Script'))
  assert.ok(out.includes('Author: J. Doe'))
})

test('jsonToFountain: no title page when title is Untitled', () => {
  const json = { type: 'doc', content: [] }
  const out = jsonToFountain(json, { title: 'Untitled' })
  assert.ok(!out.includes('Title:'))
})

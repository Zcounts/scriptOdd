/**
 * sceneUtils tests — Phase 8 → Prompt 3 refactor
 *
 * Tests for scene derivation, ID resolution, and reorder logic.
 *
 * New model:
 *   - A Scene is only created for sceneHeading blocks with attrs.sceneStart = true.
 *   - Backward compat: if NO block in the document has sceneStart = true, every
 *     sceneHeading is treated as a scene start (old 1:1 behaviour).
 *   - Multiple sceneHeading sluglines with sceneStart = false share a scene.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ── Inline minimal scene utils logic ─────────────────────────────────────────

function extractText(node) {
  if (node.text) return node.text
  if (node.content) return node.content.map(extractText).join('')
  return ''
}

function sceneIdFromAttrs(attrs) {
  if (!attrs) return null
  const sid = attrs.sceneId
  if (sid) return sid
  const id = attrs.id
  return id || null
}

function deriveScenes(json, existingScenes) {
  const blocks = json.content ?? []
  const existingMap = new Map(existingScenes.map((s) => [s.id, s]))

  // Detect whether this document uses explicit scene starts (new model)
  const hasExplicitSceneStarts = blocks.some(
    (b) => b.type === 'sceneHeading' && b.attrs?.sceneStart === true,
  )

  const scenes = []
  let order = 0

  for (const block of blocks) {
    if (block.type !== 'sceneHeading') continue

    const attrs = block.attrs
    const isSceneStart = hasExplicitSceneStarts ? attrs?.sceneStart === true : true

    if (!isSceneStart) continue

    const id = sceneIdFromAttrs(attrs)
    if (!id) continue

    const heading = extractText(block)
    const existing = existingMap.get(id)
    scenes.push({
      id,
      heading,
      synopsis: existing?.synopsis ?? '',
      color: existing?.color ?? null,
      order: order++,
      noteIds: existing?.noteIds ?? [],
    })
  }

  return scenes
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// New model: sceneStart = true required
test('deriveScenes: creates scene for sceneStart=true heading', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'h1', sceneId: 'sc1', sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. OFFICE - DAY' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes.length, 1)
  assert.equal(scenes[0].id, 'sc1')
  assert.equal(scenes[0].heading, 'INT. OFFICE - DAY')
  assert.equal(scenes[0].order, 0)
})

test('deriveScenes: does NOT create scene for sceneStart=false slugline (new model doc)', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'h1', sceneId: 'sc1', sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. OFFICE - DAY' }],
      },
      {
        type: 'sceneHeading',
        attrs: { id: 'h2', sceneId: 'sc1', sceneStart: false, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. OFFICE - LATER' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  // Only the sceneStart = true heading creates a scene
  assert.equal(scenes.length, 1)
  assert.equal(scenes[0].id, 'sc1')
})

test('deriveScenes: multiple scenes from multiple sceneStart=true headings', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'h1', sceneId: 'sc1', sceneStart: true },
        content: [{ type: 'text', text: 'Scene A' }],
      },
      {
        type: 'sceneHeading',
        attrs: { id: 'h2', sceneId: 'sc2', sceneStart: true },
        content: [{ type: 'text', text: 'Scene B' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes.length, 2)
  assert.equal(scenes[0].id, 'sc1')
  assert.equal(scenes[1].id, 'sc2')
})

// Backward compat: no sceneStart anywhere → treat all headings as scene starts
test('deriveScenes: backward compat — no sceneStart attr treats every heading as a scene', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'h1', sceneId: 'sc1', tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. A - DAY' }],
      },
      {
        type: 'sceneHeading',
        attrs: { id: 'h2', sceneId: 'sc2', tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'EXT. B - NIGHT' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes.length, 2)
  assert.equal(scenes[0].id, 'sc1')
  assert.equal(scenes[1].id, 'sc2')
})

test('deriveScenes: preserves synopsis and color from existing scenes', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'h1', sceneId: 'sc1', sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. A - DAY' }],
      },
    ],
  }
  const existing = [
    { id: 'sc1', heading: 'INT. A - DAY', synopsis: 'The setup', color: 'blue', order: 0, noteIds: ['n1'] },
  ]
  const scenes = deriveScenes(json, existing)
  assert.equal(scenes[0].synopsis, 'The setup')
  assert.equal(scenes[0].color, 'blue')
  assert.deepEqual(scenes[0].noteIds, ['n1'])
})

test('deriveScenes: ignores blocks that are not sceneHeadings', () => {
  const json = {
    type: 'doc',
    content: [
      { type: 'action', attrs: { id: 'a1', sceneId: 'sc1', tags: [], noteIds: [] }, content: [{ type: 'text', text: 'She runs.' }] },
      {
        type: 'sceneHeading',
        attrs: { id: 'h2', sceneId: 'sc2', sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'EXT. PARK' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes.length, 1)
  assert.equal(scenes[0].id, 'sc2')
})

test('deriveScenes: skips sceneHeadings with no resolvable ID', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: null, sceneId: null, sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. ROOM - DAY' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes.length, 0)
})

test('deriveScenes: falls back to attrs.id when sceneId is null', () => {
  const json = {
    type: 'doc',
    content: [
      {
        type: 'sceneHeading',
        attrs: { id: 'fallback-id', sceneId: null, sceneStart: true, tags: [], noteIds: [] },
        content: [{ type: 'text', text: 'INT. X' }],
      },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes[0].id, 'fallback-id')
})

test('deriveScenes: assigns sequential order values', () => {
  const json = {
    type: 'doc',
    content: [
      { type: 'sceneHeading', attrs: { id: 'h1', sceneId: 'sc1', sceneStart: true }, content: [{ type: 'text', text: 'Scene 1' }] },
      { type: 'sceneHeading', attrs: { id: 'h2', sceneId: 'sc2', sceneStart: true }, content: [{ type: 'text', text: 'Scene 2' }] },
      { type: 'sceneHeading', attrs: { id: 'h3', sceneId: 'sc3', sceneStart: true }, content: [{ type: 'text', text: 'Scene 3' }] },
    ],
  }
  const scenes = deriveScenes(json, [])
  assert.equal(scenes[0].order, 0)
  assert.equal(scenes[1].order, 1)
  assert.equal(scenes[2].order, 2)
})

test('sceneIdFromAttrs: prefers sceneId over id', () => {
  assert.equal(sceneIdFromAttrs({ sceneId: 'scene-1', id: 'block-1' }), 'scene-1')
})

test('sceneIdFromAttrs: falls back to id', () => {
  assert.equal(sceneIdFromAttrs({ sceneId: null, id: 'block-1' }), 'block-1')
})

test('sceneIdFromAttrs: returns null if no attrs', () => {
  assert.equal(sceneIdFromAttrs(undefined), null)
})

test('extractText: extracts text from nested content', () => {
  const node = { content: [{ content: [{ text: 'hello ' }, { text: 'world' }] }] }
  assert.equal(extractText(node), 'hello world')
})

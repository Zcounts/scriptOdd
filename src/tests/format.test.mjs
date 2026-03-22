/**
 * format.ts tests — Phase 8
 * Tests for project serialization / deserialization logic.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ── Inline minimal format logic ───────────────────────────────────────────────

const SODD_FORMAT_VERSION = 1

function serializeProject(meta, editorContent, scenes, notes, entities, layout, settings) {
  const file = {
    version: SODD_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    meta: { ...meta, updatedAt: new Date().toISOString() },
    editorContent,
    scenes,
    notes,
    entities,
    layout,
    settings,
  }
  return JSON.stringify(file, null, 2)
}

function deserializeProject(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: 'not an object' }
    if (typeof parsed['version'] !== 'number') return { ok: false, error: 'missing version' }
    if (parsed['version'] > SODD_FORMAT_VERSION) return { ok: false, error: `newer version: ${parsed['version']}` }
    if (!parsed['meta'] || typeof parsed['meta'] !== 'object') return { ok: false, error: 'missing meta' }
    if (!parsed['editorContent'] || typeof parsed['editorContent'] !== 'object') return { ok: false, error: 'missing editorContent' }
    return { ok: true, file: parsed }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSampleProject() {
  return {
    meta: { id: '123', title: 'Test', author: '', contact: '', createdAt: '', updatedAt: '' },
    editorContent: { type: 'doc', content: [] },
    scenes: [],
    notes: [],
    entities: { characters: [], locations: [], sceneHeadings: [], transitions: [], props: [], characterColors: {}, locationColors: {}, propColors: {} },
    layout: { leftSidebarVisible: true, rightPanelVisible: true, leftSidebarSize: 18, rightPanelSize: 22, activeView: 'draft', leftSidebarTab: 'navigator', rightPanelTab: 'notes', layoutPreset: 'default' },
    settings: { semanticHighlight: true, highlightIntensity: 'medium', highlightStyle: 'minimal', editorFontSize: 'md', editorLineHeight: 'relaxed', pageSize: 'letter', pageMarginsPreset: 'standard', showPageChrome: true, theme: 'dark' },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('serializeProject produces valid JSON', () => {
  const p = makeSampleProject()
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  assert.doesNotThrow(() => JSON.parse(raw))
})

test('deserializeProject round-trips correctly', () => {
  const p = makeSampleProject()
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  const result = deserializeProject(raw)
  assert.equal(result.ok, true)
  assert.equal(result.file.meta.title, 'Test')
  assert.equal(result.file.version, SODD_FORMAT_VERSION)
})

test('deserializeProject rejects invalid JSON', () => {
  const result = deserializeProject('not json at all')
  assert.equal(result.ok, false)
  assert.ok(result.error)
})

test('deserializeProject rejects missing version', () => {
  const p = makeSampleProject()
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  const parsed = JSON.parse(raw)
  delete parsed.version
  const result = deserializeProject(JSON.stringify(parsed))
  assert.equal(result.ok, false)
})

test('deserializeProject rejects missing editorContent', () => {
  const p = makeSampleProject()
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  const parsed = JSON.parse(raw)
  delete parsed.editorContent
  const result = deserializeProject(JSON.stringify(parsed))
  assert.equal(result.ok, false)
})

test('deserializeProject rejects file from newer format version', () => {
  const p = makeSampleProject()
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  const parsed = JSON.parse(raw)
  parsed.version = 999
  const result = deserializeProject(JSON.stringify(parsed))
  assert.equal(result.ok, false)
  assert.ok(result.error.includes('999'))
})

test('serialized updatedAt is refreshed on save', () => {
  const p = makeSampleProject()
  p.meta.updatedAt = '2020-01-01T00:00:00.000Z'
  const raw = serializeProject(p.meta, p.editorContent, p.scenes, p.notes, p.entities, p.layout, p.settings)
  const result = deserializeProject(raw)
  assert.ok(result.file.meta.updatedAt !== '2020-01-01T00:00:00.000Z')
})

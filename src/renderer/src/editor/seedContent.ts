/**
 * Seed screenplay content — Phase 2 testing fixture.
 *
 * Provides a short opening sequence to verify that all seven block types
 * render and edit correctly out of the box.
 */

import type { JSONContent } from '@tiptap/core'

function blk(
  type: string,
  text: string,
  id: string,
  sceneId: string | null = null,
): JSONContent {
  return {
    type,
    attrs: { id, sceneId, tags: [], noteIds: [] },
    content: text ? [{ type: 'text', text }] : [],
  }
}

export const seedContent: JSONContent = {
  type: 'doc',
  content: [
    blk('sceneHeading', 'INT. COFFEE SHOP - DAY', 'sh-1', 'scene-1'),

    blk(
      'action',
      'The shop is nearly empty. A ceiling fan turns slowly overhead. MARA (30s, sharp eyes, paint on her fingers) sits alone at the bar, a cold cup of coffee in front of her.',
      'act-1',
      'scene-1',
    ),

    blk('action', 'She stares at her phone.', 'act-2', 'scene-1'),

    blk('character', 'MARA', 'ch-1', 'scene-1'),
    blk('dialogue', "He said he'd be here by eight.", 'dlg-1', 'scene-1'),

    blk(
      'action',
      'The door opens. JAKE (40s, rumpled jacket, unhurried) steps in and scans the room.',
      'act-3',
      'scene-1',
    ),

    blk('character', 'JAKE', 'ch-2', 'scene-1'),
    blk('parenthetical', 'looking around', 'par-1', 'scene-1'),
    blk('dialogue', 'Sorry. Bus.', 'dlg-2', 'scene-1'),

    blk('action', "He sits across from her. She doesn't look up.", 'act-4', 'scene-1'),

    blk('note', 'NOTE: Consider adding a beat here — she might start to smile.', 'note-1', 'scene-1'),

    blk('transition', 'CUT TO:', 'tr-1', 'scene-1'),

    // ── Scene 2 ──────────────────────────────────────────────────────────────

    blk('sceneHeading', 'EXT. STREET - CONTINUOUS', 'sh-2', 'scene-2'),

    blk(
      'action',
      'They walk in silence. The city carries on around them — indifferent, efficient.',
      'act-5',
      'scene-2',
    ),

    blk('character', 'MARA', 'ch-3', 'scene-2'),
    blk('parenthetical', 'not looking at him', 'par-2', 'scene-2'),
    blk('dialogue', 'You could have called.', 'dlg-3', 'scene-2'),

    blk('character', 'JAKE', 'ch-4', 'scene-2'),
    blk('dialogue', "I didn't think it would matter.", 'dlg-4', 'scene-2'),

    blk('action', 'She stops walking.', 'act-6', 'scene-2'),

    blk('transition', 'SMASH CUT TO:', 'tr-2', 'scene-2'),

    // ── Scene 3 ──────────────────────────────────────────────────────────────

    blk('sceneHeading', 'INT. MARA\'S APARTMENT - NIGHT', 'sh-3', 'scene-3'),

    blk(
      'action',
      "The apartment is spare and orderly. One painting — half-finished — dominates the far wall. Mara stands in front of it, brush in hand but motionless.",
      'act-7',
      'scene-3',
    ),
  ],
}

// ── Scene metadata derived from seed content ─────────────────────────────────

export interface SceneSeed {
  id: string
  heading: string
  synopsis: string
}

export const SEED_SCENES: SceneSeed[] = [
  { id: 'scene-1', heading: 'INT. COFFEE SHOP - DAY', synopsis: 'Mara waits for Jake at the coffee shop.' },
  { id: 'scene-2', heading: 'EXT. STREET - CONTINUOUS', synopsis: 'They walk. Words fail them.' },
  { id: 'scene-3', heading: "INT. MARA'S APARTMENT - NIGHT", synopsis: 'Mara stands before her unfinished painting.' },
]

import React, { useRef, useEffect } from 'react'
import { LayoutTemplate } from 'lucide-react'

interface DraftViewProps {
  focusMode?: boolean
}

/**
 * Draft View — Phase 1 placeholder.
 *
 * In Phase 2 this will host the custom screenplay editor with:
 *   - ProseMirror or custom contenteditable block editor
 *   - Screenplay element types (scene heading, action, character, etc.)
 *   - Smart Enter/Tab/Shift+Tab keyboard flow
 *   - Semantic color coding toggle
 */
export function DraftView({ focusMode = false }: DraftViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Editor chrome bar */}
      {!focusMode && (
        <div className="flex items-center h-8 px-4 border-b border-so-border-dim bg-so-surface flex-shrink-0">
          <LayoutTemplate size={12} className="text-so-text-3 mr-2" />
          <span className="text-xxs text-so-text-3 uppercase tracking-wider">Draft View</span>
        </div>
      )}

      {/* Editor canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div
          className={[
            'max-w-2xl mx-auto min-h-full',
            focusMode ? 'max-w-xl' : '',
          ].join(' ')}
        >
          {/* Phase 1: Styled placeholder that shows the writing area */}
          <PlaceholderEditor />
        </div>
      </div>
    </div>
  )
}

/**
 * Visual placeholder for the screenplay editor.
 * Shows example formatted screenplay blocks to verify styling.
 */
function PlaceholderEditor(): React.JSX.Element {
  return (
    <div className="font-screenplay text-sm leading-relaxed selectable space-y-1">
      {/* Example scene heading */}
      <SceneHeadingBlock>INT. COFFEE SHOP - DAY</SceneHeadingBlock>

      {/* Example action */}
      <ActionBlock>
        The shop is nearly empty. A ceiling fan turns slowly overhead. MARA (30s, sharp eyes, paint
        on her fingers) sits alone at the bar, a cold cup of coffee in front of her.
      </ActionBlock>

      <ActionBlock>She stares at her phone.</ActionBlock>

      {/* Example character + dialogue */}
      <CharacterBlock>MARA</CharacterBlock>
      <DialogueBlock>He said he&apos;d be here by eight.</DialogueBlock>

      {/* Example action */}
      <ActionBlock>
        The door opens. JAKE (40s, rumpled jacket, unhurried) steps in and scans the room.
      </ActionBlock>

      <CharacterBlock>JAKE</CharacterBlock>
      <ParentheticalBlock>looking around</ParentheticalBlock>
      <DialogueBlock>Sorry. Bus.</DialogueBlock>

      <ActionBlock>He sits across from her. She doesn&apos;t look up.</ActionBlock>

      {/* Transition */}
      <TransitionBlock>CUT TO:</TransitionBlock>

      {/* Second scene */}
      <SceneHeadingBlock>EXT. STREET - CONTINUOUS</SceneHeadingBlock>

      <ActionBlock>
        They walk in silence. The city carries on around them — indifferent, efficient.
      </ActionBlock>

      {/* Empty line cursor placeholder */}
      <div className="h-8 border-l-2 border-so-accent animate-pulse mt-4 ml-1 opacity-40" />

      {/* Phase 2 note */}
      <div className="mt-12 pt-6 border-t border-so-border-dim text-center">
        <p className="text-xxs text-so-text-3">
          Phase 1 scaffold — screenplay editor coming in Phase 2
        </p>
      </div>
    </div>
  )
}

// ── Screenplay element display components ─────────────────────────────────────
// These match standard screenplay formatting and will be replaced by the real
// editor's block renderer in Phase 2.

function SceneHeadingBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-6 mb-1">
      <p className="text-so-scene font-bold uppercase tracking-wide">{children}</p>
    </div>
  )
}

function ActionBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-1">
      <p className="text-so-action">{children}</p>
    </div>
  )
}

function CharacterBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-4 ml-24">
      <p className="text-so-character uppercase font-medium">{children}</p>
    </div>
  )
}

function ParentheticalBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="ml-16">
      <p className="text-so-paren">({children})</p>
    </div>
  )
}

function DialogueBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="ml-12 mr-16 mb-1">
      <p className="text-so-dialogue">{children}</p>
    </div>
  )
}

function TransitionBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-4 mb-1 text-right">
      <p className="text-so-transition uppercase">{children}</p>
    </div>
  )
}

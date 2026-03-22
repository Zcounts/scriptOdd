import React from 'react'
import { Grid3X3, Plus, Film } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'

/**
 * Board View — Phase 1 placeholder.
 *
 * In Phase 4 this will be a full index-card / outline board with:
 *   - Drag-to-reorder scenes
 *   - Per-card synopsis editing
 *   - Color labeling
 *   - Column grouping (act structure)
 *   - Click to jump to scene in editor
 */
export function BoardView(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Board toolbar */}
      <div className="flex items-center h-8 px-4 border-b border-so-border-dim bg-so-surface flex-shrink-0">
        <Grid3X3 size={12} className="text-so-text-3 mr-2" />
        <span className="text-xxs text-so-text-3 uppercase tracking-wider">Board View</span>

        <div className="flex-1" />

        <Tooltip content="Add Scene Card" side="left">
          <IconButton label="Add Scene" size="sm">
            <Plus size={13} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Board canvas */}
      <div className="flex-1 overflow-auto p-6">
        {scenes.length === 0 ? (
          <EmptyBoard />
        ) : (
          <SceneBoard scenes={scenes} />
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBoard(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-so-elevated border border-so-border flex items-center justify-center">
        <Film size={28} className="text-so-text-3" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-so-text-2">No scenes yet</p>
        <p className="text-xs text-so-text-3 max-w-xs leading-relaxed">
          Index cards will appear here as you write scenes. You can drag to reorder, add synopses,
          and color-code by act or story beat.
        </p>
      </div>
      <p className="text-xxs text-so-text-3 italic">
        Drag-and-drop board coming in Phase 4
      </p>

      {/* Preview cards — static demo */}
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        {DEMO_CARDS.map((card) => (
          <DemoCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  )
}

// ── Scene board (when scenes exist) ───────────────────────────────────────────

function SceneBoard({ scenes }: { scenes: ReturnType<typeof useDocumentStore.getState>['scenes'] }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-3 content-start">
      {scenes.map((scene, i) => (
        <SceneCard
          key={scene.id}
          number={i + 1}
          heading={scene.heading}
          synopsis={scene.synopsis}
          color={scene.color}
        />
      ))}
    </div>
  )
}

// ── Index card components ─────────────────────────────────────────────────────

interface SceneCardProps {
  number: number
  heading: string
  synopsis?: string
  color?: string | null
}

function SceneCard({ number, heading, synopsis, color }: SceneCardProps): React.JSX.Element {
  return (
    <div
      className="w-48 min-h-28 rounded-lg bg-so-elevated border border-so-border p-3 flex flex-col gap-1.5 cursor-pointer hover:border-so-accent transition-colors"
      style={color ? { borderTopColor: color, borderTopWidth: 3 } : {}}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xxs text-so-text-3 font-mono">{String(number).padStart(2, '0')}</span>
      </div>
      <p className="text-xs font-semibold text-so-scene uppercase leading-tight">{heading}</p>
      {synopsis && (
        <p className="text-xxs text-so-text-2 leading-relaxed flex-1">{synopsis}</p>
      )}
    </div>
  )
}

interface DemoCardData {
  id: number
  number: number
  heading: string
  synopsis: string
  color: string
}

function DemoCard({ number, heading, synopsis, color }: DemoCardData): React.JSX.Element {
  return (
    <div
      className="w-44 min-h-24 rounded-lg bg-so-elevated border border-so-border opacity-40 p-3 flex flex-col gap-1.5"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xxs text-so-text-3 font-mono">{String(number).padStart(2, '0')}</span>
      </div>
      <p className="text-xs font-semibold text-so-scene uppercase leading-tight">{heading}</p>
      <p className="text-xxs text-so-text-2 leading-relaxed">{synopsis}</p>
    </div>
  )
}

const DEMO_CARDS: DemoCardData[] = [
  {
    id: 1,
    number: 1,
    heading: 'INT. COFFEE SHOP - DAY',
    synopsis: 'Mara waits. Jake is late. Something between them is unresolved.',
    color: '#4ec994',
  },
  {
    id: 2,
    number: 2,
    heading: 'EXT. STREET - CONTINUOUS',
    synopsis: 'They walk. Silence louder than words.',
    color: '#9bbfe8',
  },
  {
    id: 3,
    number: 3,
    heading: 'INT. JAKE\'S APARTMENT - NIGHT',
    synopsis: 'The truth surfaces. Neither of them was ready.',
    color: '#e8945a',
  },
]

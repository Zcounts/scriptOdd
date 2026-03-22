import React from 'react'
import { MessageSquare, AlignLeft, Plus } from 'lucide-react'
import { useLayoutStore } from '../../store/layoutStore'
import { useDocumentStore } from '../../store/documentStore'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { RightPanelTab } from '../../types'

const TABS: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'notes',   label: 'Notes',   icon: <MessageSquare size={13} /> },
  { id: 'outline', label: 'Outline', icon: <AlignLeft size={13} /> },
]

export function RightPanel(): React.JSX.Element {
  const { rightPanelTab, setRightPanelTab } = useLayoutStore()

  return (
    <div className="flex flex-col h-full bg-so-surface border-l border-so-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-so-border-dim bg-so-bg flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRightPanelTab(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2',
              'text-xs font-medium',
              'border-b-2 transition-colors duration-100',
              rightPanelTab === tab.id
                ? 'border-so-accent text-so-text'
                : 'border-transparent text-so-text-3 hover:text-so-text-2',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        <div className="flex-1" />

        <Tooltip content="Add Note" side="left">
          <IconButton label="Add Note" size="sm" className="mr-1">
            <Plus size={13} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'notes' && <NotesPanel />}
        {rightPanelTab === 'outline' && <OutlinePanel />}
      </div>
    </div>
  )
}

// ── Notes panel ───────────────────────────────────────────────────────────────

function NotesPanel(): React.JSX.Element {
  const notes = useDocumentStore((s) => s.notes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)

  const sceneNotes = notes.filter((n) => n.sceneId === activeSceneId)
  const projectNotes = notes.filter((n) => n.sceneId === null)

  return (
    <div className="p-3 space-y-4">
      {activeSceneId && (
        <section>
          <h3 className="text-xxs font-semibold text-so-text-3 uppercase tracking-wider mb-2">
            Scene Notes
          </h3>
          {sceneNotes.length === 0 ? (
            <p className="text-xxs text-so-text-3 italic">No notes for this scene.</p>
          ) : (
            <ul className="space-y-2">
              {sceneNotes.map((note) => (
                <NoteCard key={note.id} content={note.content} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h3 className="text-xxs font-semibold text-so-text-3 uppercase tracking-wider mb-2">
          Project Notes
        </h3>
        {projectNotes.length === 0 ? (
          <EmptyNotes />
        ) : (
          <ul className="space-y-2">
            {projectNotes.map((note) => (
              <NoteCard key={note.id} content={note.content} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function NoteCard({ content }: { content: string }): React.JSX.Element {
  return (
    <li className="bg-so-elevated border border-so-border rounded p-2">
      <p className="text-xs text-so-text-2 leading-relaxed selectable">{content}</p>
    </li>
  )
}

function EmptyNotes(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <MessageSquare size={22} className="text-so-text-3" />
      <p className="text-xs text-so-text-3">No notes yet</p>
      <p className="text-xxs text-so-text-3">
        Press the + button to add a project note.
      </p>
    </div>
  )
}

// ── Outline panel ─────────────────────────────────────────────────────────────

function OutlinePanel(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AlignLeft size={22} className="text-so-text-3" />
        <p className="text-xs text-so-text-3">No scenes yet</p>
        <p className="text-xxs text-so-text-3">
          Your scene outline will appear here as you write.
        </p>
      </div>
    )
  }

  return (
    <ul className="p-3 space-y-2">
      {scenes.map((scene, i) => (
        <li key={scene.id} className="flex gap-2">
          <span className="text-xxs text-so-text-3 mt-0.5 w-5 text-right flex-shrink-0">
            {i + 1}
          </span>
          <div>
            <p className="text-xs text-so-scene font-medium">{scene.heading}</p>
            {scene.synopsis && (
              <p className="text-xxs text-so-text-3 mt-0.5 leading-relaxed">{scene.synopsis}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

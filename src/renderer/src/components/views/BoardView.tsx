import React, { useState, useRef } from 'react'
import { LayoutGrid, Film, StickyNote } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { jumpToSceneById, reorderScenesInEditor } from '../../editor/sceneUtils'
import type { Scene } from '../../types'

export function BoardView(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden view-canvas">
      <div className="editor-chrome flex items-center h-11 px-5 flex-shrink-0 gap-3">
        <LayoutGrid size={13} strokeWidth={1.7} className="text-so-accent" />
        <span className="text-[11px] uppercase tracking-[0.24em] text-so-text-2">Board</span>
        <div className="chrome-divider" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-so-text-3">Drag cards to reorder · Click to edit</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {scenes.length === 0 ? <EmptyBoard /> : <SceneBoard scenes={scenes} activeSceneId={activeSceneId} />}
      </div>
    </div>
  )
}

export function CompactBoardPanel(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
        <Film size={22} className="text-so-text-3" />
        <p className="text-xs text-so-text-3">No scenes yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {scenes.map((scene, i) => (
        <CompactCard key={scene.id} scene={scene} number={i + 1} isActive={activeSceneId === scene.id} />
      ))}
    </div>
  )
}

interface SceneBoardProps {
  scenes: Scene[]
  activeSceneId: string | null
}

function SceneBoard({ scenes, activeSceneId }: SceneBoardProps): React.JSX.Element {
  const reorderScenes = useDocumentStore((s) => s.reorderScenes)
  const editor = useScreenplayEditor()
  const { setActiveView } = useLayoutStore()

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPos, setDropPos] = useState<'before' | 'after'>('after')
  const dragCounter = useRef(0)

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === draggedId) return
    setDragOverId(id)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropPos(e.clientX < rect.left + rect.width / 2 ? 'before' : 'after')
  }

  function handleDragEnter() {
    dragCounter.current += 1
  }

  function handleDragLeave() {
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOverId(null)
    }
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    dragCounter.current = 0
    setDragOverId(null)

    const sourceId = draggedId
    setDraggedId(null)
    if (!sourceId || sourceId === targetId) return

    const ids = scenes.map((s) => s.id)
    const srcIdx = ids.indexOf(sourceId)
    const tgtIdx = ids.indexOf(targetId)
    if (srcIdx === -1 || tgtIdx === -1) return

    const newIds = [...ids]
    newIds.splice(srcIdx, 1)
    const insertAt = dropPos === 'before' ? newIds.indexOf(targetId) : newIds.indexOf(targetId) + 1
    newIds.splice(insertAt, 0, sourceId)

    reorderScenes(newIds)
    if (editor) reorderScenesInEditor(editor, newIds)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
    dragCounter.current = 0
  }

  function handleCardClick(sceneId: string) {
    if (editor) {
      setActiveView('draft')
      setTimeout(() => jumpToSceneById(editor, sceneId), 50)
    }
  }

  return (
    <div className="flex flex-wrap gap-4 content-start" onDragEnd={handleDragEnd}>
      {scenes.map((scene, i) => {
        const isDragging = draggedId === scene.id
        const isOver = dragOverId === scene.id

        return (
          <div
            key={scene.id}
            className="relative"
            draggable
            onDragStart={(e) => handleDragStart(e, scene.id)}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => handleDragOver(e, scene.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, scene.id)}
          >
            {isOver && dropPos === 'before' && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-so-accent z-10 pointer-events-none rounded" />
            )}

            <SceneCard
              scene={scene}
              number={i + 1}
              isDragging={isDragging}
              isActive={activeSceneId === scene.id}
              onClick={() => handleCardClick(scene.id)}
            />

            {isOver && dropPos === 'after' && (
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-so-accent z-10 pointer-events-none rounded" />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface SceneCardProps {
  scene: Scene
  number: number
  isDragging?: boolean
  isActive?: boolean
  onClick?: () => void
}

function SceneCard({ scene, number, isDragging = false, isActive = false, onClick }: SceneCardProps): React.JSX.Element {
  const accentColor = scene.color ?? undefined

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={[
        'w-56 min-h-36 rounded-[22px] border flex flex-col cursor-pointer transition-all duration-150 outline-none',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] shadow-[0_18px_34px_rgba(0,0,0,0.12)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(0,0,0,0.16)]',
        'focus-visible:ring-2 focus-visible:ring-so-accent focus-visible:ring-offset-1',
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : '',
        isActive ? 'border-[color:rgba(202,162,75,0.4)]' : 'border-so-border',
      ].join(' ')}
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: 3 } : { backgroundColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
        <span className="text-xxs text-so-text-3 font-mono tabular-nums">{String(number).padStart(2, '0')}</span>
        <div className="flex-1" />
        {scene.noteIds.length > 0 && (
          <span className="flex items-center gap-0.5 text-xxs text-so-text-3">
            <StickyNote size={9} />
            <span>{scene.noteIds.length}</span>
          </span>
        )}
      </div>

      <div className="px-3 pb-1.5">
        <p className="text-xs font-semibold text-so-text uppercase leading-tight">{scene.heading || 'UNTITLED SCENE'}</p>
      </div>

      {scene.synopsis && (
        <div className="px-3 pb-2 flex-1">
          <p className="text-xxs text-so-text-2 leading-relaxed line-clamp-4">{scene.synopsis}</p>
        </div>
      )}


    </div>
  )
}

function CompactCard({ scene, number, isActive = false }: { scene: Scene; number: number; isActive?: boolean }) {
  return (
    <div
      className={[
        'rounded-2xl border px-3 py-2.5 bg-white/5 transition-colors',
        isActive ? 'border-[color:rgba(202,162,75,0.4)] bg-[rgba(202,162,75,0.1)]' : 'border-so-border',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-xxs uppercase tracking-[0.18em] text-so-text-3">
        <span>{String(number).padStart(2, '0')}</span>
        <span>Scene</span>
      </div>
      <p className="mt-1 text-xs font-medium text-so-text">{scene.heading || 'Untitled scene'}</p>
      {scene.synopsis && <p className="mt-1 text-xxs leading-relaxed text-so-text-2">{scene.synopsis}</p>}
    </div>
  )
}

function EmptyBoard(): React.JSX.Element {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-[28px] border border-so-border bg-white/5 px-8 py-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
      <Film size={24} className="mx-auto text-so-accent" />
      <p className="mt-3 text-sm text-so-text">No scenes yet</p>
      <p className="mt-1 text-xs text-so-text-3">Your outline cards will appear here as you write scene headings.</p>
    </div>
  )
}

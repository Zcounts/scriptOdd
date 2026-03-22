import React, { useState, useRef, useEffect } from 'react'
import { LayoutGrid, Film, StickyNote, Pencil, Check, X } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { jumpToSceneById, reorderScenesInEditor } from '../../editor/sceneUtils'
import type { Scene, SceneStatus } from '../../types'
import { SCENE_STATUS_CONFIG } from '../../types'

// ── Status utilities ──────────────────────────────────────────────────────────

const STATUS_ORDER: SceneStatus[] = ['not-started', 'in-progress', 'needs-revision', 'complete']

interface StatusPickerProps {
  status?: SceneStatus
  onSelect: (s: SceneStatus | null) => void
  onClose: () => void
}

function StatusPickerDropdown({ status, onSelect, onClose }: StatusPickerProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-so-elevated border border-so-border rounded-lg shadow-lg py-1 min-w-[148px]"
      onClick={(e) => e.stopPropagation()}
    >
      {STATUS_ORDER.map((s) => {
        const cfg = SCENE_STATUS_CONFIG[s]
        return (
          <button
            key={s}
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-so-text hover:bg-so-active transition-colors text-left"
            onClick={() => { onSelect(s); onClose() }}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span>{cfg.label}</span>
            {status === s && <Check size={10} className="ml-auto text-so-accent" />}
          </button>
        )
      })}
      {status && (
        <button
          type="button"
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-so-text-3 hover:bg-so-active transition-colors text-left border-t border-so-border-dim"
          onClick={() => { onSelect(null); onClose() }}
        >
          <span className="w-2.5 h-2.5 rounded-full border border-current flex-shrink-0 opacity-40" />
          <span>Clear status</span>
        </button>
      )}
    </div>
  )
}

export function BoardView(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const updateScene = useDocumentStore((s) => s.updateScene)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden view-canvas">
      <div className="editor-chrome flex items-center h-11 px-5 flex-shrink-0 gap-3">
        <LayoutGrid size={13} strokeWidth={1.7} className="text-so-accent" />
        <span className="text-[11px] uppercase tracking-[0.24em] text-so-text-2">Board</span>
        <div className="chrome-divider" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-so-text-3">Drag cards to reorder · Click to edit</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {scenes.length === 0 ? <EmptyBoard /> : <SceneBoard scenes={scenes} activeSceneId={activeSceneId} updateScene={updateScene} />}
      </div>
    </div>
  )
}

export function CompactBoardPanel(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const updateScene = useDocumentStore((s) => s.updateScene)

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
        <CompactCard
          key={scene.id}
          scene={scene}
          number={i + 1}
          isActive={activeSceneId === scene.id}
          onUpdateScene={(patch) => updateScene(scene.id, patch)}
        />
      ))}
    </div>
  )
}

interface SceneBoardProps {
  scenes: Scene[]
  activeSceneId: string | null
  updateScene: (id: string, patch: { title?: string; status?: SceneStatus | null }) => void
}

function SceneBoard({ scenes, activeSceneId, updateScene }: SceneBoardProps): React.JSX.Element {
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

    // Use dataTransfer — set synchronously in handleDragStart and always reliable
    // at drop time, unlike React state which may be stale in the closure.
    const sourceId = e.dataTransfer.getData('text/plain')
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
              onUpdateScene={(patch) => updateScene(scene.id, patch)}
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
  onUpdateScene: (patch: { title?: string; status?: SceneStatus | null }) => void
}

function SceneCard({ scene, number, isDragging = false, isActive = false, onClick, onUpdateScene }: SceneCardProps): React.JSX.Element {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(scene.title ?? '')
  const [statusPickerOpen, setStatusPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTitle) {
      setTitleDraft(scene.title ?? '')
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editingTitle])

  function commitTitle() {
    const trimmed = titleDraft.trim()
    onUpdateScene({ title: trimmed || undefined })
    setEditingTitle(false)
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
    if (e.key === 'Escape') setEditingTitle(false)
    e.stopPropagation()
  }

  const statusColor = scene.status ? SCENE_STATUS_CONFIG[scene.status].color : undefined

  return (
    <div
      className={[
        'w-56 min-h-36 rounded-[22px] border flex overflow-hidden transition-all duration-150 outline-none group/card',
        'shadow-[0_18px_34px_rgba(0,0,0,0.12)]',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(0,0,0,0.16)]',
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : '',
        isActive ? 'border-[color:rgba(202,162,75,0.4)]' : 'border-so-border',
      ].join(' ')}
      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
    >
      {/* Left-edge status stripe */}
      <div
        className="w-1 flex-shrink-0 rounded-l-[22px] transition-colors duration-200"
        style={{ backgroundColor: statusColor ?? 'transparent' }}
      />

      {/* Card content */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        className="flex-1 flex flex-col cursor-pointer focus-visible:ring-2 focus-visible:ring-so-accent focus-visible:ring-offset-1 outline-none"
      >
        {/* Header row: number + status dot + notes */}
        <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
          <span className="text-xxs text-so-text-3 font-mono tabular-nums">{String(number).padStart(2, '0')}</span>

          {/* Status dot / picker */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="w-2.5 h-2.5 rounded-full border transition-opacity hover:opacity-100 focus:outline-none"
              style={
                statusColor
                  ? { backgroundColor: statusColor, borderColor: statusColor }
                  : { backgroundColor: 'transparent', borderColor: 'currentColor', opacity: 0.25 }
              }
              title={scene.status ? SCENE_STATUS_CONFIG[scene.status].label : 'Set status'}
              onClick={() => setStatusPickerOpen((v) => !v)}
            />
            {statusPickerOpen && (
              <StatusPickerDropdown
                status={scene.status}
                onSelect={(s) => onUpdateScene({ status: s })}
                onClose={() => setStatusPickerOpen(false)}
              />
            )}
          </div>

          <div className="flex-1" />

          {/* Edit title button */}
          <button
            type="button"
            className="opacity-0 group-hover/card:opacity-40 hover:!opacity-100 text-so-text-3 transition-opacity"
            onClick={(e) => { e.stopPropagation(); setEditingTitle(true) }}
            title="Edit scene title"
          >
            <Pencil size={9} />
          </button>

          {scene.noteIds.length > 0 && (
            <span className="flex items-center gap-0.5 text-xxs text-so-text-3">
              <StickyNote size={9} />
              <span>{scene.noteIds.length}</span>
            </span>
          )}
        </div>

        {/* Title (prominent) + heading (subtitle) */}
        <div className="px-3 pb-1.5">
          {scene.title ? (
            <>
              <p className="text-sm font-semibold text-so-text leading-tight">{scene.title}</p>
              <p className="text-xxs text-so-scene uppercase mt-0.5 leading-tight truncate">{scene.heading || 'UNTITLED SCENE'}</p>
            </>
          ) : (
            <p className="text-xs font-semibold text-so-scene uppercase leading-tight">{scene.heading || 'UNTITLED SCENE'}</p>
          )}
        </div>

        {scene.synopsis && (
          <div className="px-3 pb-2 flex-1">
            <p className="text-xxs text-so-text-2 leading-relaxed line-clamp-4">{scene.synopsis}</p>
          </div>
        )}

        {/* Inline title editor */}
        {editingTitle && (
          <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              <input
                ref={inputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={commitTitle}
                placeholder="Scene title…"
                className="flex-1 text-xs bg-so-elevated border border-so-accent rounded px-2 py-1 text-so-text placeholder:text-so-text-3 outline-none selectable"
              />
              <button
                type="button"
                onClick={commitTitle}
                className="px-1.5 py-1 text-so-accent hover:bg-so-elevated rounded transition-colors"
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                onClick={() => setEditingTitle(false)}
                className="px-1.5 py-1 text-so-text-3 hover:bg-so-elevated rounded transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CompactCard({
  scene,
  number,
  isActive = false,
  onUpdateScene,
}: {
  scene: Scene
  number: number
  isActive?: boolean
  onUpdateScene: (patch: { title?: string; status?: SceneStatus | null }) => void
}) {
  const [statusPickerOpen, setStatusPickerOpen] = useState(false)
  const statusColor = scene.status ? SCENE_STATUS_CONFIG[scene.status].color : undefined

  return (
    <div
      className={[
        'rounded-2xl border flex overflow-hidden transition-colors group/compact',
        isActive ? 'border-[color:rgba(202,162,75,0.4)] bg-[rgba(202,162,75,0.1)]' : 'border-so-border bg-white/5',
      ].join(' ')}
    >
      {/* Left-edge status stripe */}
      <div
        className="w-1 flex-shrink-0 rounded-l-2xl transition-colors duration-200"
        style={{ backgroundColor: statusColor ?? 'transparent' }}
      />
      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xxs uppercase tracking-[0.18em] text-so-text-3 font-mono">
            {String(number).padStart(2, '0')}
          </span>
          {/* Status dot */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="w-2 h-2 rounded-full border transition-opacity hover:opacity-100"
              style={
                statusColor
                  ? { backgroundColor: statusColor, borderColor: statusColor }
                  : { backgroundColor: 'transparent', borderColor: 'currentColor', opacity: 0.25 }
              }
              title={scene.status ? SCENE_STATUS_CONFIG[scene.status].label : 'Set status'}
              onClick={() => setStatusPickerOpen((v) => !v)}
            />
            {statusPickerOpen && (
              <StatusPickerDropdown
                status={scene.status}
                onSelect={(s) => onUpdateScene({ status: s })}
                onClose={() => setStatusPickerOpen(false)}
              />
            )}
          </div>
        </div>
        {scene.title ? (
          <>
            <p className="mt-1 text-xs font-semibold text-so-text">{scene.title}</p>
            <p className="text-xxs text-so-scene uppercase truncate">{scene.heading || 'Untitled scene'}</p>
          </>
        ) : (
          <p className="mt-1 text-xs font-medium text-so-text">{scene.heading || 'Untitled scene'}</p>
        )}
        {scene.synopsis && <p className="mt-1 text-xxs leading-relaxed text-so-text-2">{scene.synopsis}</p>}
      </div>
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

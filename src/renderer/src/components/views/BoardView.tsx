/**
 * BoardView — Phase 4
 *
 * Full index-card outline board:
 *   - Each card shows scene number, heading, synopsis, notes count, and tags
 *   - Drag-and-drop to reorder scenes
 *   - Click a card to jump to that scene in the editor (switches to Draft view)
 *   - Stays in sync with the screenplay document via documentStore
 *
 * Extension points left clean for future phases:
 *   - Notes count badge wired to scene.noteIds (full notes in Phase 5)
 *   - Tags display ready; tag editing is a future feature
 *   - Color label bar wired to scene.color
 */

import React, { useState, useRef } from 'react'
import { LayoutGrid, Film, StickyNote, Tag } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { jumpToSceneById, reorderScenesInEditor } from '../../editor/sceneUtils'
import type { Scene } from '../../types'

// ── Exported board (standalone full-screen view) ──────────────────────────────

export function BoardView(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center h-8 px-4 border-b border-so-border-dim bg-so-surface flex-shrink-0">
        <LayoutGrid size={12} className="text-so-text-3 mr-2" />
        <span className="text-xxs text-so-text-3 uppercase tracking-wider">Board View</span>
        <div className="flex-1" />
        <span className="text-xxs text-so-text-3 opacity-60">
          Drag cards to reorder · Click to edit
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-6">
        {scenes.length === 0 ? (
          <EmptyBoard />
        ) : (
          <SceneBoard scenes={scenes} activeSceneId={activeSceneId} />
        )}
      </div>
    </div>
  )
}

// ── Compact board for the right panel (editor + board layout) ─────────────────

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

// ── Scene board grid ──────────────────────────────────────────────────────────

interface SceneBoardProps {
  scenes: Scene[]
  activeSceneId: string | null
}

function SceneBoard({ scenes, activeSceneId }: SceneBoardProps): React.JSX.Element {
  const reorderScenes = useDocumentStore((s) => s.reorderScenes)
  const editor = useScreenplayEditor()
  const { setActiveView } = useLayoutStore()

  // ── Drag state ──────────────────────────────────────────────────────────
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
    // In a grid, use left/right halves to determine before/after
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
      // Switch to draft view and jump
      setActiveView('draft')
      // Small delay so the view switches before scrolling
      setTimeout(() => jumpToSceneById(editor, sceneId), 50)
    }
  }

  return (
    <div
      className="flex flex-wrap gap-4 content-start"
      onDragEnd={handleDragEnd}
    >
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
            {/* Drop indicator — left edge */}
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

            {/* Drop indicator — right edge */}
            {isOver && dropPos === 'after' && (
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-so-accent z-10 pointer-events-none rounded" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Index card ────────────────────────────────────────────────────────────────

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
        'w-52 min-h-32 rounded-lg bg-so-elevated border flex flex-col',
        'cursor-pointer transition-all duration-150 outline-none',
        'hover:shadow-md hover:-translate-y-px',
        'focus-visible:ring-2 focus-visible:ring-so-accent focus-visible:ring-offset-1',
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : '',
        isActive ? 'border-so-accent shadow-sm' : 'border-so-border',
      ].join(' ')}
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: 3 } : {}}
    >
      {/* Card header */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <span className="text-xxs text-so-text-3 font-mono tabular-nums">{String(number).padStart(2, '0')}</span>
        <div className="flex-1" />
        {/* Notes count placeholder — wired to noteIds */}
        {scene.noteIds.length > 0 && (
          <span className="flex items-center gap-0.5 text-xxs text-so-text-3">
            <StickyNote size={9} />
            <span>{scene.noteIds.length}</span>
          </span>
        )}
      </div>

      {/* Heading */}
      <div className="px-3 pb-1">
        <p className="text-xs font-semibold text-so-scene uppercase leading-tight">
          {scene.heading || 'UNTITLED SCENE'}
        </p>
      </div>

      {/* Synopsis */}
      {scene.synopsis && (
        <div className="px-3 pb-2 flex-1">
          <p className="text-xxs text-so-text-2 leading-relaxed line-clamp-4">
            {scene.synopsis}
          </p>
        </div>
      )}

      {/* Tags row — extension point for future tag editing */}
      {/* Tags would come from scene.tags once the data model is extended */}
      <div className="px-3 pb-2.5 flex flex-wrap gap-1 mt-auto">
        {/* placeholder — tags currently stored on blocks, not scenes */}
        {/* When tag support lands on SceneMeta, render here */}
      </div>
    </div>
  )
}

// ── Compact card (for right panel board tab) ──────────────────────────────────

interface CompactCardProps {
  scene: Scene
  number: number
  isActive: boolean
}

function CompactCard({ scene, number, isActive }: CompactCardProps): React.JSX.Element {
  const editor = useScreenplayEditor()
  const { setActiveView } = useLayoutStore()
  const setActiveScene = useDocumentStore((s) => s.setActiveScene)

  function handleClick() {
    setActiveScene(scene.id)
    if (editor) {
      setActiveView('draft')
      setTimeout(() => jumpToSceneById(editor, scene.id), 50)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'w-full text-left rounded-md border p-2.5 transition-all duration-100',
        'hover:border-so-accent hover:bg-so-active',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-so-accent',
        isActive ? 'border-so-accent bg-so-active' : 'border-so-border bg-so-elevated',
      ].join(' ')}
      style={scene.color ? { borderLeftColor: scene.color, borderLeftWidth: 3 } : {}}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xxs text-so-text-3 font-mono">{String(number).padStart(2, '0')}</span>
        {scene.noteIds.length > 0 && (
          <span className="ml-auto flex items-center gap-0.5 text-xxs text-so-text-3">
            <StickyNote size={9} />
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-so-scene uppercase leading-tight truncate">
        {scene.heading || 'UNTITLED SCENE'}
      </p>
      {scene.synopsis && (
        <p className="text-xxs text-so-text-3 mt-0.5 line-clamp-2 leading-relaxed">
          {scene.synopsis}
        </p>
      )}
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBoard(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center min-h-64">
      <div className="w-16 h-16 rounded-xl bg-so-elevated border border-so-border flex items-center justify-center">
        <Film size={28} className="text-so-text-3" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-so-text-2">No scenes yet</p>
        <p className="text-xs text-so-text-3 max-w-xs leading-relaxed">
          Switch to Draft view and start writing scene headings. Index cards will appear here automatically.
        </p>
      </div>
      <p className="text-xxs text-so-text-3 italic flex items-center gap-1.5">
        <Tag size={11} />
        Drag cards to reorder · Color labels · Act grouping coming soon
      </p>
    </div>
  )
}

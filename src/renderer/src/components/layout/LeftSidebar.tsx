/**
 * LeftSidebar — Phase 4
 *
 * Navigator panel now supports:
 *   - Click scene → jump editor to that scene heading
 *   - Drag-and-drop reordering → updates both store and editor document
 *   - Note indicator (dot) when scene has attached noteIds
 *   - Active scene highlight driven by cursor position
 */

import React, { useState, useRef } from 'react'
import { List, Users, MapPin, Film, GripVertical, StickyNote } from 'lucide-react'
import { useLayoutStore } from '../../store/layoutStore'
import { useDocumentStore } from '../../store/documentStore'
import { useAutocompleteStore } from '../../store/autocompleteStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { jumpToSceneById, reorderScenesInEditor } from '../../editor/sceneUtils'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { Scene, SidebarTab } from '../../types'

const TABS: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'navigator',  label: 'Scene Navigator', icon: <List size={15} /> },
  { id: 'characters', label: 'Characters',       icon: <Users size={15} /> },
  { id: 'locations',  label: 'Locations',        icon: <MapPin size={15} /> },
]

export function LeftSidebar(): React.JSX.Element {
  const { leftSidebarTab, setLeftSidebarTab } = useLayoutStore()

  return (
    <div className="flex h-full bg-so-surface border-r border-so-border overflow-hidden">
      {/* Icon rail */}
      <div className="flex flex-col items-center gap-1 py-2 px-1 w-9 border-r border-so-border-dim bg-so-bg flex-shrink-0">
        {TABS.map((tab) => (
          <Tooltip key={tab.id} content={tab.label} side="right">
            <IconButton
              label={tab.label}
              active={leftSidebarTab === tab.id}
              onClick={() => setLeftSidebarTab(tab.id)}
              size="sm"
            >
              {tab.icon}
            </IconButton>
          </Tooltip>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex flex-col flex-1 min-w-0">
        <SidebarHeader tab={leftSidebarTab} />
        <div className="flex-1 overflow-y-auto">
          {leftSidebarTab === 'navigator' && <NavigatorPanel />}
          {leftSidebarTab === 'characters' && <CharactersPanel />}
          {leftSidebarTab === 'locations' && <LocationsPanel />}
        </div>
      </div>
    </div>
  )
}

function SidebarHeader({ tab }: { tab: SidebarTab }): React.JSX.Element {
  const labels: Record<SidebarTab, string> = {
    navigator: 'Scenes',
    characters: 'Characters',
    locations: 'Locations',
  }
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-so-border-dim">
      <span className="text-xs font-semibold text-so-text-2 uppercase tracking-wider">
        {labels[tab]}
      </span>
    </div>
  )
}

// ── Navigator panel ───────────────────────────────────────────────────────────

function NavigatorPanel(): React.JSX.Element {
  const scenes = useDocumentStore((s) => s.scenes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const setActiveScene = useDocumentStore((s) => s.setActiveScene)
  const reorderScenes = useDocumentStore((s) => s.reorderScenes)
  const editor = useScreenplayEditor()

  // ── Drag state ────────────────────────────────────────────────────────────
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPos, setDropPos] = useState<'before' | 'after'>('after')
  const dragCounter = useRef(0)

  if (scenes.length === 0) {
    return (
      <EmptyState
        icon={<Film size={22} />}
        message="No scenes yet"
        sub="Scenes appear here as you write scene headings."
      />
    )
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

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
    // Determine whether to drop before or after based on pointer Y
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
  }

  function handleDragLeave() {
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOverId(null)
    }
  }

  function handleDragEnter() {
    dragCounter.current += 1
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

    // Build new order
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

  // ── Click to jump ─────────────────────────────────────────────────────────

  function handleSceneClick(scene: Scene) {
    setActiveScene(scene.id)
    if (editor) jumpToSceneById(editor, scene.id)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ul className="py-1 select-none" onDragEnd={handleDragEnd}>
      {scenes.map((scene, i) => {
        const isActive = activeSceneId === scene.id
        const isDragging = draggedId === scene.id
        const isOver = dragOverId === scene.id

        return (
          <li
            key={scene.id}
            draggable
            onDragStart={(e) => handleDragStart(e, scene.id)}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => handleDragOver(e, scene.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, scene.id)}
            className={[
              'relative group',
              isDragging ? 'opacity-40' : '',
            ].join(' ')}
          >
            {/* Drop indicator — line before */}
            {isOver && dropPos === 'before' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-so-accent z-10 pointer-events-none" />
            )}

            <button
              type="button"
              className={[
                'w-full text-left px-2 py-1.5',
                'flex items-start gap-1.5',
                'hover:bg-so-active transition-colors duration-100',
                isActive ? 'bg-so-active text-so-text' : 'text-so-text-2',
              ].join(' ')}
              onClick={() => handleSceneClick(scene)}
            >
              {/* Drag handle */}
              <span
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 text-so-text-3 cursor-grab active:cursor-grabbing"
                aria-hidden
              >
                <GripVertical size={11} />
              </span>

              {/* Scene number */}
              <span className="text-xxs text-so-text-3 mt-0.5 w-4 text-right flex-shrink-0 font-mono">
                {i + 1}
              </span>

              {/* Scene info */}
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-medium truncate text-so-scene">
                  {scene.heading || 'UNTITLED SCENE'}
                </span>
                {scene.synopsis && (
                  <span className="block text-xxs text-so-text-3 truncate mt-0.5 leading-relaxed">
                    {scene.synopsis}
                  </span>
                )}
              </span>

              {/* Note indicator placeholder */}
              {scene.noteIds.length > 0 && (
                <Tooltip content={`${scene.noteIds.length} note${scene.noteIds.length > 1 ? 's' : ''}`} side="right">
                  <span className="flex-shrink-0 mt-0.5 text-so-text-3 opacity-60">
                    <StickyNote size={10} />
                  </span>
                </Tooltip>
              )}
            </button>

            {/* Drop indicator — line after */}
            {isOver && dropPos === 'after' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-so-accent z-10 pointer-events-none" />
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ── Characters panel ──────────────────────────────────────────────────────────

function CharactersPanel(): React.JSX.Element {
  const characters = useAutocompleteStore((s) => s.characters)

  if (characters.length === 0) {
    return (
      <EmptyState
        icon={<Users size={22} />}
        message="No characters yet"
        sub="Characters you use in dialogue will be remembered here."
      />
    )
  }

  return (
    <ul className="py-1">
      {characters.map((name) => (
        <li key={name}>
          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-so-active transition-colors">
            <span className="w-2 h-2 rounded-full bg-so-character flex-shrink-0" />
            <span className="text-xs text-so-character font-medium">{name}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Locations panel ───────────────────────────────────────────────────────────

function LocationsPanel(): React.JSX.Element {
  const locations = useAutocompleteStore((s) => s.locations)

  if (locations.length === 0) {
    return (
      <EmptyState
        icon={<MapPin size={22} />}
        message="No locations yet"
        sub="Locations from scene headings will appear here."
      />
    )
  }

  return (
    <ul className="py-1">
      {locations.map((loc) => (
        <li key={loc}>
          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-so-active transition-colors">
            <span className="w-2 h-2 rounded-full bg-so-scene flex-shrink-0" />
            <span className="text-xs text-so-scene font-medium">{loc}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Shared empty state ────────────────────────────────────────────────────────

function EmptyState({
  icon,
  message,
  sub,
}: {
  icon: React.ReactNode
  message: string
  sub: string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center mt-8">
      <span className="text-so-text-3">{icon}</span>
      <p className="text-xs font-medium text-so-text-3">{message}</p>
      <p className="text-xxs text-so-text-3 leading-relaxed">{sub}</p>
    </div>
  )
}

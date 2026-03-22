/**
 * LeftSidebar — Phase 5
 *
 * Four tabs:
 *   - Navigator  : scene list with drag-and-drop reordering
 *   - Characters : remembered character names with semantic color swatches
 *   - Locations  : remembered location names with semantic color swatches
 *   - Props      : manually registered props with color swatches + CRUD
 *
 * Character/location color swatches match the semantic highlight colors shown
 * in the editor — same color index = same visual color everywhere.
 */

import React, { useState, useRef } from 'react'
import { List, Users, MapPin, Film, GripVertical, StickyNote, Tag, X, Plus } from 'lucide-react'
import { useLayoutStore } from '../../store/layoutStore'
import { useDocumentStore } from '../../store/documentStore'
import { useAutocompleteStore } from '../../store/autocompleteStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { jumpToSceneById, reorderScenesInEditor } from '../../editor/sceneUtils'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { Scene, SidebarTab } from '../../types'

// ── Semantic color swatch lookup ──────────────────────────────────────────────

/** Returns a CSS class that renders the semantic character color for index ci */
function charSwatchClass(ci: number): string {
  return `sem-swatch-char sem-swatch-char-${ci}`
}

/** Returns a CSS class that renders the semantic location color for index li */
function locSwatchClass(li: number): string {
  return `sem-swatch-loc sem-swatch-loc-${li}`
}

// ── Tab definition ────────────────────────────────────────────────────────────

const TABS: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'navigator',  label: 'Scene Navigator', icon: <List size={15} /> },
  { id: 'characters', label: 'Characters',       icon: <Users size={15} /> },
  { id: 'locations',  label: 'Locations',        icon: <MapPin size={15} /> },
  { id: 'props',      label: 'Props',            icon: <Tag size={15} /> },
]

export function LeftSidebar(): React.JSX.Element {
  const { leftSidebarTab, setLeftSidebarTab } = useLayoutStore()

  return (
    <div className="shell-panel flex h-full border-r overflow-hidden">
      {/* Icon rail */}
      <div className="flex flex-col items-center gap-1 py-3 px-1.5 w-12 border-r border-so-border-dim bg-[rgba(0,0,0,0.08)] flex-shrink-0">
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
          {leftSidebarTab === 'navigator'  && <NavigatorPanel />}
          {leftSidebarTab === 'characters' && <CharactersPanel />}
          {leftSidebarTab === 'locations'  && <LocationsPanel />}
          {leftSidebarTab === 'props'      && <PropsPanel />}
        </div>
      </div>
    </div>
  )
}

function SidebarHeader({ tab }: { tab: SidebarTab }): React.JSX.Element {
  const labels: Record<SidebarTab, string> = {
    navigator:  'Scenes',
    characters: 'Characters',
    locations:  'Locations',
    props:      'Props',
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

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPos, setDropPos] = useState<'before' | 'after'>('after')
  const dragCounter = useRef(0)

  if (scenes.length === 0) {
    return (
      <EmptyState
        icon={<Film size={22} />}
        message="No scenes yet"
        sub="Press Ctrl+Enter to create your first scene."
      />
    )
  }

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

  function handleSceneClick(scene: Scene) {
    setActiveScene(scene.id)
    if (editor) jumpToSceneById(editor, scene.id)
  }

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
            className={['relative group', isDragging ? 'opacity-40' : ''].join(' ')}
          >
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
              <span className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 text-so-text-3 cursor-grab active:cursor-grabbing" aria-hidden>
                <GripVertical size={11} />
              </span>
              <span className="text-xxs text-so-text-3 mt-0.5 w-4 text-right flex-shrink-0 font-mono">
                {i + 1}
              </span>
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
              {scene.noteIds.length > 0 && (
                <Tooltip content={`${scene.noteIds.length} note${scene.noteIds.length > 1 ? 's' : ''}`} side="right">
                  <span className="flex-shrink-0 mt-0.5 text-so-text-3 opacity-60">
                    <StickyNote size={10} />
                  </span>
                </Tooltip>
              )}
            </button>

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
  const { characters, characterColors } = useAutocompleteStore()

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
      {characters.map((name) => {
        const ci = characterColors[name]
        return (
          <li key={name}>
            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-so-active transition-colors">
              {ci !== undefined ? (
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${charSwatchClass(ci)}`} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-so-character flex-shrink-0" />
              )}
              <span className="text-xs text-so-character font-medium">{name}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Locations panel ───────────────────────────────────────────────────────────

function LocationsPanel(): React.JSX.Element {
  const { locations, locationColors } = useAutocompleteStore()

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
      {locations.map((loc) => {
        const li = locationColors[loc]
        return (
          <li key={loc}>
            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-so-active transition-colors">
              {li !== undefined ? (
                <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${locSwatchClass(li)}`} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-sm bg-so-scene flex-shrink-0" />
              )}
              <span className="text-xs text-so-scene font-medium">{loc}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Props panel ───────────────────────────────────────────────────────────────

function PropsPanel(): React.JSX.Element {
  const { props, propColors, addProp, removeProp } = useAutocompleteStore()
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const name = input.trim()
    if (name) {
      addProp(name)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="px-3 py-2 border-b border-so-border-dim flex-shrink-0">
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New prop name…"
            className="flex-1 text-xs bg-so-elevated border border-so-border rounded px-2 py-1 text-so-text placeholder:text-so-text-3 outline-none focus:border-so-accent selectable"
          />
          <Tooltip content="Add prop" side="right">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!input.trim()}
              className="px-2 py-1 text-xs bg-so-elevated border border-so-border rounded hover:border-so-accent text-so-text-2 hover:text-so-text transition-colors disabled:opacity-40"
            >
              <Plus size={12} />
            </button>
          </Tooltip>
        </div>
        <p className="text-xxs text-so-text-3 mt-1.5 leading-relaxed">
          Props are highlighted consistently wherever they appear.
        </p>
      </div>

      {/* List */}
      {props.length === 0 ? (
        <EmptyState
          icon={<Tag size={22} />}
          message="No props yet"
          sub="Add props to track them with consistent colors."
        />
      ) : (
        <ul className="py-1 flex-1 overflow-y-auto">
          {props.map((name) => {
            const ci = propColors[name]
            return (
              <li key={name} className="group">
                <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-so-active transition-colors">
                  {ci !== undefined ? (
                    <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${charSwatchClass(ci % 8)}`} />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-sm bg-so-text-3 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-xs text-so-text-2 font-medium">{name}</span>
                  <button
                    type="button"
                    onClick={() => removeProp(name)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-so-error transition-opacity"
                    aria-label={`Remove ${name}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
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

import React from 'react'
import { List, Users, MapPin, ChevronRight, Film } from 'lucide-react'
import { useLayoutStore } from '../../store/layoutStore'
import { useDocumentStore } from '../../store/documentStore'
import { useAutocompleteStore } from '../../store/autocompleteStore'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { SidebarTab } from '../../types'

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

  if (scenes.length === 0) {
    return <EmptyState icon={<Film size={22} />} message="No scenes yet" sub="Scenes will appear here as you write." />
  }

  return (
    <ul className="py-1">
      {scenes.map((scene, i) => (
        <li key={scene.id}>
          <button
            type="button"
            className={[
              'w-full text-left px-3 py-1.5',
              'flex items-start gap-2',
              'hover:bg-so-active transition-colors duration-100',
              activeSceneId === scene.id ? 'bg-so-active text-so-text' : 'text-so-text-2',
            ].join(' ')}
            onClick={() => setActiveScene(scene.id)}
          >
            <span className="text-xxs text-so-text-3 mt-0.5 w-5 text-right flex-shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-medium truncate text-so-scene">
                {scene.heading || 'UNTITLED SCENE'}
              </span>
              {scene.synopsis && (
                <span className="block text-xxs text-so-text-3 truncate mt-0.5">
                  {scene.synopsis}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
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

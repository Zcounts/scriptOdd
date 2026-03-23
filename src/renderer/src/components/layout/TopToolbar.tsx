import React from 'react'
import {
  FilePlus,
  FolderOpen,
  Save,
  Download,
  LayoutTemplate,
  BookOpen,
  Grid3X3,
  PanelLeft,
  PanelRight,
  Maximize2,
  Settings,
  Search,
  Moon,
  Sun,
  Contrast,
} from 'lucide-react'
import { useLayoutStore } from '../../store/layoutStore'
import { useAppStore } from '../../store/appStore'
import { useProjectStore } from '../../store/projectStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useProjectOperations } from '../../hooks/useProjectOperations'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { ViewMode } from '../../types'

const VIEW_MODES: { id: ViewMode; label: string; shortLabel: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'draft', label: 'Draft View', shortLabel: 'Draft', icon: <LayoutTemplate size={14} strokeWidth={1.7} />, shortcut: 'Ctrl+1' },
  { id: 'page', label: 'Outline View', shortLabel: 'Outline', icon: <BookOpen size={14} strokeWidth={1.7} />, shortcut: 'Ctrl+2' },
  { id: 'board', label: 'Board View', shortLabel: 'Board', icon: <Grid3X3 size={14} strokeWidth={1.7} />, shortcut: 'Ctrl+3' },
]

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === 'dark') return <Moon size={15} strokeWidth={1.7} />
  if (theme === 'light') return <Sun size={15} strokeWidth={1.7} />
  return <Contrast size={15} strokeWidth={1.7} />
}

function themeLabel(theme: string) {
  if (theme === 'dark') return 'Light Mode'
  if (theme === 'light') return 'Draft Mode'
  return 'Dark Mode'
}

export function TopToolbar(): React.JSX.Element {
  const {
    activeView,
    setActiveView,
    leftSidebarVisible,
    rightPanelVisible,
    toggleLeftSidebar,
    toggleRightPanel,
    focusMode,
    toggleFocusMode,
  } = useLayoutStore()
  const { theme, toggleTheme } = useAppStore()
  const { isModified } = useProjectStore()
  const { openSettingsPanel, openCommandPalette } = useSettingsStore()
  const { newProject, openProject, saveProject, exportPDF } = useProjectOperations()

  return (
    <div className="chrome-surface flex items-center gap-3 h-14 px-3 border-b border-so-border flex-shrink-0">
      <div className="flex items-center gap-1.5 rounded-full border border-so-border bg-white/5 p-1">
        <Tooltip content="New Project (Ctrl+N)" side="bottom">
          <IconButton label="New Project" onClick={newProject} size="sm">
            <FilePlus size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Open Project (Ctrl+O)" side="bottom">
          <IconButton label="Open Project" onClick={openProject} size="sm">
            <FolderOpen size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content={`Save${isModified ? ' (unsaved changes)' : ''} (Ctrl+S)`} side="bottom">
          <IconButton label="Save" onClick={saveProject} size="sm" variant={isModified ? 'accent' : 'ghost'}>
            <Save size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Export PDF" side="bottom">
          <IconButton label="Export PDF" onClick={exportPDF} size="sm">
            <Download size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>
      </div>

      <div className="chrome-divider" />

      <div className="flex items-center gap-1 rounded-full border border-so-border bg-[rgba(255,255,255,0.035)] p-1">
        {VIEW_MODES.map(({ id, label, shortLabel, icon, shortcut }) => (
          <Tooltip key={id} content={`${label} (${shortcut})`} side="bottom">
            <button
              type="button"
              onClick={() => setActiveView(id)}
              className={['chrome-pill text-xs font-medium', activeView === id ? 'active' : ''].join(' ')}
            >
              {icon}
              <span>{shortLabel}</span>
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="chrome-divider" />

      <div className="flex items-center gap-1 rounded-full border border-so-border bg-white/5 p-1">
        <Tooltip content={`${leftSidebarVisible ? 'Hide' : 'Show'} Sidebar (Ctrl+\\)`} side="bottom">
          <IconButton label="Toggle Sidebar" active={leftSidebarVisible} onClick={toggleLeftSidebar} size="sm">
            <PanelLeft size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content={`${rightPanelVisible ? 'Hide' : 'Show'} Right Panel (Ctrl+Shift+\\)`} side="bottom">
          <IconButton label="Toggle Right Panel" active={rightPanelVisible} onClick={toggleRightPanel} size="sm">
            <PanelRight size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Focus Mode (Ctrl+Shift+F)" side="bottom">
          <IconButton label="Focus Mode" active={focusMode} onClick={toggleFocusMode} size="sm">
            <Maximize2 size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>
      </div>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-1 rounded-full border border-so-border bg-white/5 p-1">
        <Tooltip content="Jump to Scene (Ctrl+P)" side="bottom">
          <IconButton label="Jump to Scene" onClick={openCommandPalette} size="sm">
            <Search size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>

        <Tooltip content={`Switch to ${themeLabel(theme)}`} side="bottom">
          <IconButton label="Toggle Theme" onClick={toggleTheme} size="sm">
            <ThemeIcon theme={theme} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Settings (Ctrl+,)" side="bottom">
          <IconButton label="Settings" onClick={openSettingsPanel} size="sm">
            <Settings size={15} strokeWidth={1.7} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}

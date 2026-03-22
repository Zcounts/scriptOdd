/**
 * TopToolbar — Phase 6
 *
 * Phase 6 changes:
 *   - Added Settings gear button (opens SettingsPanel slide-over)
 *   - Added Command Palette trigger (Ctrl+P hint)
 *   - Theme toggle now cycles dark → light → high-contrast → dark
 *   - Semantic highlight controls moved to SettingsPanel; kept compact indicator
 *   - Layout preset quick-switcher via icons in panel-toggle group
 */

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
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { ViewMode } from '../../types'

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'draft', label: 'Draft View', icon: <LayoutTemplate size={14} />, shortcut: 'Ctrl+1' },
  { id: 'page',  label: 'Page View',  icon: <BookOpen size={14} />,       shortcut: 'Ctrl+2' },
  { id: 'board', label: 'Board View', icon: <Grid3X3 size={14} />,        shortcut: 'Ctrl+3' },
]

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === 'dark') return <Moon size={15} />
  if (theme === 'light') return <Sun size={15} />
  return <Contrast size={15} />
}

function themeLabel(theme: string) {
  if (theme === 'dark') return 'Light Mode'
  if (theme === 'light') return 'High-Contrast Mode'
  return 'Dark Mode'
}

export function TopToolbar(): React.JSX.Element {
  const { activeView, setActiveView, leftSidebarVisible, rightPanelVisible, toggleLeftSidebar, toggleRightPanel, focusMode, toggleFocusMode } =
    useLayoutStore()
  const { theme, toggleTheme } = useAppStore()
  const { isModified } = useProjectStore()
  const { openSettingsPanel, openCommandPalette } = useSettingsStore()

  const handleNew = () => {
    console.log('[toolbar] new project')
  }

  const handleOpen = async () => {
    if (!window.api) return
    const result = await window.api.openProject()
    if (!result.cancelled) console.log('[toolbar] open:', result.filePath)
  }

  const handleSave = async () => {
    if (!window.api) return
    console.log('[toolbar] save')
  }

  const handleExportPDF = async () => {
    if (!window.api) return
    const result = await window.api.exportPDF({ html: '' })
    console.log('[toolbar] export pdf:', result)
  }

  return (
    <div className="flex items-center gap-0.5 h-10 px-2 bg-so-surface border-b border-so-border flex-shrink-0">
      {/* File operations */}
      <div className="flex items-center gap-0.5">
        <Tooltip content="New Project (Ctrl+N)" side="bottom">
          <IconButton label="New Project" onClick={handleNew}>
            <FilePlus size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Open Project (Ctrl+O)" side="bottom">
          <IconButton label="Open Project" onClick={handleOpen}>
            <FolderOpen size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip content={`Save${isModified ? ' (unsaved changes)' : ''} (Ctrl+S)`} side="bottom">
          <IconButton
            label="Save"
            onClick={handleSave}
            className={isModified ? 'text-so-warning!' : ''}
          >
            <Save size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Export PDF (Ctrl+Shift+E)" side="bottom">
          <IconButton label="Export PDF" onClick={handleExportPDF}>
            <Download size={15} />
          </IconButton>
        </Tooltip>
      </div>

      <Divider />

      {/* View mode switcher */}
      <div className="flex items-center bg-so-bg rounded px-0.5 py-0.5 gap-0.5">
        {VIEW_MODES.map(({ id, label, icon, shortcut }) => (
          <Tooltip key={id} content={`${label} (${shortcut})`} side="bottom">
            <IconButton
              label={label}
              active={activeView === id}
              onClick={() => setActiveView(id)}
              className="gap-1.5 px-2 text-xs font-medium"
              size="sm"
            >
              {icon}
              <span className="hidden md:inline">{label.replace(' View', '').replace(' ', '\u00A0')}</span>
            </IconButton>
          </Tooltip>
        ))}
      </div>

      <Divider />

      {/* Panel toggles */}
      <div className="flex items-center gap-0.5">
        <Tooltip content={`${leftSidebarVisible ? 'Hide' : 'Show'} Sidebar (Ctrl+\\)`} side="bottom">
          <IconButton
            label="Toggle Sidebar"
            active={leftSidebarVisible}
            onClick={toggleLeftSidebar}
          >
            <PanelLeft size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip content={`${rightPanelVisible ? 'Hide' : 'Show'} Right Panel (Ctrl+Shift+\\)`} side="bottom">
          <IconButton
            label="Toggle Right Panel"
            active={rightPanelVisible}
            onClick={toggleRightPanel}
          >
            <PanelRight size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Focus Mode (Ctrl+Shift+F)" side="bottom">
          <IconButton
            label="Focus Mode"
            active={focusMode}
            onClick={toggleFocusMode}
          >
            <Maximize2 size={15} />
          </IconButton>
        </Tooltip>
      </div>

      <Divider />

      {/* Quick search / scene jump */}
      <Tooltip content="Jump to Scene (Ctrl+P)" side="bottom">
        <IconButton label="Jump to Scene" onClick={openCommandPalette}>
          <Search size={15} />
        </IconButton>
      </Tooltip>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme cycle */}
      <Tooltip content={`Switch to ${themeLabel(theme)}`} side="bottom">
        <IconButton label="Toggle Theme" onClick={toggleTheme}>
          <ThemeIcon theme={theme} />
        </IconButton>
      </Tooltip>

      <Divider />

      {/* Settings */}
      <Tooltip content="Settings (Ctrl+,)" side="bottom">
        <IconButton label="Settings" onClick={openSettingsPanel}>
          <Settings size={15} />
        </IconButton>
      </Tooltip>
    </div>
  )
}

function Divider(): React.JSX.Element {
  return <div className="w-px h-5 bg-so-border-dim mx-1 flex-shrink-0" />
}

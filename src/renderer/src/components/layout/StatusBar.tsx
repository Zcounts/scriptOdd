import React from 'react'
import { Circle, Save } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useProjectStore } from '../../store/projectStore'
import { useAppStore } from '../../store/appStore'
import { useLayoutStore } from '../../store/layoutStore'

export function StatusBar(): React.JSX.Element {
  const { wordCount, pageCount, sceneCount, cursorLine, cursorColumn } = useDocumentStore()
  const { isModified, lastSavedAt } = useProjectStore()
  const { theme } = useAppStore()
  const { activeView } = useLayoutStore()

  const savedLabel = lastSavedAt
    ? `Saved ${formatRelativeTime(lastSavedAt)}`
    : 'Not saved'

  return (
    <div className="flex items-center h-6 px-3 bg-so-bg border-t border-so-border-dim flex-shrink-0 gap-3 overflow-hidden">
      {/* Modified indicator */}
      <StatusItem>
        <Circle
          size={6}
          className={isModified ? 'text-so-warning fill-so-warning' : 'text-so-text-3 fill-transparent'}
        />
        <span className={isModified ? 'text-so-warning' : 'text-so-text-3'}>
          {isModified ? 'Modified' : savedLabel}
        </span>
      </StatusItem>

      <StatusDivider />

      {/* Document stats */}
      <StatusItem>
        <span className="text-so-text-3">
          {pageCount} {pageCount === 1 ? 'pg' : 'pgs'}
        </span>
      </StatusItem>

      <StatusItem>
        <span className="text-so-text-3">{wordCount.toLocaleString()} words</span>
      </StatusItem>

      {sceneCount > 0 && (
        <StatusItem>
          <span className="text-so-text-3">
            {sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}
          </span>
        </StatusItem>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Cursor position */}
      <StatusItem>
        <span className="text-so-text-3">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
      </StatusItem>

      <StatusDivider />

      {/* Active view label */}
      <StatusItem>
        <span className="text-so-text-3 capitalize">{activeView} View</span>
      </StatusItem>

      <StatusDivider />

      {/* Theme */}
      <StatusItem>
        <span className="text-so-text-3">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </StatusItem>
    </div>
  )
}

function StatusItem({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 text-xxs">
      {children}
    </div>
  )
}

function StatusDivider(): React.JSX.Element {
  return <div className="w-px h-3 bg-so-border-dim flex-shrink-0" />
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

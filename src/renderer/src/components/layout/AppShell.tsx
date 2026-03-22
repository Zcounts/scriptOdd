import React from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TitleBar } from './TitleBar'
import { TopToolbar } from './TopToolbar'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { StatusBar } from './StatusBar'
import { DraftView } from '../views/DraftView'
import { PageView } from '../views/PageView'
import { BoardView } from '../views/BoardView'
import { useLayoutStore } from '../../store/layoutStore'
import { useKeyboard } from '../../hooks/useKeyboard'

export function AppShell(): React.JSX.Element {
  const {
    leftSidebarVisible,
    rightPanelVisible,
    leftSidebarSize,
    rightPanelSize,
    activeView,
    focusMode,
    toggleLeftSidebar,
    toggleRightPanel,
    toggleFocusMode,
    setActiveView,
    setLeftSidebarSize,
    setRightPanelSize,
  } = useLayoutStore()

  // Global keyboard shortcuts
  useKeyboard([
    { key: '1', modifiers: ['ctrl'], handler: () => setActiveView('draft'), preventDefault: true },
    { key: '2', modifiers: ['ctrl'], handler: () => setActiveView('page'), preventDefault: true },
    { key: '3', modifiers: ['ctrl'], handler: () => setActiveView('board'), preventDefault: true },
    { key: '\\', modifiers: ['ctrl'], handler: toggleLeftSidebar, preventDefault: true },
    { key: '\\', modifiers: ['ctrl', 'shift'], handler: toggleRightPanel, preventDefault: true },
    { key: 'f', modifiers: ['ctrl', 'shift'], handler: toggleFocusMode, preventDefault: true },
  ])

  const showLeft = leftSidebarVisible && !focusMode
  const showRight = rightPanelVisible && !focusMode

  return (
    <div className="flex flex-col h-full w-full bg-so-bg overflow-hidden">
      {/* Custom titlebar */}
      <TitleBar />

      {/* Main chrome — hidden in focus mode */}
      {!focusMode && <TopToolbar />}

      {/* Body: sidebar + editor + right panel */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" autoSaveId="scriptodd-main-layout">
          {/* Left sidebar */}
          {showLeft && (
            <>
              <Panel
                id="left-sidebar"
                order={1}
                defaultSize={leftSidebarSize}
                minSize={12}
                maxSize={30}
                onResize={setLeftSidebarSize}
              >
                <LeftSidebar />
              </Panel>
              <PanelResizeHandle className="w-1 bg-so-border-dim hover:bg-so-accent transition-colors duration-150 cursor-col-resize" />
            </>
          )}

          {/* Center editor */}
          <Panel id="editor" order={2} defaultSize={showLeft && showRight ? 100 - leftSidebarSize - rightPanelSize : showLeft ? 100 - leftSidebarSize : showRight ? 100 - rightPanelSize : 100} minSize={30}>
            <EditorArea view={activeView} focusMode={focusMode} />
          </Panel>

          {/* Right panel */}
          {showRight && (
            <>
              <PanelResizeHandle className="w-1 bg-so-border-dim hover:bg-so-accent transition-colors duration-150 cursor-col-resize" />
              <Panel
                id="right-panel"
                order={3}
                defaultSize={rightPanelSize}
                minSize={14}
                maxSize={35}
                onResize={setRightPanelSize}
              >
                <RightPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status bar — hidden in focus mode */}
      {!focusMode && <StatusBar />}
    </div>
  )
}

// ── Editor area (center panel content) ───────────────────────────────────────

interface EditorAreaProps {
  view: 'draft' | 'page' | 'board'
  focusMode: boolean
}

function EditorArea({ view, focusMode }: EditorAreaProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full w-full bg-so-bg overflow-hidden">
      {view === 'draft' && <DraftView focusMode={focusMode} />}
      {view === 'page'  && <PageView  focusMode={focusMode} />}
      {view === 'board' && <BoardView />}
    </div>
  )
}

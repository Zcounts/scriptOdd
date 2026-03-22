/**
 * AppShell — Phase 3
 *
 * Main application shell.  Phase 3 adds screenplay-editing global shortcuts:
 *   Ctrl+Enter          — insert new scene heading at cursor (or at doc end)
 *   Alt+ArrowDown       — jump to next scene heading in document
 *   Alt+ArrowUp         — jump to previous scene heading in document
 *   Ctrl+F              — focus the editor (find-in-page via native Ctrl+F falls
 *                         through to the underlying WebContents; kept as a hint)
 *
 * View shortcuts (Phase 1/2):
 *   Ctrl+1/2/3          — Draft / Page / Board view
 *   Ctrl+\              — toggle left sidebar
 *   Ctrl+Shift+\        — toggle right panel
 *   Ctrl+Shift+F        — focus mode
 */

import React, { useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TitleBar } from './TitleBar'
import { TopToolbar } from './TopToolbar'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { StatusBar } from './StatusBar'
import { DraftView } from '../views/DraftView'
import { PageView } from '../views/PageView'
import { BoardView } from '../views/BoardView'
import { SettingsPanel } from '../ui/SettingsPanel'
import { CommandPalette } from '../ui/CommandPalette'
import { useLayoutStore } from '../../store/layoutStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'

// ── Scene navigation helpers ──────────────────────────────────────────────────

/** Find all absolute positions of sceneHeading nodes in the document. */
function sceneHeadingPositions(editor: NonNullable<ReturnType<typeof useScreenplayEditor>>): number[] {
  const positions: number[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'sceneHeading') positions.push(pos)
  })
  return positions
}

function jumpToNextScene(editor: NonNullable<ReturnType<typeof useScreenplayEditor>>) {
  const { pos: cursorPos } = editor.state.selection.$anchor
  const positions = sceneHeadingPositions(editor)
  const next = positions.find((p) => p > cursorPos)
  if (next !== undefined) {
    editor.chain().focus().setTextSelection(next + 1).run()
  }
}

function jumpToPrevScene(editor: NonNullable<ReturnType<typeof useScreenplayEditor>>) {
  const { pos: cursorPos } = editor.state.selection.$anchor
  const positions = sceneHeadingPositions(editor)
  // Find the last position that is strictly before current cursor block
  const prev = [...positions].reverse().find((p) => p < cursorPos - 1)
  if (prev !== undefined) {
    editor.chain().focus().setTextSelection(prev + 1).run()
  }
}

function insertNewScene(editor: NonNullable<ReturnType<typeof useScreenplayEditor>>) {
  const newId = Math.random().toString(36).slice(2, 9)
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'sceneHeading',
      attrs: { id: newId, sceneId: null, tags: [], noteIds: [] },
      content: [],
    })
    .run()
}

// ── Component ─────────────────────────────────────────────────────────────────

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

  const { openSettingsPanel, openCommandPalette } = useSettingsStore()

  const editor = useScreenplayEditor()

  const handleNewScene = useCallback(() => {
    if (editor) insertNewScene(editor)
  }, [editor])

  const handleNextScene = useCallback(() => {
    if (editor) jumpToNextScene(editor)
  }, [editor])

  const handlePrevScene = useCallback(() => {
    if (editor) jumpToPrevScene(editor)
  }, [editor])

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useKeyboard([
    // View switching
    { key: '1', modifiers: ['ctrl'], handler: () => setActiveView('draft'), preventDefault: true },
    { key: '2', modifiers: ['ctrl'], handler: () => setActiveView('page'),  preventDefault: true },
    { key: '3', modifiers: ['ctrl'], handler: () => setActiveView('board'), preventDefault: true },

    // Panel toggles
    { key: '\\', modifiers: ['ctrl'],          handler: toggleLeftSidebar, preventDefault: true },
    { key: '\\', modifiers: ['ctrl', 'shift'], handler: toggleRightPanel,  preventDefault: true },
    { key: 'f',  modifiers: ['ctrl', 'shift'], handler: toggleFocusMode,   preventDefault: true },

    // Scene navigation & insertion (only meaningful in draft view)
    { key: 'Enter', modifiers: ['ctrl'],       handler: handleNewScene,   preventDefault: true },
    { key: 'ArrowDown', modifiers: ['alt'],    handler: handleNextScene,  preventDefault: true },
    { key: 'ArrowUp',   modifiers: ['alt'],    handler: handlePrevScene,  preventDefault: true },

    // Phase 6: Command palette + Settings
    { key: 'p', modifiers: ['ctrl'],            handler: openCommandPalette, preventDefault: true },
    { key: ',', modifiers: ['ctrl'],            handler: openSettingsPanel,  preventDefault: true },
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
          <Panel
            id="editor"
            order={2}
            defaultSize={
              showLeft && showRight
                ? 100 - leftSidebarSize - rightPanelSize
                : showLeft
                  ? 100 - leftSidebarSize
                  : showRight
                    ? 100 - rightPanelSize
                    : 100
            }
            minSize={30}
          >
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

      {/* Phase 6 overlays — rendered outside layout flow */}
      <SettingsPanel />
      <CommandPalette />
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

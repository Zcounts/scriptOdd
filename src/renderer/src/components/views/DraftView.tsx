/**
 * Draft View — Phase 3
 *
 * Hosts the live screenplay editor (Tiptap) with a block-type picker toolbar
 * and the Phase 3 slash-command floating menu.
 */

import React from 'react'
import { EditorContent } from '@tiptap/react'
import { LayoutTemplate } from 'lucide-react'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { BlockTypePicker } from '../../editor/BlockTypePicker'
import { SlashMenu } from '../../editor/SlashMenu'

interface DraftViewProps {
  focusMode?: boolean
}

export function DraftView({ focusMode = false }: DraftViewProps): React.JSX.Element {
  const editor = useScreenplayEditor()

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Editor chrome bar ──────────────────────────────────────────────── */}
      {!focusMode && (
        <div className="flex items-center gap-3 h-8 px-3 border-b border-so-border-dim bg-so-surface flex-shrink-0 titlebar-no-drag">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LayoutTemplate size={12} className="text-so-text-3" />
            <span className="text-xxs text-so-text-3 uppercase tracking-wider">Draft</span>
          </div>

          <div className="w-px h-4 bg-so-border-dim flex-shrink-0" />

          {/* Block type picker — only rendered when editor is ready */}
          {editor && <BlockTypePicker editor={editor} />}

          <div className="flex-1" />

          {/* Keyboard hints */}
          <span className="text-xxs text-so-text-3 select-none hidden sm:block">
            <kbd className="opacity-60">Enter</kbd> advance &nbsp;·&nbsp;
            <kbd className="opacity-60">Tab</kbd>/<kbd className="opacity-60">Shift+Tab</kbd> cycle type &nbsp;·&nbsp;
            <kbd className="opacity-60">/</kbd> command &nbsp;·&nbsp;
            <kbd className="opacity-60">Ctrl+Z</kbd> undo
          </span>
        </div>
      )}

      {/* ── Editor canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 selectable">
        <div
          className={[
            'mx-auto min-h-full screenplay-draft',
            focusMode ? 'max-w-xl' : 'max-w-2xl',
          ].join(' ')}
        >
          {editor ? (
            <>
              <EditorContent editor={editor} className="outline-none" />
              {/* Slash command palette — portal-rendered, always mounted */}
              <SlashMenu editor={editor} />
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-so-text-3 text-sm">
              Loading editor…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Draft View — Phase 5
 *
 * Hosts the live screenplay editor (Tiptap) with:
 *   - Block-type picker toolbar
 *   - Slash command floating menu (Phase 3)
 *   - Autocomplete popup for character cues and scene headings (Phase 5)
 *   - Semantic highlight CSS classes driven by settingsStore (Phase 5)
 *
 * The editor container receives classes:
 *   `sem-on` / `sem-off`          — master toggle
 *   `sem-style-minimal` / `sem-style-vivid`  — highlight style
 *   `sem-intensity-low` / `-medium` / `-high` — tint strength
 *
 * These classes work with the sem-char-N / sem-loc-N decoration classes added
 * by SemanticHighlightExtension to produce per-entity colors.
 */

import React, { useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import { LayoutTemplate } from 'lucide-react'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { BlockTypePicker } from '../../editor/BlockTypePicker'
import { SlashMenu } from '../../editor/SlashMenu'
import { AutocompleteMenu } from '../../editor/AutocompleteMenu'
import { SEM_REBUILD_META } from '../../editor/SemanticHighlightExtension'
import { useSettingsStore } from '../../store/settingsStore'

interface DraftViewProps {
  focusMode?: boolean
}

export function DraftView({ focusMode = false }: DraftViewProps): React.JSX.Element {
  const editor = useScreenplayEditor()
  const { semanticHighlight, highlightStyle, highlightIntensity } = useSettingsStore()

  // Re-trigger decoration rebuild when highlight settings change
  useEffect(() => {
    if (editor) {
      editor.view.dispatch(editor.state.tr.setMeta(SEM_REBUILD_META, true))
    }
  }, [editor, semanticHighlight, highlightStyle, highlightIntensity])

  // Compose CSS classes for the editor canvas — controls semantic color visibility
  const semClasses = [
    semanticHighlight ? 'sem-on' : 'sem-off',
    `sem-style-${highlightStyle}`,
    `sem-intensity-${highlightIntensity}`,
  ].join(' ')

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
      <div className={`flex-1 overflow-y-auto px-4 py-6 selectable ${semClasses}`}>
        <div
          className={[
            'mx-auto min-h-full screenplay-draft',
            focusMode ? 'max-w-xl' : 'max-w-2xl',
          ].join(' ')}
        >
          {editor ? (
            <>
              <EditorContent editor={editor} className="outline-none" />
              {/* Slash command palette — portal-rendered */}
              <SlashMenu editor={editor} />
              {/* Autocomplete for character cues and scene headings — portal-rendered */}
              <AutocompleteMenu editor={editor} />
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

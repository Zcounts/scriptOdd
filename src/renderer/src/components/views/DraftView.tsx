import React, { useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import { PenLine } from 'lucide-react'
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

  useEffect(() => {
    if (editor) {
      editor.view.dispatch(editor.state.tr.setMeta(SEM_REBUILD_META, true))
    }
  }, [editor, semanticHighlight, highlightStyle, highlightIntensity])

  // Font size (12pt) and line height (1.0 single-spaced) are hardcoded in CSS
  // per screenplay spec — not user-configurable.
  const semClasses = [
    semanticHighlight ? 'sem-on' : 'sem-off',
    `sem-style-${highlightStyle}`,
    `sem-intensity-${highlightIntensity}`,
  ].join(' ')

  return (
    <div className="flex flex-col h-full w-full overflow-hidden view-canvas">
      {!focusMode && (
        <div className="editor-chrome flex items-center gap-3 h-11 px-4 flex-shrink-0 titlebar-no-drag">
          <div className="flex items-center gap-2 flex-shrink-0 text-so-text-2">
            <PenLine size={13} strokeWidth={1.7} className="text-so-accent" />
            <span className="text-[11px] uppercase tracking-[0.24em]">Draft</span>
          </div>

          <div className="chrome-divider" />

          {editor && <BlockTypePicker editor={editor} />}

          <div className="flex-1" />
        </div>
      )}

      {/* overflow-x: clip clips the full-width page-sep bands without creating a horizontal scrollbar */}
      <div className={`flex-1 overflow-y-auto py-10 selectable ${semClasses}`} style={{ overflowX: 'clip' }}>
        <div
          className={[
            'mx-auto screenplay-draft',
            focusMode ? 'max-w-3xl' : '',
          ].join(' ')}
        >
          {editor ? (
            <>
              <EditorContent editor={editor} className="outline-none" />
              <SlashMenu editor={editor} />
              <AutocompleteMenu editor={editor} />
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-so-text-3 text-sm">Loading editor…</div>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import { PenLine } from 'lucide-react'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { BlockTypePicker } from '../../editor/BlockTypePicker'
import { SlashMenu } from '../../editor/SlashMenu'
import { AutocompleteMenu } from '../../editor/AutocompleteMenu'
import { SEM_REBUILD_META } from '../../editor/SemanticHighlightExtension'
import { useSettingsStore } from '../../store/settingsStore'

const LINE_HEIGHT_CLASS = { normal: 'editor-lh-normal', relaxed: 'editor-lh-relaxed', spacious: 'editor-lh-spacious' } as const
const FONT_SIZE_CLASS = { sm: 'editor-fontsize-sm', md: 'editor-fontsize-md', lg: 'editor-fontsize-lg' } as const

interface DraftViewProps {
  focusMode?: boolean
}

export function DraftView({ focusMode = false }: DraftViewProps): React.JSX.Element {
  const editor = useScreenplayEditor()
  const { semanticHighlight, highlightStyle, highlightIntensity, editorFontSize, editorLineHeight } = useSettingsStore()

  useEffect(() => {
    if (editor) {
      editor.view.dispatch(editor.state.tr.setMeta(SEM_REBUILD_META, true))
    }
  }, [editor, semanticHighlight, highlightStyle, highlightIntensity])

  const semClasses = [
    semanticHighlight ? 'sem-on' : 'sem-off',
    `sem-style-${highlightStyle}`,
    `sem-intensity-${highlightIntensity}`,
    FONT_SIZE_CLASS[editorFontSize],
    LINE_HEIGHT_CLASS[editorLineHeight],
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

          <span className="text-[11px] uppercase tracking-[0.18em] text-so-text-3 select-none hidden xl:block">
            Enter advance · Tab cycle type · / command · Ctrl+Z undo
          </span>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto px-5 py-8 selectable ${semClasses}`}>
        <div
          className={[
            'mx-auto min-h-full screenplay-draft rounded-[28px] border border-so-border bg-[rgba(255,255,255,0.035)] shadow-[0_24px_48px_rgba(0,0,0,0.14)]',
            focusMode ? 'max-w-3xl px-10 py-10' : 'max-w-4xl px-12 py-10',
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

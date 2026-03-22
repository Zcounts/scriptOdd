import React, { useMemo } from 'react'
import { BookOpen, Layers3 } from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import { useDocumentStore } from '../../store/documentStore'
import { useSettingsStore } from '../../store/settingsStore'
import { extractText } from '../../editor/ScreenplayEditorProvider'

interface PageViewProps {
  focusMode?: boolean
}

const LINES_PER_PAGE = 55

function estimateLines(block: JSONContent): number {
  const text = extractText(block)
  const chars = text.length
  switch (block.type) {
    case 'sceneHeading':   return Math.max(1, Math.ceil(chars / 60)) + 1
    case 'action':         return Math.max(1, Math.ceil(chars / 60)) + 1
    case 'character':      return 1
    case 'dialogue':       return Math.max(1, Math.ceil(chars / 35))
    case 'parenthetical':  return 1
    case 'transition':     return 2
    case 'note':           return 0
    default:               return 1
  }
}

function splitIntoPages(content: JSONContent[]): JSONContent[][] {
  const pages: JSONContent[][] = []
  let current: JSONContent[] = []
  let lines = 0

  for (const block of content) {
    if (block.type === 'note') continue
    const estimate = estimateLines(block)

    if (lines + estimate > LINES_PER_PAGE && current.length > 0) {
      pages.push(current)
      current = []
      lines = 0
    }

    current.push(block)
    lines += estimate
  }

  if (current.length > 0) pages.push(current)
  if (pages.length === 0) pages.push([])

  return pages
}

function PageBlock({ block }: { block: JSONContent }): React.JSX.Element | null {
  const text = extractText(block)

  switch (block.type) {
    case 'sceneHeading':
      return <div className="page-view-scene-heading">{text.toUpperCase()}</div>
    case 'action':
      return <div className="page-view-action">{text}</div>
    case 'character':
      return <div className="page-view-character">{text.toUpperCase()}</div>
    case 'dialogue':
      return <div className="page-view-dialogue">{text}</div>
    case 'parenthetical':
      return <div className="page-view-parenthetical">({text})</div>
    case 'transition':
      return <div className="page-view-transition">{text.toUpperCase()}</div>
    case 'note':
      return null
    default:
      return <div>{text}</div>
  }
}

interface ScreenplayPageProps {
  blocks: JSONContent[]
  pageNumber: number
  totalPages: number
  showChrome?: boolean
}

function ScreenplayPage({ blocks, pageNumber, totalPages, showChrome = true }: ScreenplayPageProps): React.JSX.Element {
  return (
    <div className="screenplay-page-shell">
      <div className="page-stack-meta">
        <span>{pageNumber === 1 ? 'Opening page' : `Sheet ${String(pageNumber).padStart(2, '0')}`}</span>
        <strong>scriptOdd</strong>
        <span>{totalPages} total</span>
      </div>

      <div className="screenplay-page-stack">
        <div className="screenplay-page">
          {showChrome && pageNumber > 1 && (
            <div
              style={{
                position: 'absolute',
                top: '0.5in',
                right: '1in',
                fontFamily: 'var(--font-screenplay)',
                fontSize: '12pt',
                color: 'var(--so-text-on-paper)',
              }}
            >
              {pageNumber}.
            </div>
          )}

          {blocks.map((block, i) => (
            <PageBlock key={block.attrs?.id ?? `b-${pageNumber}-${i}`} block={block} />
          ))}

          {showChrome && (
            <div className="page-print-footer">
              <span>{pageNumber < totalPages ? 'Continued' : 'End of pages'}</span>
              <span>{pageNumber}</span>
            </div>
          )}
        </div>
      </div>

      <div className="page-stack-footer">Scroll through stacked screenplay sheets</div>
    </div>
  )
}

export function PageView({ focusMode = false }: PageViewProps): React.JSX.Element {
  const editorContent = useDocumentStore((s) => s.editorContent)
  const { pageSize, pageMarginsPreset, showPageChrome } = useSettingsStore()

  const pages = useMemo(() => {
    const content = editorContent?.content ?? []
    return splitIntoPages(content)
  }, [editorContent])

  const canvasClasses = [`page-size-${pageSize}`, `page-margins-${pageMarginsPreset}`].join(' ')

  return (
    <div className="flex flex-col h-full w-full overflow-hidden page-view-shell">
      {!focusMode && (
        <div className="editor-chrome flex items-center h-11 px-5 flex-shrink-0 gap-3 titlebar-no-drag">
          <div className="inline-flex items-center gap-2 text-so-text-2">
            <Layers3 size={14} strokeWidth={1.7} className="text-so-accent" />
            <span className="text-[11px] uppercase tracking-[0.24em]">Page stack</span>
          </div>
          <div className="chrome-divider" />
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-so-text-3">
            <BookOpen size={13} strokeWidth={1.7} />
            <span>{pageSize === 'letter' ? 'Letter' : 'A4'}</span>
            <span>•</span>
            <span>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span>
          </div>
          <div className="flex-1" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-so-text-3">
            {showPageChrome ? 'Print marks on' : 'Clean sheets'}
          </span>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto px-6 py-8 md:px-10 ${canvasClasses} view-canvas`}>
        {pages.length > 0 ? (
          <div className="mx-auto w-full max-w-[min(100%,calc(8.5in+10rem))]">
            {pages.map((pageBlocks, idx) => (
              <ScreenplayPage
                key={idx}
                blocks={pageBlocks}
                pageNumber={idx + 1}
                totalPages={pages.length}
                showChrome={showPageChrome}
              />
            ))}
          </div>
        ) : (
          <div className="page-view-empty">
            No content yet — start writing in Draft View to generate paged screenplay sheets.
          </div>
        )}
      </div>
    </div>
  )
}

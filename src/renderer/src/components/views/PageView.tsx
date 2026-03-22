/**
 * Page View — Phase 2
 *
 * A read-only paginated rendering of the screenplay document.
 * Reads editor content from the Zustand document store (populated by
 * ScreenplayEditorProvider on every edit) and renders it in industry-standard
 * screenplay page format: 8.5×11, Courier 12pt, proper margins.
 *
 * Notes (data-type="note") are intentionally hidden in this view.
 */

import React, { useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import { useDocumentStore } from '../../store/documentStore'
import { extractText } from '../../editor/ScreenplayEditorProvider'

interface PageViewProps {
  focusMode?: boolean
}

// ── Approximate lines per content block ───────────────────────────────────────
// These are rough estimates for pagination (one printed line ≈ 60 chars wide).
const LINES_PER_PAGE = 55

function estimateLines(block: JSONContent): number {
  const text = extractText(block)
  const chars = text.length
  switch (block.type) {
    case 'sceneHeading':   return Math.max(1, Math.ceil(chars / 60)) + 1 // +1 blank before
    case 'action':         return Math.max(1, Math.ceil(chars / 60)) + 1
    case 'character':      return 1
    case 'dialogue':       return Math.max(1, Math.ceil(chars / 35)) // narrower column
    case 'parenthetical':  return 1
    case 'transition':     return 2
    case 'note':           return 0 // hidden in page view
    default:               return 1
  }
}

// ── Page splitter ─────────────────────────────────────────────────────────────

function splitIntoPages(content: JSONContent[]): JSONContent[][] {
  const pages: JSONContent[][] = []
  let current: JSONContent[] = []
  let lines = 0

  for (const block of content) {
    if (block.type === 'note') continue // skip notes in page view
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

// ── Block renderer ────────────────────────────────────────────────────────────

interface PageBlockProps {
  block: JSONContent
}

function PageBlock({ block }: PageBlockProps): React.JSX.Element | null {
  const text = extractText(block)

  switch (block.type) {
    case 'sceneHeading':
      return (
        <div className="page-view-scene-heading">
          {text.toUpperCase()}
        </div>
      )
    case 'action':
      return <div className="page-view-action">{text}</div>
    case 'character':
      return (
        <div className="page-view-character">
          {text.toUpperCase()}
        </div>
      )
    case 'dialogue':
      return <div className="page-view-dialogue">{text}</div>
    case 'parenthetical':
      return <div className="page-view-parenthetical">({text})</div>
    case 'transition':
      return (
        <div className="page-view-transition">
          {text.toUpperCase()}
        </div>
      )
    case 'note':
      return null // Notes are hidden in Page View
    default:
      return <div>{text}</div>
  }
}

// ── Page component ────────────────────────────────────────────────────────────

interface ScreenplayPageProps {
  blocks: JSONContent[]
  pageNumber: number
  totalPages: number
}

function ScreenplayPage({ blocks, pageNumber, totalPages }: ScreenplayPageProps): React.JSX.Element {
  return (
    <div className="screenplay-page">
      {/* Page number header (top-right, except page 1) */}
      {pageNumber > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '0.5in',
            right: '1in',
            fontFamily: 'var(--font-screenplay)',
            fontSize: '12pt',
          }}
        >
          {pageNumber}.
        </div>
      )}

      {/* Content */}
      {blocks.map((block, i) => (
        <PageBlock key={block.attrs?.id ?? `b-${pageNumber}-${i}`} block={block} />
      ))}

      {/* Page-break indicator (not on last page) */}
      {pageNumber < totalPages && (
        <div
          style={{
            position: 'absolute',
            bottom: '0.5in',
            left: 0,
            right: 0,
            borderTop: '1px dashed #ccc',
            textAlign: 'center',
            paddingTop: '4px',
            fontSize: '9pt',
            color: '#bbb',
            fontFamily: 'system-ui',
          }}
        >
          {pageNumber} / {totalPages}
        </div>
      )}
    </div>
  )
}

// ── PageView ──────────────────────────────────────────────────────────────────

export function PageView({ focusMode = false }: PageViewProps): React.JSX.Element {
  const editorContent = useDocumentStore((s) => s.editorContent)

  const pages = useMemo(() => {
    const content = editorContent?.content ?? []
    return splitIntoPages(content)
  }, [editorContent])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-so-bg">
      {/* ── Chrome bar ────────────────────────────────────────────────────── */}
      {!focusMode && (
        <div className="flex items-center h-8 px-4 border-b border-so-border-dim bg-so-surface flex-shrink-0">
          <BookOpen size={12} className="text-so-text-3 mr-2" />
          <span className="text-xxs text-so-text-3 uppercase tracking-wider">Page View</span>
          <span className="ml-auto text-xxs text-so-text-3">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>
      )}

      {/* ── Page canvas ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-8 px-4" style={{ background: 'var(--so-bg)' }}>
        {pages.map((pageBlocks, idx) => (
          <div key={idx} className="mb-8">
            <ScreenplayPage
              blocks={pageBlocks}
              pageNumber={idx + 1}
              totalPages={pages.length}
            />
          </div>
        ))}

        {pages.length === 0 && (
          <div className="flex items-center justify-center h-40 text-so-text-3 text-sm">
            No content yet — start writing in Draft View.
          </div>
        )}
      </div>
    </div>
  )
}

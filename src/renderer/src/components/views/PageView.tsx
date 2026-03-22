import React, { useMemo } from 'react'
import { BookOpen, Layers3 } from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import { useDocumentStore } from '../../store/documentStore'
import { useSettingsStore } from '../../store/settingsStore'
import { extractText } from '../../editor/ScreenplayEditorProvider'

interface PageViewProps {
  focusMode?: boolean
}

// ── Page-break constants ──────────────────────────────────────────────────────

const LINES_PER_PAGE = 55
// Courier New 12pt: ~10 chars/inch; dialogue width 3.5" → 35 chars/line
const CHARS_PER_DIALOGUE_LINE = 35
// Action/scene heading width 6" → 60 chars/line
const CHARS_PER_WIDE_LINE = 60

// ── Virtual block types for (MORE) and (CONT'D) markers ──────────────────────

interface MoreBlock  { type: 'more' }
interface ContdBlock { type: 'contd'; charName: string }
type PageBlock = JSONContent | MoreBlock | ContdBlock

// ── Line estimation ───────────────────────────────────────────────────────────

function estimateLines(block: JSONContent): number {
  const chars = extractText(block).length
  switch (block.type) {
    case 'sceneHeading':   return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE_LINE)) + 1
    case 'action':         return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE_LINE)) + 1
    case 'character':      return 1
    case 'dialogue':       return Math.max(1, Math.ceil(chars / CHARS_PER_DIALOGUE_LINE))
    case 'parenthetical':  return 1
    case 'transition':     return 2
    case 'note':           return 0
    default:               return 1
  }
}

// Split a dialogue text string into wrapped lines (word-wrap at CHARS_PER_DIALOGUE_LINE)
function wrapDialogue(text: string): string[] {
  if (!text.trim()) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!current) {
      current = word
    } else if (current.length + 1 + word.length <= CHARS_PER_DIALOGUE_LINE) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

// ── Page splitting ────────────────────────────────────────────────────────────

function splitIntoPages(content: JSONContent[]): PageBlock[][] {
  const pages: PageBlock[][] = []
  let current: PageBlock[] = []
  let lines = 0
  // Track last character block for CONT'D insertion
  let lastCharBlock: JSONContent | null = null

  const flush = (): void => {
    if (current.length > 0) {
      pages.push(current)
      current = []
      lines = 0
    }
  }

  for (const block of content) {
    if (block.type === 'note') continue

    if (block.type === 'character') {
      lastCharBlock = block
      // Anti-orphan: character name needs room for itself + at least 2 dialogue lines
      if (lines + 3 > LINES_PER_PAGE && current.length > 0) {
        flush()
      }
      current.push(block)
      lines += 1
      continue
    }

    if (block.type === 'dialogue') {
      const text = extractText(block)
      const dialogueLines = wrapDialogue(text)
      const totalLines = dialogueLines.length

      if (lines + totalLines <= LINES_PER_PAGE) {
        current.push(block)
        lines += totalLines
      } else {
        // Reserve 1 line for (MORE) at bottom
        const available = LINES_PER_PAGE - lines - 1

        if (available >= 2 && lastCharBlock) {
          // Split: first part + (MORE) on current page
          const firstText  = dialogueLines.slice(0, available).join(' ')
          const secondText = dialogueLines.slice(available).join(' ')

          current.push({ ...block, content: [{ type: 'text', text: firstText }] })
          current.push({ type: 'more' } as MoreBlock)
          flush()

          // New page: CONT'D + rest of dialogue
          const charName = extractText(lastCharBlock)
          current.push({ type: 'contd', charName } as ContdBlock)
          current.push({ ...block, content: [{ type: 'text', text: secondText }] })
          lines = 1 + Math.max(1, Math.ceil(secondText.length / CHARS_PER_DIALOGUE_LINE))
        } else {
          // Not enough room to split; move whole block to next page
          flush()
          if (lastCharBlock) {
            const charName = extractText(lastCharBlock)
            current.push({ type: 'contd', charName } as ContdBlock)
            lines = 1
          }
          current.push(block)
          lines += totalLines
        }
      }
      continue
    }

    // All other block types
    const estimate = estimateLines(block)
    if (lines + estimate > LINES_PER_PAGE && current.length > 0) {
      flush()
    }
    current.push(block)
    lines += estimate
  }

  flush()
  if (pages.length === 0) pages.push([])
  return pages
}

// ── Block renderer ────────────────────────────────────────────────────────────

function PageBlockEl({ block }: { block: PageBlock }): React.JSX.Element | null {
  // Virtual (MORE) marker — at character name position per spec (3.7" from left edge)
  if (block.type === 'more') {
    return <div className="page-view-character">(MORE)</div>
  }

  // Virtual CONT'D marker — character name + (CONT'D)
  if (block.type === 'contd') {
    const b = block as ContdBlock
    return (
      <div className="page-view-character">
        {b.charName.toUpperCase()} (CONT&apos;D)
      </div>
    )
  }

  const b = block as JSONContent
  const text = extractText(b)

  switch (b.type) {
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

// ── Page component ────────────────────────────────────────────────────────────

interface ScreenplayPageProps {
  blocks: PageBlock[]
  pageNumber: number
  totalPages: number
  showChrome?: boolean
}

function ScreenplayPage({
  blocks,
  pageNumber,
  totalPages,
  showChrome = true,
}: ScreenplayPageProps): React.JSX.Element {
  return (
    <div className="screenplay-page-shell">
      <div className="page-stack-meta">
        <span>{pageNumber === 1 ? 'Opening page' : `Sheet ${String(pageNumber).padStart(2, '0')}`}</span>
        <strong>scriptOdd</strong>
        <span>{totalPages} total</span>
      </div>

      <div className="screenplay-page-stack">
        <div className="screenplay-page">
          {/* Page number: top-right, 0.5" from top, 1" from right — matches PDF spec */}
          {showChrome && pageNumber > 1 && (
            <div
              style={{
                position: 'absolute',
                top: '0.5in',
                right: '1in',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '12pt',
                color: 'var(--so-text-on-paper)',
              }}
            >
              {pageNumber}.
            </div>
          )}

          {blocks.map((block, i) => {
            const key =
              'attrs' in block && (block as JSONContent).attrs?.id
                ? (block as JSONContent).attrs!.id
                : `b-${pageNumber}-${i}`
            return <PageBlockEl key={key} block={block} />
          })}

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

// ── View ──────────────────────────────────────────────────────────────────────

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
            <span>
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </span>
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

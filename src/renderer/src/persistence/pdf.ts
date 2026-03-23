/**
 * persistence/pdf.ts — Phase 7
 *
 * Builds a theme-independent, print-ready HTML string from screenplay content.
 * The generated HTML uses Courier New at 12pt with standard WGA margins and
 * is intentionally white-on-black for reliable print output regardless of the
 * active UI theme.
 *
 * The main process receives this string, loads it in a hidden BrowserWindow,
 * and calls webContents.printToPDF() to produce the final PDF.
 */

import type { JSONContent } from '@tiptap/core'
import type { ProjectMeta } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extractBlockText(block: JSONContent): string {
  if (block.text) return block.text
  if (block.content) return block.content.map(extractBlockText).join('')
  return ''
}

// ── Paginator (mirrors PageView splitIntoPages) ───────────────────────────────
//
// We pre-paginate so that (MORE) / (CONT'D) markers and explicit page-break
// elements can be injected into the HTML at the correct positions.

const LINES_PER_PAGE   = 55
const CHARS_PER_DLG    = 35  // Courier New 12pt, 3.5" dialogue width
const CHARS_PER_WIDE   = 60  // Courier New 12pt, 6" action/heading width

interface MoreBlock    { type: 'more' }
interface ContdBlock   { type: 'contd'; charName: string }
interface BreakBlock   { type: 'pagebreak' }
interface PageNumBlock { type: 'pagenum'; num: number }
type PdfBlock = JSONContent | MoreBlock | ContdBlock | BreakBlock | PageNumBlock

function estimatePdfLines(block: JSONContent): number {
  const chars = extractBlockText(block).length
  switch (block.type) {
    case 'sceneHeading':  return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE)) + 1
    case 'action':        return Math.max(1, Math.ceil(chars / CHARS_PER_WIDE)) + 1
    case 'character':     return 1
    case 'dialogue':      return Math.max(1, Math.ceil(chars / CHARS_PER_DLG))
    case 'parenthetical': return 1
    case 'transition':    return 2
    default:              return 1
  }
}

function wrapDlg(text: string): string[] {
  if (!text.trim()) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) { cur = w }
    else if (cur.length + 1 + w.length <= CHARS_PER_DLG) { cur += ' ' + w }
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

/**
 * Pre-paginate screenplay blocks, inserting explicit page-break markers and
 * (MORE)/(CONT'D) virtual blocks.  The output is a flat array ready for
 * sequential HTML rendering; each BreakBlock becomes a CSS page-break.
 */
function paginateBlocks(content: JSONContent[]): PdfBlock[] {
  const out: PdfBlock[] = []
  let lines = 0
  let lastCharName = ''
  let isFirstPage = true
  let pageNum = 1

  const breakPage = (): void => {
    out.push({ type: 'pagebreak' } as BreakBlock)
    pageNum++
    out.push({ type: 'pagenum', num: pageNum } as PageNumBlock)
    lines = 0
    isFirstPage = false
  }

  for (const block of content) {
    if (block.type === 'note') continue

    if (block.type === 'character') {
      lastCharName = extractBlockText(block).toUpperCase()
      // Anti-orphan: need room for character name + ≥2 dialogue lines
      if (!isFirstPage && lines + 3 > LINES_PER_PAGE) {
        breakPage()
      }
      out.push(block)
      lines += 1
      continue
    }

    if (block.type === 'dialogue') {
      const text     = extractBlockText(block)
      const dlgLines = wrapDlg(text)
      const total    = dlgLines.length

      if (lines + total <= LINES_PER_PAGE) {
        out.push(block)
        lines += total
      } else {
        const available = LINES_PER_PAGE - lines - 1 // -1 for (MORE)
        if (available >= 2 && lastCharName) {
          const firstText  = dlgLines.slice(0, available).join(' ')
          const secondText = dlgLines.slice(available).join(' ')
          out.push({ ...block, content: [{ type: 'text', text: firstText }] })
          out.push({ type: 'more' } as MoreBlock)
          breakPage()
          out.push({ type: 'contd', charName: lastCharName } as ContdBlock)
          out.push({ ...block, content: [{ type: 'text', text: secondText }] })
          lines = 1 + Math.max(1, Math.ceil(secondText.length / CHARS_PER_DLG))
        } else {
          // Not enough room to split — move whole block to next page
          breakPage()
          if (lastCharName) {
            out.push({ type: 'contd', charName: lastCharName } as ContdBlock)
            lines = 1
          }
          out.push(block)
          lines += total
        }
      }
      continue
    }

    const estimate = estimatePdfLines(block)
    if (!isFirstPage && lines + estimate > LINES_PER_PAGE) {
      breakPage()
    }
    out.push(block)
    lines += estimate
  }

  return out
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderBlock(block: PdfBlock): string {
  // Virtual markers
  if (block.type === 'pagebreak') return '<div class="page-break"></div>'
  if (block.type === 'pagenum') {
    const b = block as PageNumBlock
    return `<div class="page-number">${b.num}.</div>`
  }
  if (block.type === 'more')      return `<p class="character">(MORE)</p>`
  if (block.type === 'contd') {
    const b = block as ContdBlock
    return `<p class="character">${escHtml(b.charName)} (CONT&#39;D)</p>`
  }

  const b = block as JSONContent
  const text = escHtml(extractBlockText(b))
  if (!text.trim() && b.type !== 'action') return ''

  switch (b.type) {
    case 'sceneHeading':
      return `<p class="scene-heading">${text || '&nbsp;'}</p>`

    case 'action':
      return `<p class="action">${text || '&nbsp;'}</p>`

    case 'character':
      return `<p class="character">${text}</p>`

    case 'parenthetical':
      return `<p class="parenthetical">${text}</p>`

    case 'dialogue':
      return `<p class="dialogue">${text}</p>`

    case 'transition':
      return `<p class="transition">${text}</p>`

    case 'note':
      return `<!-- note: ${text} -->`  // Notes are omitted from the printed output

    default:
      return text ? `<p class="action">${text}</p>` : ''
  }
}

// ── Title page ────────────────────────────────────────────────────────────────

function renderTitlePage(meta: ProjectMeta): string {
  const title = escHtml(meta.title || 'Untitled')
  const author = meta.author ? escHtml(meta.author) : ''
  const contact = meta.contact ? escHtml(meta.contact) : ''
  const draftDate = meta.updatedAt
    ? new Date(meta.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return `
<div class="title-page">
  <div class="title-block">
    <p class="title-text">${title}</p>
    ${author ? `<p class="written-by">Written by</p><p class="author-text">${author}</p>` : ''}
  </div>
  <div class="contact-block">
    ${contact ? `<p>${contact}</p>` : ''}
    ${draftDate ? `<p>${draftDate}</p>` : ''}
  </div>
</div>
<div class="page-break"></div>`
}

// ── CSS styles ────────────────────────────────────────────────────────────────

const CSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    line-height: 1.0;
    color: #000000;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page setup — margins set here so printToPDF with marginType:'none' lets
     Chromium honour these CSS @page margins for all layout calculations.   */
  @page {
    size: letter;
    margin: 1in 1in 1in 1.5in;
  }

  @page :first {
    margin: 1in;
  }

  /* Page number — injected as a block element at the top of each page's
     content area (immediately after the .page-break div).  Sits flush right
     at the start of the content area; a bottom margin separates it from the
     first screenplay element on the new page.                               */
  .page-number {
    text-align: right;
    margin: 0 0 0.5in 0;
    padding: 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    color: #000000;
  }

  /* Title page */
  .title-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: calc(11in - 2in);
    padding: 1in 0;
    page-break-after: always;
  }

  .title-block {
    text-align: center;
    margin-top: 3in;
  }

  .title-text {
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 24pt;
  }

  .written-by {
    margin-bottom: 12pt;
  }

  .author-text {
    font-size: 12pt;
  }

  .contact-block {
    text-align: left;
    font-size: 11pt;
    line-height: 1.4;
  }

  /* Page break marker */
  .page-break {
    page-break-after: always;
  }

  /* Screenplay blocks — all use standard 12pt Courier with proper indents */

  p {
    margin: 0;
    padding: 0;
    white-space: pre-wrap;
    orphans: 2;
    widows: 2;
  }

  /* Scene heading: all caps, 2 blank lines before (12pt top + 12pt from prev element) */
  .scene-heading {
    text-transform: uppercase;
    margin-top: 12pt;
    margin-bottom: 12pt;
    page-break-after: avoid;
    font-weight: normal;
  }

  /* Action: full width (within page margins) */
  .action {
    margin-bottom: 12pt;
  }

  /* Character: indented ~2.2" from left (within page text area) */
  .character {
    text-transform: uppercase;
    margin-left: 2.2in;
    margin-top: 12pt;
    margin-bottom: 0;
    page-break-after: avoid;
    width: 3.5in;
  }

  /* Parenthetical: 3.1"–5.9" from page left edge = 1.6" indent, 2.8" wide */
  .parenthetical {
    margin-left: 1.6in;
    margin-bottom: 0;
    width: 2.8in;
  }

  /* Dialogue: indented ~1in, width ~3.5in */
  .dialogue {
    margin-left: 1in;
    margin-bottom: 12pt;
    width: 3.5in;
  }

  /* Transition: right-aligned */
  .transition {
    text-transform: uppercase;
    text-align: right;
    margin-top: 12pt;
    margin-bottom: 12pt;
  }

  /* Page numbers are injected by Electron's displayHeaderFooter option in fileHandlers.ts */

  /* Keep dialogue/parenthetical attached to the character name above */
  .dialogue, .parenthetical {
    page-break-before: avoid;
  }
`

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a complete, self-contained HTML document for the screenplay.
 * Theme-independent: always black text on white background.
 */
export function buildPdfHtml(json: JSONContent, meta?: ProjectMeta): string {
  const hasMeta = Boolean(meta?.title && meta.title !== 'Untitled')

  const rawBlocks = json.content ?? []
  const paginatedBlocks = paginateBlocks(rawBlocks)
  const bodyBlocks = paginatedBlocks.map(renderBlock).filter(Boolean).join('\n')

  const titlePageHtml = hasMeta && meta ? renderTitlePage(meta) : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(meta?.title ?? 'Screenplay')}</title>
  <style>${CSS}</style>
</head>
<body>
${titlePageHtml}
${bodyBlocks}
</body>
</html>`
}

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

// ── Block renderers ───────────────────────────────────────────────────────────

function renderBlock(block: JSONContent): string {
  const text = escHtml(extractBlockText(block))
  if (!text.trim() && block.type !== 'action') return ''

  switch (block.type) {
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

  /* Page setup */
  @page {
    size: letter;
    margin: 1in 1in 1in 1.5in;
  }

  @page :first {
    margin: 1in;
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

  /* Scene heading: all caps, blank line before (via margin-top) */
  .scene-heading {
    text-transform: uppercase;
    margin-top: 24pt;
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

  /* Parenthetical: indented ~1.6" */
  .parenthetical {
    margin-left: 1.6in;
    margin-bottom: 0;
    width: 2in;
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

  /* Page numbers — printed via CSS counter */
  @page {
    @top-right {
      content: counter(page) '.';
      font-family: 'Courier New', Courier, monospace;
      font-size: 12pt;
    }
  }

  /* First page has no page number */
  @page :first {
    @top-right {
      content: '';
    }
  }
`

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a complete, self-contained HTML document for the screenplay.
 * Theme-independent: always black text on white background.
 */
export function buildPdfHtml(json: JSONContent, meta?: ProjectMeta): string {
  const hasMeta = Boolean(meta?.title && meta.title !== 'Untitled')

  const blocks = json.content ?? []
  const bodyBlocks = blocks.map(renderBlock).filter(Boolean).join('\n')

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

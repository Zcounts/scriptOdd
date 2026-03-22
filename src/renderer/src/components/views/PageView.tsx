import React from 'react'
import { BookOpen } from 'lucide-react'

interface PageViewProps {
  focusMode?: boolean
}

/**
 * Page View — Phase 1 placeholder.
 *
 * In Phase 2 this will render a paginated view of the screenplay formatted to
 * match industry-standard screenplay pages (8.5×11, proper margins, Courier 12pt).
 *
 * Phase 7 will wire this to the PDF export engine.
 */
export function PageView({ focusMode = false }: PageViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-so-bg">
      {!focusMode && (
        <div className="flex items-center h-8 px-4 border-b border-so-border-dim bg-so-surface flex-shrink-0">
          <BookOpen size={12} className="text-so-text-3 mr-2" />
          <span className="text-xxs text-so-text-3 uppercase tracking-wider">Page View</span>
          <span className="ml-auto text-xxs text-so-text-3">Page 1 of 1</span>
        </div>
      )}

      {/* Page canvas — scrollable area with grey background to simulate print preview */}
      <div
        className="flex-1 overflow-y-auto py-8 px-4"
        style={{ background: 'var(--so-bg)' }}
      >
        <div className="screenplay-page selectable">
          {/* Placeholder content — industry formatted */}
          <div style={{ fontFamily: 'var(--font-screenplay)', fontSize: '12pt', lineHeight: '1' }}>
            <PageLine style="scene-heading">INT. COFFEE SHOP - DAY</PageLine>
            <br />
            <PageLine>
              The shop is nearly empty. A ceiling fan turns slowly overhead. MARA (30s) sits alone
              at the bar, a cold cup of coffee in front of her.
            </PageLine>
            <br />
            <PageLine indent="character">MARA</PageLine>
            <PageLine indent="dialogue">He said he&apos;d be here by eight.</PageLine>
            <br />
            <PageLine>
              The door opens. JAKE (40s, rumpled) steps in and scans the room.
            </PageLine>
            <br />
            <PageLine indent="character">JAKE</PageLine>
            <PageLine indent="parenthetical">(looking around)</PageLine>
            <PageLine indent="dialogue">Sorry. Bus.</PageLine>
            <br />
            <PageLine style="transition" align="right">CUT TO:</PageLine>
            <br />
            <PageLine style="scene-heading">EXT. STREET - CONTINUOUS</PageLine>
            <br />
            <PageLine>
              They walk in silence.
            </PageLine>
          </div>

          {/* Phase note */}
          <div
            style={{
              marginTop: '2in',
              borderTop: '1px solid #ccc',
              paddingTop: '0.25in',
              color: '#888',
              fontSize: '10pt',
              textAlign: 'center',
              fontFamily: 'system-ui',
            }}
          >
            Phase 1 scaffold — paginated view coming in Phase 2
          </div>
        </div>
      </div>
    </div>
  )
}

interface PageLineProps {
  children: React.ReactNode
  style?: 'scene-heading' | 'transition' | 'normal'
  indent?: 'character' | 'dialogue' | 'parenthetical'
  align?: 'left' | 'right'
}

function PageLine({ children, style = 'normal', indent, align = 'left' }: PageLineProps): React.JSX.Element {
  const baseStyle: React.CSSProperties = {
    textAlign: align,
    textTransform: style === 'scene-heading' || style === 'transition' ? 'uppercase' : undefined,
    fontWeight: style === 'scene-heading' ? 'bold' : 'normal',
  }

  const indentStyle: React.CSSProperties = {
    marginLeft:
      indent === 'character' ? '2.2in' :
      indent === 'dialogue'  ? '1.5in' :
      indent === 'parenthetical' ? '1.8in' :
      undefined,
    marginRight:
      indent === 'dialogue'  ? '1.5in' :
      indent === 'parenthetical' ? '2in' :
      undefined,
  }

  return (
    <div style={{ ...baseStyle, ...indentStyle }}>
      {children}
    </div>
  )
}

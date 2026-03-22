/**
 * AutocompleteMenu — Phase 5
 *
 * Floating suggestion popup for screenplay-specific block types:
 *   - character blocks → suggests remembered character names
 *   - sceneHeading blocks → suggests remembered headings + INT./EXT. templates
 *
 * Trigger: 1+ characters typed in a character or sceneHeading block
 * Accept:  Tab, Enter (replaces entire block text with the chosen suggestion)
 * Dismiss: Escape, or clicking outside
 * Navigate: Arrow Up / Arrow Down
 *
 * Rendered via a React portal so it escapes overflow:hidden containers.
 * Keyboard events are captured in the capture phase to intercept before
 * the editor's own Tab (block cycle) and Enter (block advance) handlers.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'
import { useAutocompleteStore } from '../store/autocompleteStore'
import { getActiveBlockType } from './ScreenplayEditorProvider'

// ── Scene heading suggestion builder ─────────────────────────────────────────

/**
 * Build up to 10 unique suggestions for a scene heading block.
 * Priority: exact-prefix matches on known headings → INT. expansions → EXT. expansions
 */
function buildSceneHeadingSuggestions(
  text: string,
  headings: string[],
  locations: string[],
): string[] {
  const upper = text.toUpperCase().trimStart()
  const results = new Set<string>()

  // Exact prefix match on known headings (omit identical text)
  for (const h of headings) {
    if (h.startsWith(upper) && h !== upper) {
      results.add(h)
      if (results.size >= 6) break
    }
  }

  const isInt =
    upper === 'I' ||
    upper === 'IN' ||
    upper === 'INT' ||
    upper === 'INT.'

  const intMatch = upper.match(/^INT\.?\s+(.*)$/)

  if (isInt) {
    for (const loc of locations.slice(0, 4)) {
      results.add(`INT. ${loc} - DAY`)
      results.add(`INT. ${loc} - NIGHT`)
    }
  } else if (intMatch) {
    const locPrefix = intMatch[1]
    for (const loc of locations.filter((l) => l.startsWith(locPrefix)).slice(0, 4)) {
      results.add(`INT. ${loc} - DAY`)
      results.add(`INT. ${loc} - NIGHT`)
    }
  }

  const isExt =
    upper === 'E' ||
    upper === 'EX' ||
    upper === 'EXT' ||
    upper === 'EXT.'

  const extMatch = upper.match(/^EXT\.?\s+(.*)$/)

  if (isExt) {
    for (const loc of locations.slice(0, 4)) {
      results.add(`EXT. ${loc} - DAY`)
      results.add(`EXT. ${loc} - NIGHT`)
    }
  } else if (extMatch) {
    const locPrefix = extMatch[1]
    for (const loc of locations.filter((l) => l.startsWith(locPrefix)).slice(0, 4)) {
      results.add(`EXT. ${loc} - DAY`)
      results.add(`EXT. ${loc} - NIGHT`)
    }
  }

  return Array.from(results).slice(0, 10)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  editor: Editor
}

interface MenuPos {
  top: number
  left: number
}

export function AutocompleteMenu({ editor }: Props): React.JSX.Element | null {
  const { characters, sceneHeadings, locations } = useAutocompleteStore()

  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [menuPos, setMenuPos] = useState<MenuPos>({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Trigger detection ─────────────────────────────────────────────────────

  const checkTrigger = useCallback(() => {
    const blockType = getActiveBlockType(editor)
    if (blockType !== 'character' && blockType !== 'sceneHeading') {
      setOpen(false)
      return
    }

    const { selection } = editor.state
    if (!selection.empty) {
      setOpen(false)
      return
    }

    const text = selection.$anchor.parent.textContent

    // Don't open on empty block or slash-menu trigger
    if (!text || text.startsWith('/')) {
      setOpen(false)
      return
    }

    let newSuggestions: string[]

    if (blockType === 'character') {
      const upper = text.toUpperCase()
      // Filter to characters that start with the current text but aren't equal
      newSuggestions = characters.filter((c) => c.startsWith(upper) && c !== upper)
    } else {
      newSuggestions = buildSceneHeadingSuggestions(text, sceneHeadings, locations)
    }

    if (newSuggestions.length === 0) {
      setOpen(false)
      return
    }

    // Position popup just below the cursor
    const coords = editor.view.coordsAtPos(selection.$anchor.pos)
    setMenuPos({ top: coords.bottom + 4, left: coords.left })
    setSuggestions(newSuggestions)
    setSelectedIdx(0)
    setOpen(true)
  }, [editor, characters, sceneHeadings, locations])

  useEffect(() => {
    editor.on('transaction', checkTrigger)
    editor.on('selectionUpdate', checkTrigger)
    return () => {
      editor.off('transaction', checkTrigger)
      editor.off('selectionUpdate', checkTrigger)
    }
  }, [editor, checkTrigger])

  // ── Accept suggestion ─────────────────────────────────────────────────────

  const acceptSuggestion = useCallback(
    (suggestion: string) => {
      const { $anchor } = editor.state.selection
      const blockStart = $anchor.start()
      const blockEnd = $anchor.end()

      editor
        .chain()
        .focus()
        .deleteRange({ from: blockStart, to: blockEnd })
        .insertContentAt(blockStart, suggestion)
        .run()

      setOpen(false)
    },
    [editor],
  )

  // ── Keyboard handling (capture phase) ─────────────────────────────────────

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i + 1) % Math.max(1, suggestions.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i - 1 + suggestions.length) % Math.max(1, suggestions.length))
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        // Tab accepts without advancing; Enter accepts (normal Enter follow-through is suppressed)
        e.preventDefault()
        e.stopPropagation()
        if (suggestions[selectedIdx]) acceptSuggestion(suggestions[selectedIdx])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [open, suggestions, selectedIdx, acceptSuggestion])

  // ── Click outside to close ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!open || suggestions.length === 0) return null

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[9998] bg-so-elevated border border-so-border rounded-md shadow-2xl py-1 min-w-[220px] max-w-[400px] animate-fade-in"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <div className="px-3 py-0.5 border-b border-so-border-dim">
        <span className="text-xxs text-so-text-3 select-none">
          Tab or Enter to accept · Esc to dismiss
        </span>
      </div>

      {suggestions.map((s, i) => (
        <button
          key={s}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            acceptSuggestion(s)
          }}
          className={[
            'w-full text-left px-3 py-1 text-xs font-mono tracking-wide',
            'transition-colors cursor-pointer select-none',
            i === selectedIdx
              ? 'bg-so-active text-so-text'
              : 'text-so-text-2 hover:bg-so-active',
          ].join(' ')}
        >
          {s}
        </button>
      ))}
    </div>,
    document.body,
  )
}

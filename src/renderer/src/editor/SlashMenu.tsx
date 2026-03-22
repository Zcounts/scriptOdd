/**
 * SlashMenu — Phase 3
 *
 * A command palette triggered by typing "/" as the first character of an empty
 * screenplay block.  While the menu is open the user can:
 *   - Continue typing to filter element types by name or abbreviation
 *   - Arrow Up/Down to move the selection
 *   - Enter or click to apply the selected type
 *   - Escape to dismiss (leaving the "/" in place for the user to delete)
 *
 * The menu is rendered into a React portal so it can escape overflow:hidden
 * containers and be positioned relative to the viewport.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'
import { BLOCK_TYPES } from './BlockTypePicker'

interface SlashMenuProps {
  editor: Editor
}

interface MenuPosition {
  top: number
  left: number
}

export function SlashMenu({ editor }: SlashMenuProps): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [pos, setPos] = useState<MenuPosition>({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Detect slash trigger ──────────────────────────────────────────────────
  const checkTrigger = useCallback(() => {
    const { selection } = editor.state
    if (!selection.empty) {
      setOpen(false)
      return
    }

    const { $anchor } = selection
    const nodeText = $anchor.parent.textContent

    if (nodeText.startsWith('/')) {
      const q = nodeText.slice(1)
      setQuery(q)
      setSelectedIdx(0)

      // Position below the cursor
      const coords = editor.view.coordsAtPos($anchor.pos)
      setPos({ top: coords.bottom + 6, left: coords.left })
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [editor])

  useEffect(() => {
    editor.on('transaction', checkTrigger)
    editor.on('selectionUpdate', checkTrigger)
    return () => {
      editor.off('transaction', checkTrigger)
      editor.off('selectionUpdate', checkTrigger)
    }
  }, [editor, checkTrigger])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = BLOCK_TYPES.filter((t) => {
    if (!query) return true
    const q = query.toLowerCase()
    return t.label.toLowerCase().includes(q) || t.abbr.toLowerCase().includes(q)
  })

  // ── Apply selected type ───────────────────────────────────────────────────
  const applyType = useCallback(
    (typeName: string) => {
      const { $anchor } = editor.state.selection
      const blockStart = $anchor.start() // first content position of the block
      const blockEnd = $anchor.end()     // last content position

      editor
        .chain()
        .focus()
        .deleteRange({ from: blockStart, to: blockEnd }) // erase "/" + query
        .setNode(typeName)
        .run()

      setOpen(false)
    },
    [editor],
  )

  // ── Keyboard navigation while menu is open ────────────────────────────────
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        if (filtered[selectedIdx]) applyType(filtered[selectedIdx].name)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }

    // Capture phase so we intercept before the editor's own key handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [open, filtered, selectedIdx, applyType])

  // ── Click-outside to close ────────────────────────────────────────────────
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

  if (!open || filtered.length === 0) return null

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[9999] bg-so-elevated border border-so-border rounded-md shadow-2xl py-1 min-w-[210px]"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Header hint */}
      <div className="px-3 py-1 mb-0.5 border-b border-so-border-dim">
        <span className="text-xxs text-so-text-3 select-none">
          {query ? `/${query}` : 'Type to filter…'}
        </span>
      </div>

      {filtered.map((type, i) => (
        <button
          key={type.name}
          onMouseDown={(e) => {
            e.preventDefault()
            applyType(type.name)
          }}
          className={[
            'w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5',
            'transition-colors cursor-pointer select-none',
            i === selectedIdx ? 'bg-so-active' : 'hover:bg-so-active',
          ].join(' ')}
        >
          <span className={`font-mono text-xxs w-7 flex-shrink-0 opacity-70 ${type.color}`}>
            {type.abbr}
          </span>
          <span className="text-so-text-2">{type.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}

/**
 * BlockTypePicker — Phase 2
 *
 * A compact dropdown for changing the focused block's screenplay element type.
 * Appears in the DraftView header bar.
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Editor } from '@tiptap/core'
import { getActiveBlockType } from './ScreenplayEditorProvider'

// ── Block type registry ───────────────────────────────────────────────────────

export interface BlockTypeInfo {
  name: string
  label: string
  color: string   // Tailwind text color class — matches screenplay semantic colors
  abbr: string    // Short label used in the pill
}

export const BLOCK_TYPES: BlockTypeInfo[] = [
  { name: 'sceneHeading',  label: 'Scene Heading',  color: 'text-so-scene',      abbr: 'SCN' },
  { name: 'action',        label: 'Action',          color: 'text-so-action',     abbr: 'ACT' },
  { name: 'character',     label: 'Character',       color: 'text-so-character',  abbr: 'CHR' },
  { name: 'dialogue',      label: 'Dialogue',        color: 'text-so-dialogue',   abbr: 'DLG' },
  { name: 'parenthetical', label: 'Parenthetical',   color: 'text-so-paren',      abbr: 'PAR' },
  { name: 'transition',    label: 'Transition',      color: 'text-so-transition', abbr: 'TRN' },
  { name: 'note',          label: 'Note',            color: 'text-so-note',       abbr: 'NTE' },
]

function findType(name: string | null): BlockTypeInfo {
  return BLOCK_TYPES.find((t) => t.name === name) ?? BLOCK_TYPES[1] // default: action
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BlockTypePickerProps {
  editor: Editor
}

export function BlockTypePicker({ editor }: BlockTypePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Derive active type on every editor transaction
  const [currentTypeName, setCurrentTypeName] = useState<string | null>(
    () => getActiveBlockType(editor),
  )

  useEffect(() => {
    if (!editor) return
    const handler = () => setCurrentTypeName(getActiveBlockType(editor))
    editor.on('transaction', handler)
    editor.on('selectionUpdate', handler)
    return () => {
      editor.off('transaction', handler)
      editor.off('selectionUpdate', handler)
    }
  }, [editor])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const current = findType(currentTypeName)

  const setType = (name: string) => {
    editor.chain().focus().setNode(name).run()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex items-center titlebar-no-drag">
      {/* Trigger button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault() // don't steal focus from editor
          setOpen((v) => !v)
        }}
        className={[
          'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
          'bg-so-elevated hover:bg-so-active border border-so-border-dim',
          'transition-colors cursor-pointer select-none',
          current.color,
        ].join(' ')}
        aria-label="Change block type"
      >
        <span className="font-mono tracking-tight">{current.abbr}</span>
        <span className="hidden sm:inline opacity-70">{current.label}</span>
        <ChevronDown size={10} className="opacity-60 flex-shrink-0" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={[
            'absolute top-full left-0 mt-1 z-50',
            'bg-so-elevated border border-so-border rounded shadow-xl py-0.5',
            'min-w-[172px]',
          ].join(' ')}
        >
          {BLOCK_TYPES.map(({ name, label, color, abbr }) => (
            <button
              key={name}
              onMouseDown={(e) => {
                e.preventDefault()
                setType(name)
              }}
              className={[
                'w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5',
                'hover:bg-so-active transition-colors cursor-pointer select-none',
                currentTypeName === name
                  ? `${color} font-semibold`
                  : 'text-so-text-2',
              ].join(' ')}
            >
              <span className={`font-mono text-xxs w-7 flex-shrink-0 opacity-60 ${color}`}>
                {abbr}
              </span>
              <span>{label}</span>
              {currentTypeName === name && (
                <span className="ml-auto opacity-50">•</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

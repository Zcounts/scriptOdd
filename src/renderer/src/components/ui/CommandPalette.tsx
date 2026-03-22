/**
 * CommandPalette — Phase 6
 *
 * Quick scene jump UI (Ctrl+P / Ctrl+G).
 * Lists all scenes from documentStore, filters by typing,
 * keyboard-navigable (↑↓ arrows, Enter to jump, Escape to close).
 *
 * Navigation is done via ProseMirror: find the sceneHeading node by id
 * and setTextSelection to it.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Search, Hash } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import type { Scene } from '../../types'

function jumpToSceneById(
  editor: ReturnType<typeof useScreenplayEditor>,
  sceneId: string
) {
  if (!editor) return
  let targetPos: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false // stop after found
    if (node.type.name === 'sceneHeading' && node.attrs?.id === sceneId) {
      targetPos = pos
    }
  })
  if (targetPos !== null) {
    editor.chain().focus().setTextSelection(targetPos + 1).run()
    // scroll into view
    editor.view.dispatch(editor.state.tr.scrollIntoView())
  }
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-so-accent-dim text-so-accent-hi rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useSettingsStore()
  const scenes = useDocumentStore((s) => s.scenes)
  const editor = useScreenplayEditor()

  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Focus input on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  const filtered: Scene[] = scenes
    .filter((s) => !query || s.heading.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50)

  // Clamp active index when filtered list changes
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  const commit = useCallback(
    (scene: Scene) => {
      jumpToSceneById(editor, scene.id)
      closeCommandPalette()
    },
    [editor, closeCommandPalette]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeCommandPalette()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIdx]) commit(filtered[activeIdx])
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!commandPaletteOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={closeCommandPalette}
    >
      <div
        className="w-full max-w-md mx-4 bg-so-elevated border border-so-border rounded-xl shadow-2xl overflow-hidden"
        style={{ animation: 'slide-in-palette 0.15s ease' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-so-border-dim">
          <Search size={14} className="text-so-text-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            placeholder="Jump to scene…"
            className="flex-1 bg-transparent text-sm text-so-text placeholder-so-text-3 outline-none selectable"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="text-xxs text-so-text-3 hover:text-so-text-2 transition-colors"
            >
              ✕
            </button>
          )}
          <span className="text-xxs text-so-text-3 hidden sm:block">esc to close</span>
        </div>

        {/* Scene list */}
        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-so-text-3">
              {scenes.length === 0 ? 'No scenes yet — start writing!' : 'No scenes match your search.'}
            </div>
          ) : (
            filtered.map((scene, idx) => (
              <button
                key={scene.id}
                type="button"
                data-idx={idx}
                onClick={() => commit(scene)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75',
                  idx === activeIdx
                    ? 'bg-so-active text-so-text'
                    : 'text-so-text-2 hover:bg-so-active hover:text-so-text',
                ].join(' ')}
              >
                <Hash size={11} className="flex-shrink-0 text-so-text-3" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {highlight(scene.heading || 'Untitled Scene', query)}
                  </div>
                  {scene.synopsis && (
                    <div className="text-xxs text-so-text-3 truncate mt-0.5">
                      {scene.synopsis}
                    </div>
                  )}
                </div>
                <span className="text-xxs text-so-text-3 flex-shrink-0">
                  #{scene.order + 1}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 border-t border-so-border-dim">
            <span className="text-xxs text-so-text-3">↑↓ navigate</span>
            <span className="text-xxs text-so-text-3">↵ jump</span>
            <span className="ml-auto text-xxs text-so-text-3">{filtered.length} scene{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * RightPanel — Phase 5
 *
 * Three tabs:
 *   - Notes   : scene-specific and project-level notes (fully functional in Phase 5)
 *   - Outline : synopsis list of all scenes
 *   - Board   : compact index-card board alongside the editor
 *
 * Phase 5 notes:
 *   - Notes can be created, edited inline, and deleted
 *   - Notes created from the + button attach to the active scene (or project if none)
 *   - Scene notes section shows the active scene name for context
 *   - Inline textarea with auto-save on blur
 */

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Quote } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { Note } from '../../types'
import type { Editor } from '@tiptap/core'

export function RightPanel(): React.JSX.Element {
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const selectionText = useDocumentStore((s) => s.selectionText)
  const addNote = useDocumentStore((s) => s.addNote)
  const editor = useScreenplayEditor()

  const handleAddNote = () => {
    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      sceneId: activeSceneId ?? null,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addNote(note)
  }

  const handleCommentOnSelection = () => {
    if (!editor || !selectionText) return
    const highlightId = Math.random().toString(36).slice(2, 11)
    // Apply the comment highlight mark to the current selection
    editor.chain().focus().setMark('commentHighlight', { highlightId }).run()
    // Create an anchored note
    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      sceneId: activeSceneId ?? null,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedText: selectionText.slice(0, 120),
      highlightId,
    }
    addNote(note)
  }

  return (
    <div className="shell-panel flex flex-col h-full border-l overflow-hidden">
      {/* Header */}
      <div className="editor-chrome flex items-center border-b border-so-border-dim flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-so-text border-b-2 border-so-accent">
          <MessageSquare size={13} />
          Notes
        </div>

        <div className="flex-1" />

        {selectionText && editor && (
          <Tooltip content="Anchor a note to selected text" side="left">
            <IconButton label="Comment on selection" size="sm" className="mr-1" onClick={handleCommentOnSelection}>
              <Quote size={13} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip content={activeSceneId ? 'Add scene note' : 'Add project note'} side="left">
          <IconButton label="Add Note" size="sm" className="mr-1" onClick={handleAddNote}>
            <Plus size={13} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Content — Notes only */}
      <div className="flex-1 overflow-y-auto">
        <NotesPanel editor={editor} />
      </div>
    </div>
  )
}

// ── Notes panel ───────────────────────────────────────────────────────────────

function NotesPanel({ editor }: { editor: Editor | null }): React.JSX.Element {
  const notes = useDocumentStore((s) => s.notes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const scenes = useDocumentStore((s) => s.scenes)
  const addNote = useDocumentStore((s) => s.addNote)
  const removeNote = useDocumentStore((s) => s.removeNote)
  const updateNote = useDocumentStore((s) => s.updateNote)

  const activeScene = scenes.find((s) => s.id === activeSceneId)
  const sceneNotes = notes.filter((n) => n.sceneId === activeSceneId)
  const projectNotes = notes.filter((n) => n.sceneId === null)

  const handleAddSceneNote = () => {
    if (!activeSceneId) return
    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      sceneId: activeSceneId,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addNote(note)
  }

  const handleAddProjectNote = () => {
    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      sceneId: null,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addNote(note)
  }

  return (
    <div className="p-3 space-y-4">
      {/* Scene notes — visible only when cursor is in a scene */}
      {activeSceneId && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xxs font-semibold text-so-text-3 uppercase tracking-wider">
              {activeScene ? activeScene.heading : 'Scene Notes'}
            </h3>
            <Tooltip content="Add scene note" side="left">
              <button
                type="button"
                onClick={handleAddSceneNote}
                className="text-so-text-3 hover:text-so-text-2 transition-colors p-0.5 rounded"
                aria-label="Add scene note"
              >
                <Plus size={11} />
              </button>
            </Tooltip>
          </div>

          {sceneNotes.length === 0 ? (
            <p className="text-xxs text-so-text-3 italic">No notes for this scene.</p>
          ) : (
            <ul className="space-y-2">
              {sceneNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  editor={editor}
                  onSave={(content) => updateNote(note.id, content)}
                  onDelete={() => removeNote(note.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Project notes — always visible */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xxs font-semibold text-so-text-3 uppercase tracking-wider">
            Project Notes
          </h3>
          <Tooltip content="Add project note" side="left">
            <button
              type="button"
              onClick={handleAddProjectNote}
              className="text-so-text-3 hover:text-so-text-2 transition-colors p-0.5 rounded"
              aria-label="Add project note"
            >
              <Plus size={11} />
            </button>
          </Tooltip>
        </div>

        {projectNotes.length === 0 ? (
          <EmptyNotes />
        ) : (
          <ul className="space-y-2">
            {projectNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                editor={editor}
                onSave={(content) => updateNote(note.id, content)}
                onDelete={() => removeNote(note.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// ── Note card ─────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note
  editor: Editor | null
  onSave: (content: string) => void
  onDelete: () => void
}

function NoteCard({ note, editor, onSave, onDelete }: NoteCardProps): React.JSX.Element {
  const [editing, setEditing] = useState(note.content === '')
  const [value, setValue] = useState(note.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus new empty notes
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleBlur = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      onDelete() // Remove empty notes on blur
    } else {
      onSave(trimmed)
      setEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      if (!value.trim()) {
        onDelete()
      } else {
        onSave(value.trim())
        setEditing(false)
      }
    }
  }

  // Scroll the editor to the anchored highlight mark
  const handleScrollToHighlight = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editor || !note.highlightId) return
    let targetPos: number | null = null
    editor.state.doc.descendants((node, pos) => {
      if (targetPos !== null) return false
      if (node.marks.some((m) => m.type.name === 'commentHighlight' && m.attrs.highlightId === note.highlightId)) {
        targetPos = pos
        return false
      }
    })
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).scrollIntoView().run()
    }
  }

  const snippetLabel = note.selectedText
    ? `"${note.selectedText.length > 60 ? note.selectedText.slice(0, 60) + '…' : note.selectedText}"`
    : null

  if (editing) {
    return (
      <li className="bg-so-elevated border border-so-accent-dim rounded p-2">
        {snippetLabel && (
          <button
            type="button"
            onClick={handleScrollToHighlight}
            className="w-full text-left mb-1.5 px-2 py-1 bg-so-bg rounded text-xxs text-so-text-3 italic border-l-2 border-so-accent hover:text-so-text-2 transition-colors"
          >
            {snippetLabel}
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Write a note…"
          className="w-full bg-transparent text-xs text-so-text-2 leading-relaxed resize-none outline-none placeholder:text-so-text-3 selectable"
        />
        <p className="text-xxs text-so-text-3 mt-1">Esc or click away to save · delete to remove</p>
      </li>
    )
  }

  return (
    <li
      className="group bg-so-elevated border border-so-border rounded p-2 cursor-pointer hover:border-so-border"
      onClick={() => setEditing(true)}
    >
      {snippetLabel && (
        <button
          type="button"
          onClick={handleScrollToHighlight}
          className="w-full text-left mb-1.5 px-2 py-1 bg-so-bg rounded text-xxs text-so-text-3 italic border-l-2 border-so-accent hover:text-so-text-2 transition-colors"
        >
          {snippetLabel}
        </button>
      )}
      <div className="flex items-start gap-1.5">
        <p className="flex-1 text-xs text-so-text-2 leading-relaxed selectable whitespace-pre-wrap">
          {note.content}
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-so-error transition-opacity mt-0.5"
          aria-label="Delete note"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </li>
  )
}

function EmptyNotes(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <MessageSquare size={20} className="text-so-text-3" />
      <p className="text-xs text-so-text-3">No notes yet</p>
      <p className="text-xxs text-so-text-3">
        Press + to add a project note.
      </p>
    </div>
  )
}


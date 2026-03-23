/**
 * RightPanel — Notes only (Bug 5 + Bug 4)
 *
 * The right panel now shows only the Notes tab.
 * Outline and Board tabs have been removed (Bug 5).
 * Notes support per-selection anchoring (Bug 4):
 *   - Selecting text in the editor and pressing + anchors the note to that selection
 *   - Anchored notes show the highlighted text snippet
 *   - Clicking an anchored note scrolls to and highlights the text
 */

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useScreenplayEditor } from '../../editor/ScreenplayEditorProvider'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import type { Note } from '../../types'

export function RightPanel(): React.JSX.Element {
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const addNote = useDocumentStore((s) => s.addNote)
  const editor = useScreenplayEditor()

  const handleAddNote = () => {
    // If the editor has a non-empty text selection, anchor the note to it
    let anchorText: string | undefined
    if (editor) {
      const { from, to } = editor.state.selection
      if (from !== to) {
        anchorText = editor.state.doc.textBetween(from, to, ' ').trim().slice(0, 200) || undefined
        // Apply comment highlight mark
        if (anchorText) {
          const noteId = Math.random().toString(36).slice(2, 9)
          const note: Note = {
            id: noteId,
            sceneId: activeSceneId ?? null,
            content: '',
            anchorText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          // Apply the mark before adding note
          editor.chain().focus().setMark('commentHighlight', { noteId }).run()
          addNote(note)
          return
        }
      }
    }

    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      sceneId: activeSceneId ?? null,
      content: '',
      anchorText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addNote(note)
  }

  return (
    <div className="shell-panel flex flex-col h-full border-l overflow-hidden">
      {/* Header */}
      <div className="editor-chrome flex items-center border-b border-so-border-dim flex-shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-so-text border-b-2 border-so-accent pb-0 -mb-2 py-0">
          <MessageSquare size={13} />
          <span>Notes</span>
        </div>
        <div className="flex-1" />
        <Tooltip content={editor && !editor.state.selection.empty ? 'Add note for selection' : (activeSceneId ? 'Add scene note' : 'Add project note')} side="left">
          <IconButton label="Add Note" size="sm" onClick={handleAddNote}>
            <Plus size={13} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <NotesPanel />
      </div>
    </div>
  )
}

// ── Notes panel ───────────────────────────────────────────────────────────────

function NotesPanel(): React.JSX.Element {
  const notes = useDocumentStore((s) => s.notes)
  const activeSceneId = useDocumentStore((s) => s.activeSceneId)
  const scenes = useDocumentStore((s) => s.scenes)
  const removeNote = useDocumentStore((s) => s.removeNote)
  const updateNote = useDocumentStore((s) => s.updateNote)
  const editor = useScreenplayEditor()

  const activeScene = scenes.find((s) => s.id === activeSceneId)
  const sceneNotes = notes.filter((n) => n.sceneId === activeSceneId)
  const projectNotes = notes.filter((n) => n.sceneId === null)

  const handleNoteClick = (note: Note) => {
    if (!note.anchorText || !editor) return
    // Search for the anchor text in the document and scroll to it
    const doc = editor.state.doc
    const searchText = note.anchorText
    let foundPos: number | null = null

    doc.descendants((node, pos) => {
      if (foundPos !== null) return false
      if (node.isText && node.text && node.text.includes(searchText)) {
        foundPos = pos + node.text.indexOf(searchText)
        return false
      }
    })

    if (foundPos !== null) {
      editor.chain().focus().setTextSelection({ from: foundPos, to: foundPos + searchText.length }).scrollIntoView().run()
    }
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
          </div>

          {sceneNotes.length === 0 ? (
            <p className="text-xxs text-so-text-3 italic">No notes for this scene.</p>
          ) : (
            <ul className="space-y-2">
              {sceneNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSave={(content) => updateNote(note.id, content)}
                  onDelete={() => {
                    // Remove comment highlight mark for this note
                    if (note.anchorText && editor) {
                      editor.chain().unsetMark('commentHighlight').run()
                    }
                    removeNote(note.id)
                  }}
                  onAnchorClick={() => handleNoteClick(note)}
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
        </div>

        {projectNotes.length === 0 ? (
          <EmptyNotes />
        ) : (
          <ul className="space-y-2">
            {projectNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSave={(content) => updateNote(note.id, content)}
                onDelete={() => removeNote(note.id)}
                onAnchorClick={() => handleNoteClick(note)}
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
  onSave: (content: string) => void
  onDelete: () => void
  onAnchorClick?: () => void
}

function NoteCard({ note, onSave, onDelete, onAnchorClick }: NoteCardProps): React.JSX.Element {
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

  if (editing) {
    return (
      <li className="bg-so-elevated border border-so-accent-dim rounded p-2">
        {note.anchorText && (
          <p className="text-xxs text-so-text-3 mb-1.5 px-1 py-0.5 bg-[rgba(255,220,0,0.12)] border-l-2 border-[rgba(255,220,0,0.5)] rounded-r italic truncate">
            "{note.anchorText}"
          </p>
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
    <li className="group bg-so-elevated border border-so-border rounded p-2 cursor-pointer hover:border-so-border-strong"
      onClick={() => setEditing(true)}
    >
      {/* Anchor text snippet — click to scroll to it in the editor */}
      {note.anchorText && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAnchorClick?.() }}
          className="w-full text-left text-xxs text-so-text-3 mb-1.5 px-1 py-0.5 bg-[rgba(255,220,0,0.12)] hover:bg-[rgba(255,220,0,0.2)] border-l-2 border-[rgba(255,220,0,0.5)] rounded-r italic truncate transition-colors"
          title="Click to jump to highlighted text"
        >
          "{note.anchorText}"
        </button>
      )}
      <div className="flex items-start gap-1.5">
        <p className="flex-1 text-xs text-so-text leading-relaxed selectable whitespace-pre-wrap">
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


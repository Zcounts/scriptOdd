/**
 * SettingsPanel — Phase 6
 *
 * A tasteful slide-over settings panel for the dark creative editor.
 * Triggered by the gear icon in TopToolbar (also Ctrl+,).
 *
 * Sections:
 *   Appearance  — theme selector, typography (font size, line height)
 *   Layout      — preset switcher, panel visibility, reset
 *   Page        — page size, margin preset, page chrome toggle
 *   Editor      — semantic highlight controls (moved here from toolbar)
 */

import React, { useEffect, useRef } from 'react'
import {
  X,
  Moon,
  Sun,
  Contrast,
  LayoutTemplate,
  PenLine,
  PanelRight,
  FileText,
  BookOpen,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useLayoutStore } from '../../store/layoutStore'
import type { Theme, EditorFontSize, EditorLineHeight, PageSize, PageMarginsPreset, LayoutPresetName } from '../../types'

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-5 pb-1.5">
      <span className="text-xxs font-semibold uppercase tracking-widest text-so-text-3">
        {children}
      </span>
    </div>
  )
}

function SectionDivider() {
  return <div className="mx-5 my-3 border-t border-so-border-dim" />
}

interface OptionGroupProps {
  label: string
  children: React.ReactNode
}

function OptionRow({ label, children }: OptionGroupProps) {
  return (
    <div className="flex items-center justify-between px-5 py-2">
      <span className="text-xs text-so-text-2">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  )
}

interface SegmentButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}

function SegmentBtn({ active, onClick, children, title }: SegmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'h-7 px-2.5 text-xs rounded transition-colors duration-100',
        active
          ? 'bg-so-accent-dim text-so-accent-hi font-medium'
          : 'text-so-text-3 hover:text-so-text-2 hover:bg-so-active',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Theme cards ───────────────────────────────────────────────────────────────

interface ThemeCardProps {
  id: Theme
  label: string
  icon: React.ReactNode
  preview: string
  active: boolean
  onClick: () => void
}

function ThemeCard({ id, label, icon, preview, active, onClick }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Switch to ${label}`}
      className={[
        'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all duration-150 flex-1',
        active
          ? 'border-so-accent bg-so-accent-dim text-so-accent-hi'
          : 'border-so-border text-so-text-3 hover:border-so-border hover:text-so-text-2 hover:bg-so-active',
      ].join(' ')}
    >
      <div
        className="w-full h-10 rounded overflow-hidden border border-so-border-dim"
        style={{ background: preview }}
        aria-hidden
      >
        <div className="w-full h-full opacity-60" />
      </div>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xxs font-medium">{label}</span>
      </div>
    </button>
  )
}

// ── Layout preset cards ───────────────────────────────────────────────────────

interface PresetCardProps {
  id: LayoutPresetName
  label: string
  description: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}

function PresetCard({ label, description, icon, active, onClick }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-150 text-left w-full',
        active
          ? 'border-so-accent bg-so-accent-dim text-so-accent-hi'
          : 'border-so-border text-so-text-2 hover:border-so-border hover:text-so-text hover:bg-so-active',
      ].join(' ')}
    >
      <span className={active ? 'text-so-accent-hi' : 'text-so-text-3'}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium leading-tight">{label}</div>
        <div className="text-xxs text-so-text-3 leading-tight mt-0.5">{description}</div>
      </div>
    </button>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        'relative w-8 h-5 rounded-full transition-colors duration-150 flex-shrink-0',
        checked ? 'bg-so-accent' : 'bg-so-border',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
          checked ? 'translate-x-3' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ── Main SettingsPanel ────────────────────────────────────────────────────────

export function SettingsPanel() {
  const panelRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme } = useAppStore()
  const {
    settingsPanelOpen,
    closeSettingsPanel,
    editorFontSize,
    setEditorFontSize,
    editorLineHeight,
    setEditorLineHeight,
    pageSize,
    setPageSize,
    pageMarginsPreset,
    setPageMarginsPreset,
    showPageChrome,
    toggleShowPageChrome,
    semanticHighlight,
    toggleSemanticHighlight,
    highlightStyle,
    setHighlightStyle,
    highlightIntensity,
    setHighlightIntensity,
  } = useSettingsStore()

  const {
    layoutPreset,
    applyLayoutPreset,
    leftSidebarVisible,
    rightPanelVisible,
    toggleLeftSidebar,
    toggleRightPanel,
    resetPanelSizes,
  } = useLayoutStore()

  // Close on Escape
  useEffect(() => {
    if (!settingsPanelOpen) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettingsPanel()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [settingsPanelOpen, closeSettingsPanel])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      closeSettingsPanel()
    }
  }

  if (!settingsPanelOpen) return null

  const THEMES: { id: Theme; label: string; icon: React.ReactNode; preview: string }[] = [
    { id: 'dark',          label: 'Dark',    icon: <Moon size={11} />,     preview: 'linear-gradient(135deg,#0c0c0f 50%,#131316 50%)' },
    { id: 'light',         label: 'Light',   icon: <Sun size={11} />,      preview: 'linear-gradient(135deg,#f4f4f7 50%,#ffffff 50%)' },
    { id: 'high-contrast', label: 'Draft',   icon: <Contrast size={11} />, preview: 'linear-gradient(135deg,#000000 50%,#0d0d0d 50%)' },
  ]

  const PRESETS: { id: LayoutPresetName; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'default',  label: 'Default',  description: 'Navigator + notes panels',    icon: <LayoutTemplate size={14} /> },
    { id: 'writer',   label: 'Writer',   description: 'Navigator only, wide editor', icon: <PenLine size={14} /> },
    { id: 'research', label: 'Research', description: 'Right panel only',            icon: <PanelRight size={14} /> },
    { id: 'focus',    label: 'Focus',    description: 'Full screen, no chrome',      icon: <BookOpen size={14} /> },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
      style={{ background: 'rgba(0,0,0,0.35)' }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        className="relative flex flex-col h-full w-72 bg-so-surface border-l border-so-border shadow-2xl overflow-y-auto"
        style={{ animation: 'slide-in-right 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-so-border-dim">
          <span className="text-sm font-semibold text-so-text">Settings</span>
          <button
            type="button"
            onClick={closeSettingsPanel}
            className="w-6 h-6 flex items-center justify-center rounded text-so-text-3 hover:text-so-text hover:bg-so-active transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Appearance ─────────────────────────────────────────────────────── */}
        <SectionHeader>Appearance</SectionHeader>

        {/* Theme selector */}
        <div className="px-5 flex gap-2">
          {THEMES.map((t) => (
            <ThemeCard
              key={t.id}
              {...t}
              active={theme === t.id}
              onClick={() => setTheme(t.id)}
            />
          ))}
        </div>

        <SectionDivider />

        {/* Typography */}
        <OptionRow label="Font Size">
          <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
            {(['sm', 'md', 'lg'] as EditorFontSize[]).map((s) => (
              <SegmentBtn key={s} active={editorFontSize === s} onClick={() => setEditorFontSize(s)} title={s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}>
                {s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}
              </SegmentBtn>
            ))}
          </div>
        </OptionRow>

        <OptionRow label="Line Spacing">
          <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
            {([
              { id: 'normal', icon: <AlignLeft size={11} />, title: 'Normal' },
              { id: 'relaxed', icon: <AlignCenter size={11} />, title: 'Relaxed' },
              { id: 'spacious', icon: <AlignRight size={11} />, title: 'Spacious' },
            ] as { id: EditorLineHeight; icon: React.ReactNode; title: string }[]).map(({ id, icon, title }) => (
              <SegmentBtn key={id} active={editorLineHeight === id} onClick={() => setEditorLineHeight(id)} title={title}>
                {icon}
              </SegmentBtn>
            ))}
          </div>
        </OptionRow>

        <SectionDivider />

        {/* ── Semantic Highlight ─────────────────────────────────────────────── */}
        <SectionHeader>Highlights</SectionHeader>

        <OptionRow label="Character / Location Colors">
          <Toggle checked={semanticHighlight} onChange={toggleSemanticHighlight} />
        </OptionRow>

        {semanticHighlight && (
          <>
            <OptionRow label="Style">
              <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
                <SegmentBtn active={highlightStyle === 'minimal'} onClick={() => setHighlightStyle('minimal')} title="Border only">
                  Min
                </SegmentBtn>
                <SegmentBtn active={highlightStyle === 'vivid'} onClick={() => setHighlightStyle('vivid')} title="Background tint">
                  Vivid
                </SegmentBtn>
              </div>
            </OptionRow>
            <OptionRow label="Intensity">
              <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <SegmentBtn key={lvl} active={highlightIntensity === lvl} onClick={() => setHighlightIntensity(lvl)} title={lvl.charAt(0).toUpperCase() + lvl.slice(1)}>
                    {lvl.charAt(0).toUpperCase()}
                  </SegmentBtn>
                ))}
              </div>
            </OptionRow>
          </>
        )}

        <SectionDivider />

        {/* ── Layout ─────────────────────────────────────────────────────────── */}
        <SectionHeader>Layout</SectionHeader>

        <div className="px-5 grid grid-cols-2 gap-1.5 pb-1">
          {PRESETS.map((p) => (
            <PresetCard
              key={p.id}
              {...p}
              active={layoutPreset === p.id}
              onClick={() => applyLayoutPreset(p.id)}
            />
          ))}
        </div>

        <SectionDivider />

        {/* Panel toggles */}
        <OptionRow label="Navigator Panel">
          <Toggle checked={leftSidebarVisible} onChange={toggleLeftSidebar} />
        </OptionRow>
        <OptionRow label="Notes Panel">
          <Toggle checked={rightPanelVisible} onChange={toggleRightPanel} />
        </OptionRow>

        <div className="px-5 mt-2 mb-1">
          <button
            type="button"
            onClick={resetPanelSizes}
            className="text-xxs text-so-text-3 hover:text-so-text-2 underline decoration-dotted transition-colors"
          >
            Reset panel sizes to default
          </button>
        </div>

        <SectionDivider />

        {/* ── Page View ──────────────────────────────────────────────────────── */}
        <SectionHeader>Page View</SectionHeader>

        <OptionRow label="Page Size">
          <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
            {(['letter', 'a4'] as PageSize[]).map((s) => (
              <SegmentBtn key={s} active={pageSize === s} onClick={() => setPageSize(s)} title={s === 'letter' ? 'US Letter (8.5×11in)' : 'A4 (8.27×11.69in)'}>
                {s === 'letter' ? 'Letter' : 'A4'}
              </SegmentBtn>
            ))}
          </div>
        </OptionRow>

        <OptionRow label="Margins">
          <div className="flex bg-so-bg rounded overflow-hidden border border-so-border-dim">
            {([
              { id: 'compact', label: 'Tight' },
              { id: 'standard', label: 'Std' },
              { id: 'wide', label: 'Wide' },
            ] as { id: PageMarginsPreset; label: string }[]).map(({ id, label }) => (
              <SegmentBtn key={id} active={pageMarginsPreset === id} onClick={() => setPageMarginsPreset(id)}>
                {label}
              </SegmentBtn>
            ))}
          </div>
        </OptionRow>

        <OptionRow label="Page Chrome">
          <Toggle checked={showPageChrome} onChange={toggleShowPageChrome} />
        </OptionRow>

        {/* Bottom spacer */}
        <div className="flex-1 min-h-6" />
      </div>
    </div>
  )
}

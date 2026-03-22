/**
 * hooks/useProjectOperations.ts — Phase 7
 *
 * Central hook for all project lifecycle operations:
 *   newProject   — clear state, load empty content
 *   openProject  — file dialog → parse → hydrate stores
 *   saveProject  — gather state → serialize → write file
 *   saveProjectAs — same but always prompts for path
 *   exportPDF    — build print HTML → IPC → printToPDF
 *   exportFountain — serialize to Fountain → IPC → write file
 *   loadCrashRecovery — hydrate from crash recovery data string
 *
 * All store writes happen *before* the editor content is set so that
 * `deriveScenes()` in the editor's onUpdate callback can merge the
 * restored scene metadata (synopsis, color) correctly.
 */

import { useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useDocumentStore } from '../store/documentStore'
import { useAutocompleteStore } from '../store/autocompleteStore'
import { useLayoutStore } from '../store/layoutStore'
import { useSettingsStore } from '../store/settingsStore'
import { useAppStore } from '../store/appStore'
import { useToastStore } from '../store/toastStore'
import {
  serializeProject,
  deserializeProject,
  makeDefaultMeta,
  makeEmptyEditorContent,
  type SoddEntities,
  type SoddLayout,
  type SoddSettings,
} from '../persistence/format'
import { fountainToJSON, jsonToFountain } from '../persistence/fountain'
import { buildPdfHtml } from '../persistence/pdf'
import type { ProjectMeta } from '../types'

// ─────────────────────────────────────────────────────────────────────────────

function gatherEntities(): SoddEntities {
  const s = useAutocompleteStore.getState()
  return {
    characters: s.characters,
    locations: s.locations,
    sceneHeadings: s.sceneHeadings,
    transitions: s.transitions,
    props: s.props,
    characterColors: s.characterColors,
    locationColors: s.locationColors,
    propColors: s.propColors,
  }
}

function gatherLayout(): SoddLayout {
  const s = useLayoutStore.getState()
  return {
    leftSidebarVisible: s.leftSidebarVisible,
    rightPanelVisible: s.rightPanelVisible,
    leftSidebarSize: s.leftSidebarSize,
    rightPanelSize: s.rightPanelSize,
    activeView: s.activeView,
    leftSidebarTab: s.leftSidebarTab,
    rightPanelTab: s.rightPanelTab,
    layoutPreset: s.layoutPreset,
  }
}

function gatherSettings(): SoddSettings {
  const s = useSettingsStore.getState()
  const a = useAppStore.getState()
  return {
    semanticHighlight: s.semanticHighlight,
    highlightIntensity: s.highlightIntensity,
    highlightStyle: s.highlightStyle,
    editorFontSize: s.editorFontSize,
    editorLineHeight: s.editorLineHeight,
    pageSize: s.pageSize,
    pageMarginsPreset: s.pageMarginsPreset,
    showPageChrome: s.showPageChrome,
    theme: a.theme,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useProjectOperations() {
  const toast = useToastStore.getState().push

  // ── Serialize current state into the project file string ──────────────────

  const buildProjectData = useCallback((): string | null => {
    const { project, filePath } = useProjectStore.getState()
    const { editorContent, scenes, notes } = useDocumentStore.getState()

    if (!editorContent) return null

    const meta: ProjectMeta = project ?? { ...makeDefaultMeta(), updatedAt: new Date().toISOString() }

    return serializeProject(
      meta,
      editorContent,
      scenes,
      notes,
      gatherEntities(),
      gatherLayout(),
      gatherSettings(),
    )
  }, [])

  // ── Hydrate all stores from a parsed project file ────────────────────────

  const hydrateFromFile = useCallback(
    (file: ReturnType<typeof deserializeProject>['file'], filePath?: string) => {
      if (!file) return

      // 1. Project metadata + file path
      useProjectStore.getState().setProject(file.meta, filePath)

      // 2. Notes
      const { notes } = file
      // Replace notes array in document store
      useDocumentStore.setState({ notes: notes ?? [] })

      // 3. Entities (must be before editor load so colors are already known)
      if (file.entities) {
        const e = file.entities
        useAutocompleteStore.setState({
          characters: e.characters ?? [],
          locations: e.locations ?? [],
          sceneHeadings: e.sceneHeadings ?? [],
          transitions: e.transitions ?? ['FADE OUT.', 'CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:'],
          props: e.props ?? [],
          characterColors: e.characterColors ?? {},
          locationColors: e.locationColors ?? {},
          propColors: e.propColors ?? {},
        })
      }

      // 4. Scene metadata (synopsis, color, etc.) — set before editor load
      //    so deriveScenes() in onUpdate can merge them
      if (file.scenes?.length) {
        useDocumentStore.getState().initScenes(file.scenes)
      }

      // 5. Layout (optional restore)
      if (file.layout) {
        const l = file.layout
        useLayoutStore.setState({
          leftSidebarVisible: l.leftSidebarVisible ?? true,
          rightPanelVisible: l.rightPanelVisible ?? true,
          leftSidebarSize: l.leftSidebarSize ?? 18,
          rightPanelSize: l.rightPanelSize ?? 22,
          activeView: (l.activeView as 'draft' | 'page' | 'board') ?? 'draft',
          leftSidebarTab: (l.leftSidebarTab as 'navigator' | 'characters' | 'locations' | 'props') ?? 'navigator',
          rightPanelTab: (l.rightPanelTab as 'notes' | 'outline' | 'board') ?? 'notes',
          layoutPreset: (l.layoutPreset as 'default' | 'writer' | 'focus' | 'research') ?? 'default',
        })
      }

      // 6. Settings (optional restore)
      if (file.settings) {
        const s = file.settings
        if (s.theme) {
          useAppStore.getState().setTheme(s.theme as 'dark' | 'light' | 'high-contrast')
        }
        useSettingsStore.setState({
          semanticHighlight: s.semanticHighlight ?? true,
          highlightIntensity: (s.highlightIntensity as 'low' | 'medium' | 'high') ?? 'medium',
          highlightStyle: (s.highlightStyle as 'minimal' | 'vivid') ?? 'minimal',
          editorFontSize: (s.editorFontSize as 'sm' | 'md' | 'lg') ?? 'md',
          editorLineHeight: (s.editorLineHeight as 'normal' | 'relaxed' | 'spacious') ?? 'relaxed',
          pageSize: (s.pageSize as 'letter' | 'a4') ?? 'letter',
          pageMarginsPreset: (s.pageMarginsPreset as 'compact' | 'standard' | 'wide') ?? 'standard',
          showPageChrome: s.showPageChrome ?? true,
        })
      }

      // 7. Trigger editor content load — editor provider watches pendingLoad
      useDocumentStore.getState().setPendingLoad(file.editorContent)

      // 8. Add to recent files
      if (filePath && file.meta.title) {
        useAppStore.getState().addRecentProject({
          id: file.meta.id || filePath,
          name: file.meta.title,
          filePath,
          lastOpenedAt: new Date().toISOString(),
        })
      }
    },
    [],
  )

  // ── New project ───────────────────────────────────────────────────────────

  const newProject = useCallback(() => {
    const meta = makeDefaultMeta()
    useProjectStore.getState().setProject(meta, undefined)
    useDocumentStore.setState({ notes: [], scenes: [] })
    useAutocompleteStore.getState().clearMemory()
    useDocumentStore.getState().setPendingLoad(makeEmptyEditorContent())
    // Delete any stale crash recovery file
    window.api?.deleteCrashRecovery?.().catch(() => {})
  }, [])

  // ── Open project ──────────────────────────────────────────────────────────

  const openProject = useCallback(async () => {
    if (!window.api) return

    const result = await window.api.openProject()
    if (result.cancelled) return

    if (!result.filePath) {
      toast('Could not determine file path.', 'error')
      return
    }

    if (result.error || !result.data) {
      toast(`Failed to read file: ${result.error ?? 'unknown error'}`, 'error')
      return
    }

    // Detect file type by extension
    const fp = result.filePath
    const isFountain = fp.endsWith('.fountain') || fp.endsWith('.txt')

    if (isFountain) {
      try {
        const { content, meta } = fountainToJSON(result.data)
        const fullMeta: ProjectMeta = {
          ...makeDefaultMeta(),
          ...meta,
          title: meta.title ?? 'Imported Script',
        }
        useProjectStore.getState().setProject(fullMeta, fp)
        useDocumentStore.setState({ notes: [], scenes: [] })
        useDocumentStore.getState().setPendingLoad(content)
        useAppStore.getState().addRecentProject({
          id: fullMeta.id,
          name: fullMeta.title,
          filePath: fp,
          lastOpenedAt: new Date().toISOString(),
        })
      } catch (err) {
        toast(`Failed to import Fountain file: ${String(err)}`, 'error')
        return
      }
    } else {
      // Native .sodd format
      const parsed = deserializeProject(result.data)
      if (!parsed.ok || !parsed.file) {
        toast(`Could not open project: ${parsed.error ?? 'invalid file'}`, 'error')
        return
      }
      hydrateFromFile(parsed.file, result.filePath)
    }

    // Clear crash recovery since we just loaded a clean file
    window.api.deleteCrashRecovery().catch(() => {})
  }, [hydrateFromFile, toast])

  // ── Save project ──────────────────────────────────────────────────────────

  const saveProject = useCallback(async () => {
    if (!window.api) return

    const data = buildProjectData()
    if (!data) return

    const { filePath, markSaved } = useProjectStore.getState()
    const result = await window.api.saveProject({ filePath: filePath ?? undefined, data })

    if (result.success && result.filePath) {
      markSaved(result.filePath)
      // Update recent files name (in case title changed)
      const meta = useProjectStore.getState().project
      if (meta) {
        useAppStore.getState().addRecentProject({
          id: meta.id || result.filePath,
          name: meta.title,
          filePath: result.filePath,
          lastOpenedAt: new Date().toISOString(),
        })
      }
      // Clean crash recovery after successful save
      window.api.deleteCrashRecovery().catch(() => {})
    } else if (!result.success && !result.cancelled) {
      toast(`Save failed: ${result.error ?? 'unknown error'}`, 'error')
    }
  }, [buildProjectData, toast])

  // ── Save As ───────────────────────────────────────────────────────────────

  const saveProjectAs = useCallback(async () => {
    if (!window.api) return

    const data = buildProjectData()
    if (!data) return

    const { markSaved } = useProjectStore.getState()
    const result = await window.api.saveProjectAs({ data })

    if (result.success && result.filePath) {
      markSaved(result.filePath)
      const meta = useProjectStore.getState().project
      if (meta) {
        useAppStore.getState().addRecentProject({
          id: meta.id || result.filePath,
          name: meta.title,
          filePath: result.filePath,
          lastOpenedAt: new Date().toISOString(),
        })
      }
      window.api.deleteCrashRecovery().catch(() => {})
    } else if (!result.success && !result.cancelled) {
      toast(`Save As failed: ${result.error ?? 'unknown error'}`, 'error')
    }
  }, [buildProjectData, toast])

  // ── Export PDF ────────────────────────────────────────────────────────────

  const exportPDF = useCallback(async () => {
    if (!window.api) return

    const { editorContent } = useDocumentStore.getState()
    const meta = useProjectStore.getState().project ?? undefined

    if (!editorContent) return

    toast('Exporting PDF…', 'info')
    const html = buildPdfHtml(editorContent, meta)
    const result = await window.api.exportPDF({ html, title: meta?.title })

    if (result.success) {
      toast('PDF exported successfully.', 'success')
    } else if (!result.cancelled) {
      toast(`PDF export failed: ${result.error ?? 'unknown error'}`, 'error')
    }
  }, [toast])

  // ── Export Fountain ───────────────────────────────────────────────────────

  const exportFountain = useCallback(async () => {
    if (!window.api) return

    const { editorContent } = useDocumentStore.getState()
    const meta = useProjectStore.getState().project ?? undefined

    if (!editorContent) return

    const fountainText = jsonToFountain(editorContent, meta)
    const result = await window.api.exportFountain({
      data: fountainText,
      title: meta?.title,
    })

    if (result.success) {
      toast('Fountain file exported.', 'success')
    } else if (!result.cancelled) {
      toast(`Fountain export failed: ${result.error ?? 'unknown error'}`, 'error')
    }
  }, [toast])

  // ── Crash recovery ────────────────────────────────────────────────────────

  const loadCrashRecovery = useCallback(
    (data: string) => {
      const parsed = deserializeProject(data)
      if (!parsed.ok || !parsed.file) {
        console.error('[crashRecovery] Failed to parse:', parsed.error)
        return false
      }
      hydrateFromFile(parsed.file, undefined)
      return true
    },
    [hydrateFromFile],
  )

  // ── Autosave helper ───────────────────────────────────────────────────────

  /**
   * Called periodically by the autosave timer.
   * Silently saves to the current filePath (if any) and always writes
   * a crash-recovery snapshot.
   */
  const autosave = useCallback(async () => {
    if (!window.api) return

    const data = buildProjectData()
    if (!data) return

    // Always write crash recovery
    window.api.writeCrashRecovery({ data }).catch(() => {})

    // Silently save to disk if we have a file path and there are unsaved changes
    const { filePath, isModified, markSaved } = useProjectStore.getState()
    if (filePath && isModified) {
      const result = await window.api.saveProject({ filePath, data })
      if (result.success && result.filePath) {
        markSaved(result.filePath)
      }
    }
  }, [buildProjectData])

  return {
    newProject,
    openProject,
    saveProject,
    saveProjectAs,
    exportPDF,
    exportFountain,
    loadCrashRecovery,
    autosave,
    buildProjectData,
  }
}

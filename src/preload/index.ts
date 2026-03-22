/**
 * preload/index.ts — Phase 7
 *
 * Secure IPC bridge exposed to the renderer as `window.api`.
 * No raw Node.js or Electron APIs are exposed — only the exact channels needed.
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const api = {
  // ── File operations ──────────────────────────────────────────────────────
  openProject: () =>
    ipcRenderer.invoke('file:open-project') as Promise<OpenProjectResult>,

  saveProject: (payload: SavePayload) =>
    ipcRenderer.invoke('file:save-project', payload) as Promise<SaveResult>,

  saveProjectAs: (payload: { data: string }) =>
    ipcRenderer.invoke('file:save-project-as', payload) as Promise<SaveResult>,

  exportPDF: (payload: { html: string; title?: string }) =>
    ipcRenderer.invoke('file:export-pdf', payload) as Promise<ExportResult>,

  exportFountain: (payload: { data: string; title?: string }) =>
    ipcRenderer.invoke('file:export-fountain', payload) as Promise<ExportResult>,

  // ── Crash recovery ────────────────────────────────────────────────────────
  writeCrashRecovery: (payload: { data: string }) =>
    ipcRenderer.invoke('file:write-crash-recovery', payload) as Promise<{ success: boolean; error?: string }>,

  readCrashRecovery: () =>
    ipcRenderer.invoke('file:read-crash-recovery') as Promise<{ success: boolean; data?: string }>,

  deleteCrashRecovery: () =>
    ipcRenderer.invoke('file:delete-crash-recovery') as Promise<{ success: boolean }>,

  // ── App info ─────────────────────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  getPlatform: () => ipcRenderer.invoke('app:get-platform') as Promise<string>,
  getUserDataPath: () => ipcRenderer.invoke('file:get-user-data-path') as Promise<string>,

  // ── Window controls ───────────────────────────────────────────────────────
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,

  // ── Event subscriptions (main → renderer) ─────────────────────────────────
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_: IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('menu:action', handler)
    return () => ipcRenderer.removeListener('menu:action', handler)
  },

  onWindowStateChanged: (callback: (state: WindowState) => void) => {
    const handler = (_: IpcRendererEvent, state: WindowState) => callback(state)
    ipcRenderer.on('window:state-changed', handler)
    return () => ipcRenderer.removeListener('window:state-changed', handler)
  },
}

contextBridge.exposeInMainWorld('api', api)

// ── Shared types (duplicated in renderer/src/types/electron.d.ts) ──────────

interface OpenProjectResult {
  cancelled: boolean
  filePath?: string
  data?: string
  error?: string
}

interface SavePayload {
  filePath?: string
  data: string
}

interface SaveResult {
  success: boolean
  filePath?: string
  cancelled?: boolean
  error?: string
}

interface ExportResult {
  success: boolean
  filePath?: string
  cancelled?: boolean
  error?: string
}

interface WindowState {
  isMaximized?: boolean
  isFullscreen?: boolean
}

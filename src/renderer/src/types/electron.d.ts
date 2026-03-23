/**
 * Type declarations for the secure IPC bridge exposed by the preload script.
 * These mirror the implementation in src/preload/index.ts.
 *
 * Phase 7: added exportFountain, crash-recovery channels, getUserDataPath.
 */

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

interface UpdateInfo {
  version: string
  releaseDate?: string
}

interface AppAPI {
  // File operations
  openProject: () => Promise<OpenProjectResult>
  saveProject: (payload: SavePayload) => Promise<SaveResult>
  saveProjectAs: (payload: { data: string }) => Promise<SaveResult>
  exportPDF: (payload: { html: string; title?: string }) => Promise<ExportResult>
  exportFountain: (payload: { data: string; title?: string }) => Promise<ExportResult>

  // Crash recovery
  writeCrashRecovery: (payload: { data: string }) => Promise<{ success: boolean; error?: string }>
  readCrashRecovery: () => Promise<{ success: boolean; data?: string }>
  deleteCrashRecovery: () => Promise<{ success: boolean }>

  // App info
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  getUserDataPath: () => Promise<string>

  // Window controls
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>

  // Updater
  checkForUpdates: () => Promise<void>
  installUpdate: () => Promise<void>

  // Event subscriptions — return a cleanup function
  onMenuAction: (callback: (action: string) => void) => () => void
  onWindowStateChanged: (callback: (state: WindowState) => void) => () => void
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateError: (callback: (message: string) => void) => () => void
}

declare global {
  interface Window {
    api: AppAPI
  }
}

export {}

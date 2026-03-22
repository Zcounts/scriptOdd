/**
 * Type declarations for the secure IPC bridge exposed by the preload script.
 * These mirror the implementation in src/preload/index.ts.
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

interface AppAPI {
  // File operations
  openProject: () => Promise<OpenProjectResult>
  saveProject: (payload: SavePayload) => Promise<SaveResult>
  saveProjectAs: (payload: { data: string }) => Promise<SaveResult>
  exportPDF: (payload: unknown) => Promise<ExportResult>

  // App info
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>

  // Window controls
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>

  // Event subscriptions — return a cleanup function
  onMenuAction: (callback: (action: string) => void) => () => void
  onWindowStateChanged: (callback: (state: WindowState) => void) => () => void
}

declare global {
  interface Window {
    api: AppAPI
  }
}

export {}

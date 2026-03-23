/**
 * updater.ts
 *
 * Manages automatic update checks via electron-updater.
 *
 * Behaviour:
 *  - Skipped entirely in dev mode (app.isPackaged === false).
 *  - Runs a silent check immediately on launch.
 *  - After that, rechecks at most once per 24 hours (polls every hour).
 *  - autoDownload is enabled; the update downloads silently in the background.
 *  - When the download is complete, the renderer is notified so it can prompt
 *    the user to restart.
 *  - Manual "Check for Updates" calls bypass the 24-hour throttle.
 */

// electron-updater is a CommonJS module. In an ESM/electron-vite context Rollup
// cannot statically resolve named exports from CJS; use the default import and
// destructure at runtime instead.
import electronUpdater from 'electron-updater'
const { autoUpdater } = electronUpdater
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// ── Throttle state ────────────────────────────────────────────────────────────

const STATE_FILE = join(app.getPath('userData'), 'update-state.json')
const ONE_DAY_MS = 24 * 60 * 60 * 1000

interface UpdateState {
  lastChecked: number
}

function readState(): UpdateState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as UpdateState
    }
  } catch {
    // ignore — treat as never checked
  }
  return { lastChecked: 0 }
}

function writeState(): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({ lastChecked: Date.now() }))
  } catch {
    // non-fatal
  }
}

function shouldAutoCheck(): boolean {
  return Date.now() - readState().lastChecked >= ONE_DAY_MS
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialise the updater and wire events to the renderer.
 * Call once after the main window is created.
 */
export function initUpdater(win: BrowserWindow): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  // Forward all updater events to the renderer process.
  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('update:download-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update:downloaded', {
      version: info.version,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('error', (err) => {
    // Errors are expected on unsigned macOS builds — log but don't surface them
    // as user-visible errors unless the user explicitly requested a check.
    console.error('[updater] error:', err.message)
    win.webContents.send('update:error', err.message)
  })

  // Silent check on launch (always, regardless of throttle).
  runCheck()

  // Periodic background check: wake up every hour, check if 24 h have passed.
  setInterval(() => {
    if (shouldAutoCheck()) {
      runCheck()
    }
  }, 60 * 60 * 1000)
}

/**
 * Trigger an immediate update check.
 * Safe to call from the menu / renderer at any time.
 * Bypasses the 24-hour throttle (this is an explicit user request).
 */
export function checkForUpdates(): void {
  if (!app.isPackaged) return
  runCheck()
}

/**
 * Quit the app and apply the downloaded update.
 * isSilent=false shows the NSIS progress dialog on Windows.
 * isForceRunAfter=true re-launches the app after the installer finishes.
 */
export function quitAndInstall(): void {
  if (!app.isPackaged) return
  autoUpdater.quitAndInstall(false, true)
}

// ── Internal ──────────────────────────────────────────────────────────────────

function runCheck(): void {
  writeState()
  autoUpdater.checkForUpdates().catch((err: Error) => {
    console.error('[updater] checkForUpdates failed:', err.message)
  })
}

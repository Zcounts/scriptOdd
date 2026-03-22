/**
 * fileHandlers.ts — Phase 7
 *
 * Secure IPC handlers for all file operations.  No raw filesystem APIs are
 * exposed to the renderer — only typed channels go through contextBridge.
 *
 * Channels handled here:
 *   file:open-project          — show open dialog, return path + data
 *   file:save-project          — save data to path (prompt if no path given)
 *   file:save-project-as       — always prompt for new path
 *   file:export-pdf            — build hidden window, printToPDF, write file
 *   file:export-fountain       — write plain-text fountain file
 *   file:write-crash-recovery  — write crash session to userData
 *   file:read-crash-recovery   — read crash session from userData
 *   file:delete-crash-recovery — remove crash session file
 *   file:get-user-data-path    — return app.getPath('userData') for diagnostics
 */

import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { readFile, writeFile, mkdir, unlink, access } from 'fs/promises'
import { dirname, join } from 'path'

// Path for the crash-recovery snapshot
const crashRecoveryPath = (): string =>
  join(app.getPath('userData'), 'crash-recovery.sodd')

export function registerFileHandlers(): void {
  // ── Open project ────────────────────────────────────────────────────────────

  ipcMain.handle('file:open-project', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { cancelled: true }

    const result = await dialog.showOpenDialog(win, {
      title: 'Open scriptOdd Project',
      filters: [
        { name: 'scriptOdd Project', extensions: ['sodd'] },
        { name: 'Fountain Script', extensions: ['fountain'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { cancelled: true }
    }

    const filePath = result.filePaths[0]
    try {
      const raw = await readFile(filePath, 'utf-8')
      return { cancelled: false, filePath, data: raw }
    } catch (err) {
      return { cancelled: false, filePath, error: String(err) }
    }
  })

  // ── Save project ────────────────────────────────────────────────────────────

  ipcMain.handle(
    'file:save-project',
    async (_event, payload: { filePath?: string; data: string }) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { success: false, error: 'No window' }

      let savePath = payload.filePath

      if (!savePath) {
        const result = await dialog.showSaveDialog(win, {
          title: 'Save scriptOdd Project',
          defaultPath: 'Untitled.sodd',
          filters: [{ name: 'scriptOdd Project', extensions: ['sodd'] }],
        })
        if (result.canceled || !result.filePath) return { success: false, cancelled: true }
        savePath = result.filePath
      }

      try {
        await mkdir(dirname(savePath), { recursive: true })
        await writeFile(savePath, payload.data, 'utf-8')
        return { success: true, filePath: savePath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    },
  )

  // ── Save As ─────────────────────────────────────────────────────────────────

  ipcMain.handle('file:save-project-as', async (_event, payload: { data: string }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window' }

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Project As…',
      defaultPath: 'Untitled.sodd',
      filters: [{ name: 'scriptOdd Project', extensions: ['sodd'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, cancelled: true }

    try {
      await mkdir(dirname(result.filePath), { recursive: true })
      await writeFile(result.filePath, payload.data, 'utf-8')
      return { success: true, filePath: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── PDF export ──────────────────────────────────────────────────────────────

  ipcMain.handle(
    'file:export-pdf',
    async (_event, payload: { html: string; title?: string }) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { success: false, error: 'No window' }

      const defaultName = payload.title
        ? payload.title.replace(/[/\\:*?"<>|]/g, '_') + '.pdf'
        : 'screenplay.pdf'

      const result = await dialog.showSaveDialog(win, {
        title: 'Export PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      })
      if (result.canceled || !result.filePath) return { success: false, cancelled: true }

      const savePath = result.filePath

      // Write HTML to a temp file so we can load it via file:// URL
      // (data: URLs can be truncated by the OS for large documents)
      const tmpHtml = join(app.getPath('temp'), `scriptodd-pdf-${Date.now()}.html`)

      let pdfWin: BrowserWindow | null = null
      try {
        await writeFile(tmpHtml, payload.html, 'utf-8')

        pdfWin = new BrowserWindow({
          show: false,
          webPreferences: {
            sandbox: true,
            contextIsolation: true,
            javascript: false,
          },
        })

        await pdfWin.loadFile(tmpHtml)

        const pdfBuffer = await pdfWin.webContents.printToPDF({
          pageSize: 'Letter',
          printBackground: false,
          margins: { marginType: 'none' },
        })

        await mkdir(dirname(savePath), { recursive: true })
        await writeFile(savePath, pdfBuffer)

        return { success: true, filePath: savePath }
      } catch (err) {
        return { success: false, error: String(err) }
      } finally {
        pdfWin?.destroy()
        // Clean up temp file (best-effort)
        unlink(tmpHtml).catch(() => {})
      }
    },
  )

  // ── Fountain export ─────────────────────────────────────────────────────────

  ipcMain.handle(
    'file:export-fountain',
    async (_event, payload: { data: string; title?: string }) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { success: false, error: 'No window' }

      const defaultName = payload.title
        ? payload.title.replace(/[/\\:*?"<>|]/g, '_') + '.fountain'
        : 'screenplay.fountain'

      const result = await dialog.showSaveDialog(win, {
        title: 'Export Fountain',
        defaultPath: defaultName,
        filters: [
          { name: 'Fountain Script', extensions: ['fountain'] },
          { name: 'Plain Text', extensions: ['txt'] },
        ],
      })
      if (result.canceled || !result.filePath) return { success: false, cancelled: true }

      try {
        await mkdir(dirname(result.filePath), { recursive: true })
        await writeFile(result.filePath, payload.data, 'utf-8')
        return { success: true, filePath: result.filePath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    },
  )

  // ── Crash recovery ──────────────────────────────────────────────────────────

  ipcMain.handle('file:write-crash-recovery', async (_event, payload: { data: string }) => {
    try {
      const p = crashRecoveryPath()
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, payload.data, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('file:read-crash-recovery', async () => {
    try {
      const p = crashRecoveryPath()
      await access(p) // throws if not found
      const data = await readFile(p, 'utf-8')
      return { success: true, data }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle('file:delete-crash-recovery', async () => {
    try {
      await unlink(crashRecoveryPath())
      return { success: true }
    } catch {
      return { success: true } // already gone is fine
    }
  })

  // ── Diagnostics ─────────────────────────────────────────────────────────────

  ipcMain.handle('file:get-user-data-path', () => app.getPath('userData'))
}

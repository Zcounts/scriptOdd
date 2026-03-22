import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

export function registerFileHandlers(): void {
  /**
   * Show open dialog and return file path + content.
   * Full file I/O is wired up in Phase 7; this scaffold returns the chosen path.
   */
  ipcMain.handle('file:open-project', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { cancelled: true }

    const result = await dialog.showOpenDialog(win, {
      title: 'Open scriptOdd Project',
      filters: [
        { name: 'scriptOdd Project', extensions: ['sodd'] },
        { name: 'Fountain Script', extensions: ['fountain'] },
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

  /**
   * Save project data to a given path, or prompt for path if none provided.
   */
  ipcMain.handle('file:save-project', async (_event, payload: { filePath?: string; data: string }) => {
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
  })

  /**
   * Always prompt for a new save path (Save As).
   */
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

  /**
   * PDF export placeholder — full implementation in Phase 7.
   */
  ipcMain.handle('file:export-pdf', async (_event, _payload: unknown) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window' }

    const result = await dialog.showSaveDialog(win, {
      title: 'Export PDF',
      defaultPath: 'screenplay.pdf',
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, cancelled: true }

    // PDF generation will be implemented in Phase 7
    return { success: false, error: 'PDF export not yet implemented', filePath: result.filePath }
  })
}

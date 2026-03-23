import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron'

/** Resolve the BrowserWindow for an IPC event, with fallback to the first open window. */
function getWin(event: IpcMainEvent): BrowserWindow | undefined {
  return BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0]
}

export function registerWindowHandlers(): void {
  ipcMain.on('window:minimize', (event: IpcMainEvent) => {
    getWin(event)?.minimize()
  })

  ipcMain.on('window:maximize', (event: IpcMainEvent) => {
    const win = getWin(event)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })

  ipcMain.on('window:close', (event: IpcMainEvent) => {
    getWin(event)?.close()
  })

  ipcMain.handle('window:is-maximized', (event) => {
    return getWin(event as unknown as IpcMainEvent)?.isMaximized() ?? false
  })
}

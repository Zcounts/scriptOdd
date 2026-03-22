import { ipcMain, BrowserWindow, app } from 'electron'
import { registerFileHandlers } from './fileHandlers'
import { registerAppHandlers } from './appHandlers'
import { registerWindowHandlers } from './windowHandlers'

export function registerIpcHandlers(): void {
  registerFileHandlers()
  registerAppHandlers()
  registerWindowHandlers()
}

import { ipcMain } from 'electron'
import { checkForUpdates, quitAndInstall } from '../updater'

export function registerUpdaterHandlers(): void {
  // Renderer requests a manual update check (e.g. from Help → Check for Updates).
  ipcMain.handle('update:check', () => {
    checkForUpdates()
  })

  // Renderer requests quit-and-install after the update is downloaded.
  ipcMain.handle('update:install', () => {
    quitAndInstall()
  })
}

import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { checkForUpdates } from '../updater'

export function registerUpdaterHandlers(): void {
  // Renderer requests a manual update check (e.g. from Help → Check for Updates).
  ipcMain.handle('update:check', () => {
    checkForUpdates()
  })

  // Renderer requests quit-and-install after the update is downloaded.
  ipcMain.handle('update:install', () => {
    // isSilent=false shows a progress dialog on Windows; isForceRunAfter=true
    // re-launches the app after the installer finishes.
    autoUpdater.quitAndInstall(false, true)
  })
}

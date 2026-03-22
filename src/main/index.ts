import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { createWindow } from './window'
import { buildMenu } from './menu'
import { registerIpcHandlers } from './ipc'

// Security: disable navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const appUrl = process.env['ELECTRON_RENDERER_URL']
    if (appUrl && url.startsWith(appUrl)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

app.whenReady().then(() => {
  registerIpcHandlers()

  const mainWindow = createWindow()

  buildMenu(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

import { BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,              // Custom titlebar in renderer
    titleBarStyle: 'hidden',
    backgroundColor: '#0c0c0f', // Matches dark theme bg before renderer loads
    show: false,               // Show after ready-to-show to avoid flash
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  // Show cleanly once content is ready
  win.on('ready-to-show', () => {
    win.show()
  })

  // Open external links in OS browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Relay window state to renderer for titlebar button states
  win.on('maximize', () => {
    win.webContents.send('window:state-changed', { isMaximized: true })
  })
  win.on('unmaximize', () => {
    win.webContents.send('window:state-changed', { isMaximized: false })
  })
  win.on('enter-full-screen', () => {
    win.webContents.send('window:state-changed', { isFullscreen: true })
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('window:state-changed', { isFullscreen: false })
  })

  // Load the app
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

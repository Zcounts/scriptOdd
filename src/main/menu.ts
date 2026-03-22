import { BrowserWindow, Menu, MenuItemConstructorOptions, app } from 'electron'

/**
 * Sends a named action to the renderer via IPC.
 * The renderer listens on 'menu:action' and dispatches to the appropriate handler.
 */
function sendAction(win: BrowserWindow, action: string): void {
  win.webContents.send('menu:action', action)
}

export function buildMenu(win: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendAction(win, 'file:new-project'),
        },
        {
          label: 'Open Project…',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendAction(win, 'file:open-project'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendAction(win, 'file:save-project'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendAction(win, 'file:save-project-as'),
        },
        { type: 'separator' },
        {
          label: 'Export PDF…',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendAction(win, 'file:export-pdf'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    {
      label: 'View',
      submenu: [
        {
          label: 'Draft View',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendAction(win, 'view:draft'),
        },
        {
          label: 'Page View',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendAction(win, 'view:page'),
        },
        {
          label: 'Board View',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendAction(win, 'view:board'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Left Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => sendAction(win, 'layout:toggle-left-sidebar'),
        },
        {
          label: 'Toggle Right Panel',
          accelerator: 'CmdOrCtrl+Shift+\\',
          click: () => sendAction(win, 'layout:toggle-right-panel'),
        },
        {
          label: 'Focus Mode',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => sendAction(win, 'layout:focus-mode'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => sendAction(win, 'app:toggle-theme'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

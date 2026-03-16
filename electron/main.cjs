// @ts-nocheck

const path = require('path')
const { execFile } = require('child_process')
const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage } = require('electron')
const ClipboardWatcher = require('./clipboard/watcher.cjs')
const HistoryStore = require('./store/history.cjs')
const FavoritesStore = require('./store/favorites.cjs')
const ConfigStore = require('./store/config.cjs')
const CommandsStore = require('./store/commands.cjs')
const CommandExecutor = require('./commands/executor.cjs')
const shortcutUtils = require('./utils/shortcut.cjs')
const autoStartUtils = require('./utils/autoStart.cjs')

let mainWindow = null
let settingsWindow = null
let clipboardWatcher = null

// 存储模块
let historyStore
let favoritesStore
let configStore
let commandsStore
let commandExecutor
let lastFrontmostAppPid = null

function broadcastToWindows(channel, payload) {
  const targets = [mainWindow, settingsWindow]
  targets.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload)
    }
  })
}

function isWindowVisible(win) {
  return Boolean(win && !win.isDestroyed() && win.isVisible())
}

function closeSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close()
  }
}

async function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  captureFrontmostApplication().catch(() => {
    // ignore
  })

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  try {
    app.focus({ steal: true })
  } catch {
    // ignore
  }

  const bringToFront = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.focus()
    mainWindow.moveTop()
    mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
  }

  bringToFront()
  await sleep(40)

  if (!mainWindow.isVisible() || !mainWindow.isFocused()) {
    bringToFront()
  }
}

async function hideAllWindows() {
  closeSettingsWindow()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message))
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function captureFrontmostApplication() {
  if (process.platform !== 'darwin') {
    return
  }

  try {
    const output = await runAppleScript(
      'tell application "System Events" to get unix id of first application process whose frontmost is true'
    )
    const pid = Number.parseInt(output, 10)
    if (Number.isFinite(pid) && pid !== process.pid) {
      lastFrontmostAppPid = pid
    }
  } catch {
    // 无辅助权限时会失败，保留静默降级
  }
}

async function focusLastFrontmostApplication() {
  if (process.platform !== 'darwin' || !lastFrontmostAppPid) {
    return
  }

  try {
    await runAppleScript(
      `tell application "System Events" to set frontmost of first application process whose unix id is ${lastFrontmostAppPid} to true`
    )
  } catch {
    // ignore
  }
}

async function pasteTextAtCursor(text) {
  if (!text) {
    return false
  }

  clipboard.writeText(text)
  mainWindow?.hide()

  if (process.platform === 'darwin') {
    await focusLastFrontmostApplication()
    await sleep(120)
    try {
      await runAppleScript('tell application "System Events" to keystroke "v" using command down')
    } catch (error) {
      console.error('Failed to paste text at cursor:', error)
      return false
    }
  }

  return true
}

function createWindow() {
  const config = configStore.getConfig()
  const { width, height } = config.window

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 360,
    minHeight: 400,
    show: false,
    frame: false,
    transparent: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 开发环境加载本地服务器
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口关闭时隐藏而非退出
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('show', () => {
    mainWindow?.webContents.send('window-opened')
  })

  // 窗口尺寸变化时保存
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [w, h] = mainWindow.getSize()
      configStore.updateWindowSettings({ width: w, height: h })
    }
  })
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) {
      settingsWindow.restore()
    }
    settingsWindow.show()
    settingsWindow.focus()
    return settingsWindow
  }

  const config = configStore.getConfig()
  const { width, height } = config.settingsWindow

  settingsWindow = new BrowserWindow({
    width,
    height,
    minWidth: 560,
    minHeight: 420,
    show: false,
    frame: false,
    transparent: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    settingsWindow.loadURL('http://localhost:5173/?view=settings')
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { view: 'settings' },
    })
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
    settingsWindow?.focus()
  })

  settingsWindow.on('resize', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      const [w, h] = settingsWindow.getSize()
      configStore.updateSettingsWindowSettings({ width: w, height: h })
    }
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  return settingsWindow
}

function openSettingsWindow() {
  return createSettingsWindow()
}

function setupIPCHandlers() {
  ipcMain.handle('get-history', async () => {
    return historyStore.getAll()
  })

  ipcMain.handle('add-history', async (_, item) => {
    return historyStore.add(item)
  })

  ipcMain.handle('delete-history', async (_, id) => {
    favoritesStore.remove(id)
    return historyStore.delete(id)
  })

  ipcMain.handle('clear-history', async () => {
    return historyStore.clear()
  })

  ipcMain.handle('get-favorites', async () => {
    return favoritesStore.getAll()
  })

  ipcMain.handle('toggle-favorite', async (_, id) => {
    const historyItem = historyStore.getById(id)
    const isFavorited = favoritesStore.toggle(id, historyItem?.remark || '')
    historyStore.updateFavorite(id, isFavorited)
    return isFavorited
  })

  ipcMain.handle('update-remark', async (_, id, remark) => {
    const favoriteUpdated = favoritesStore.updateRemark(id, remark)
    const historyUpdated = historyStore.updateRemark(id, remark)
    return favoriteUpdated || historyUpdated
  })

  ipcMain.handle('get-config', async () => {
    return configStore.getConfig()
  })

  ipcMain.handle('update-config', async (_, config) => {
    const previous = configStore.getConfig()
    configStore.updateConfig(config)
    const latest = configStore.getConfig()
    broadcastToWindows('config-updated', latest)

    historyStore.setMaxItems(latest.general.maxHistoryItems)
    autoStartUtils.setAutoStart(Boolean(latest.general.autoStart))

    const shortcutsChanged =
      previous.shortcuts.toggleWindow !== latest.shortcuts.toggleWindow ||
      previous.shortcuts.openSettings !== latest.shortcuts.openSettings

    if (shortcutsChanged && mainWindow && !mainWindow.isDestroyed()) {
      shortcutUtils.setupShortcuts(mainWindow, configStore, {
        beforeShow: captureFrontmostApplication,
        openSettingsWindow,
        showMainWindow,
        hideAllWindows,
        isAnyWindowVisible: () => isWindowVisible(mainWindow) || isWindowVisible(settingsWindow),
      })
    }

    return latest
  })

  ipcMain.handle('get-commands', async () => {
    return commandsStore.getAll()
  })

  ipcMain.handle('add-command', async (_, command) => {
    return commandsStore.add(command)
  })

  ipcMain.handle('update-command', async (_, id, command) => {
    return commandsStore.update(id, command)
  })

  ipcMain.handle('delete-command', async (_, id) => {
    return commandsStore.delete(id)
  })

  ipcMain.handle('reorder-commands', async (_, ids) => {
    return commandsStore.reorder(ids)
  })

  ipcMain.handle('execute-command', async (_, id, params) => {
    const command = commandsStore.getById(id)
    if (command) {
      return commandExecutor.execute(command, params)
    }
    throw new Error('Command not found')
  })

  ipcMain.handle('read-clipboard', async () => {
    const formats = clipboard.availableFormats()
    let content = null
    let type = 'text'

    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      type = 'image'
      content = image.toDataURL()
    } else {
      const text = clipboard.readText()
      if (text) {
        type = 'text'
        content = text
      }
      const filePaths = clipboard.read('public.file-url')
      if (filePaths) {
        type = 'file'
        content = filePaths
      }
    }

    return { type, content, formats }
  })

  ipcMain.handle('write-clipboard', async (_, text) => {
    clipboard.writeText(text)
    return true
  })

  ipcMain.handle('write-image-clipboard', async (_, dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      return false
    }

    try {
      const image = nativeImage.createFromDataURL(dataUrl)
      if (image.isEmpty()) {
        return false
      }
      clipboard.writeImage(image)
      return true
    } catch (error) {
      console.error('Failed to write image clipboard:', error)
      return false
    }
  })

  ipcMain.handle('paste-text-at-cursor', async (_, text) => {
    return pasteTextAtCursor(text)
  })

  ipcMain.handle('hide-window', async () => {
    mainWindow?.hide()
  })

  ipcMain.handle('show-window', async () => {
    await showMainWindow()
  })

  ipcMain.handle('toggle-window', async () => {
    if (isWindowVisible(mainWindow) || isWindowVisible(settingsWindow)) {
      await hideAllWindows()
    } else {
      await showMainWindow()
    }
  })

  ipcMain.handle('open-settings-window', async () => {
    openSettingsWindow()
    return true
  })

  ipcMain.handle('close-settings-window', async () => {
    closeSettingsWindow()
    return true
  })

  ipcMain.handle('quit-app', async () => {
    app.isQuitting = true
    app.quit()
    return true
  })
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    await showMainWindow()
  })

  app.whenReady().then(() => {
    historyStore = new HistoryStore()
    favoritesStore = new FavoritesStore()
    configStore = new ConfigStore()
    commandsStore = new CommandsStore()
    commandExecutor = new CommandExecutor()

    createWindow()

    setupIPCHandlers()

    const initialConfig = configStore.getConfig()
    historyStore.setMaxItems(initialConfig.general.maxHistoryItems)
    autoStartUtils.setAutoStart(Boolean(initialConfig.general.autoStart))
    shortcutUtils.setupShortcuts(mainWindow, configStore, {
      beforeShow: captureFrontmostApplication,
      openSettingsWindow,
      showMainWindow,
      hideAllWindows,
      isAnyWindowVisible: () => isWindowVisible(mainWindow) || isWindowVisible(settingsWindow),
    })

    clipboardWatcher = new ClipboardWatcher(historyStore, (item) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-change', item)
      }
    })
    clipboardWatcher.start()

    app.on('activate', () => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
      } else {
        mainWindow?.show()
      }
    })
  })

  app.on('before-quit', () => {
    app.isQuitting = true
    clipboardWatcher?.stop()
    globalShortcut.unregisterAll()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

if (process.platform === 'darwin') {
  app.dock?.hide()
}

module.exports = { mainWindow, settingsWindow, historyStore, favoritesStore, configStore, commandsStore }

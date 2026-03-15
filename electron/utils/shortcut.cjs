const { globalShortcut } = require('electron')

async function toggleWindow(mainWindow, hooks) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    await hooks.beforeShow?.()
    mainWindow.show()
    mainWindow.focus()
  }
}

async function openSettings(mainWindow, hooks) {
  if (typeof hooks.openSettingsWindow === 'function') {
    await hooks.openSettingsWindow()
    return
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  await hooks.beforeShow?.()
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('shortcut-triggered', 'openSettings')
}

function setupShortcuts(mainWindow, configStore, hooks = {}) {
  if (!mainWindow || !configStore) {
    return
  }

  // 清除所有已注册的快捷键
  globalShortcut.unregisterAll()

  const config = configStore.getConfig()

  // 注册窗口切换快捷键
  const toggleShortcut = config.shortcuts.toggleWindow
  const toggleRegistered = globalShortcut.register(toggleShortcut, async () => {
    await toggleWindow(mainWindow, hooks)
  })
  if (!toggleRegistered) {
    console.error(`Failed to register shortcut ${toggleShortcut}`)
  }

  // 注册设置快捷键
  const settingsShortcut = config.shortcuts.openSettings
  const settingsRegistered = globalShortcut.register(settingsShortcut, async () => {
    await openSettings(mainWindow, hooks)
  })
  if (!settingsRegistered) {
    console.error(`Failed to register shortcut ${settingsShortcut}`)
  }
}

function updateShortcut(
  mainWindow,
  configStore,
  action,
  newShortcut,
  hooks = {}
) {
  const config = configStore.getConfig()
  const oldShortcut = config.shortcuts[action]

  // 注销旧快捷键
  if (oldShortcut) {
    globalShortcut.unregister(oldShortcut)
  }

  const handler = async () => {
    if (action === 'toggleWindow') {
      await toggleWindow(mainWindow, hooks)
    } else if (action === 'openSettings') {
      await openSettings(mainWindow, hooks)
    }
  }

  // 注册新快捷键
  const registered = globalShortcut.register(newShortcut, handler)
  if (registered) {
    // 更新配置
    configStore.updateShortcuts({ [action]: newShortcut })
    return true
  }

  console.error(`Failed to register new shortcut ${newShortcut}`)

  // 尝试恢复旧快捷键
  if (oldShortcut) {
    globalShortcut.register(oldShortcut, handler)
  }
  return false
}

module.exports.setupShortcuts = setupShortcuts
module.exports.updateShortcut = updateShortcut

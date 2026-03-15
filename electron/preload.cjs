const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 历史记录
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (item) => ipcRenderer.invoke('add-history', item),
  deleteHistory: (id) => ipcRenderer.invoke('delete-history', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // 收藏
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  toggleFavorite: (id) => ipcRenderer.invoke('toggle-favorite', id),
  updateRemark: (id, remark) => ipcRenderer.invoke('update-remark', id, remark),

  // 配置
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),

  // 快捷指令
  getCommands: () => ipcRenderer.invoke('get-commands'),
  addCommand: (command) => ipcRenderer.invoke('add-command', command),
  updateCommand: (id, command) => ipcRenderer.invoke('update-command', id, command),
  deleteCommand: (id) => ipcRenderer.invoke('delete-command', id),
  executeCommand: (id, params) => ipcRenderer.invoke('execute-command', id, params),

  // 剪切板
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
  writeImageClipboard: (dataUrl) => ipcRenderer.invoke('write-image-clipboard', dataUrl),
  pasteTextAtCursor: (text) => ipcRenderer.invoke('paste-text-at-cursor', text),

  // 窗口控制
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),

  // 事件监听
  onClipboardChange: (callback) => {
    const listener = (_event, item) => callback(item)
    ipcRenderer.on('clipboard-change', listener)
    return () => ipcRenderer.removeListener('clipboard-change', listener)
  },
  onShortcutTriggered: (callback) => {
    const listener = (_event, action) => callback(action)
    ipcRenderer.on('shortcut-triggered', listener)
    return () => ipcRenderer.removeListener('shortcut-triggered', listener)
  },
  onWindowOpened: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('window-opened', listener)
    return () => ipcRenderer.removeListener('window-opened', listener)
  }
})

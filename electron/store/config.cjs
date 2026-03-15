const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  window: {
    width: 500,
    height: 600
  },
  shortcuts: {
    toggleWindow: 'CommandOrControl+1',
    openSettings: 'CommandOrControl+,'
  },
  general: {
    autoStart: false,
    historyRetentionDays: 30,
    maxHistoryItems: 100,
    imageStorageLimitMB: 200
  }
}

class ConfigStore {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'config.json')
    this.config = this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return { ...DEFAULT_CONFIG }
  }

  save() {
    try {
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getConfig() {
    return { ...this.config }
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config }
    this.save()
  }

  updateWindowSettings(window) {
    this.config.window = { ...this.config.window, ...window }
    this.save()
  }

  updateShortcuts(shortcuts) {
    this.config.shortcuts = { ...this.config.shortcuts, ...shortcuts }
    this.save()
  }

  updateGeneral(general) {
    this.config.general = { ...this.config.general, ...general }
    this.save()
  }

  getShortcut(action) {
    return this.config.shortcuts[action]
  }

  getWindowSettings() {
    return { ...this.config.window }
  }
}

module.exports = ConfigStore

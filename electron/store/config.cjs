const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  window: {
    width: 500,
    height: 600
  },
  settingsWindow: {
    width: 860,
    height: 680
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
  },
  appearance: {
    theme: 'dark',
    settingsZoom: 100,
    language: 'zh-CN'
  }
}

function mergeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    window: {
      ...DEFAULT_CONFIG.window,
      ...config.window,
    },
    settingsWindow: {
      ...DEFAULT_CONFIG.settingsWindow,
      ...config.settingsWindow,
    },
    shortcuts: {
      ...DEFAULT_CONFIG.shortcuts,
      ...config.shortcuts,
    },
    general: {
      ...DEFAULT_CONFIG.general,
      ...config.general,
    },
    appearance: {
      ...DEFAULT_CONFIG.appearance,
      ...config.appearance,
    },
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
        return mergeConfig(JSON.parse(data))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return mergeConfig()
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
    return mergeConfig(this.config)
  }

  updateConfig(config) {
    this.config = mergeConfig({
      ...this.config,
      ...config,
      window: {
        ...this.config.window,
        ...config.window,
      },
      settingsWindow: {
        ...this.config.settingsWindow,
        ...config.settingsWindow,
      },
      shortcuts: {
        ...this.config.shortcuts,
        ...config.shortcuts,
      },
      general: {
        ...this.config.general,
        ...config.general,
      },
      appearance: {
        ...this.config.appearance,
        ...config.appearance,
      },
    })
    this.save()
  }

  updateWindowSettings(window) {
    this.config.window = { ...this.config.window, ...window }
    this.save()
  }

  updateSettingsWindowSettings(window) {
    this.config.settingsWindow = { ...this.config.settingsWindow, ...window }
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
